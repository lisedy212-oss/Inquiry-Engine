// POST /api/stripe/webhook
// Receives Stripe webhook events. Currently handles:
//   - customer.subscription.created  → set plan to subscribed tier
//   - customer.subscription.updated  → update plan when user changes tier
//   - customer.subscription.deleted  → downgrade to free plan
//   - invoice.payment_failed         → log only (could email later)

import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { clerkClient } from "@clerk/nextjs/server";

// Important: do NOT parse the body — Stripe needs the raw text for signature verification.
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("Missing stripe-signature header", { status: 400 });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe webhook] STRIPE_WEBHOOK_SECRET not configured");
    return new Response("Webhook not configured", { status: 500 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe webhook] signature verification failed:", msg);
    return new Response(`Bad signature: ${msg}`, { status: 400 });
  }

  console.log(`[stripe webhook] received event: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await syncPlanForSubscription(sub);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await downgradeToFree(sub);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subId = (invoice as any).subscription;
        console.warn(`[stripe webhook] payment failed for subscription ${subId}, customer ${invoice.customer}`);
        // Future: email the user / mark account in-dunning
        break;
      }
      default:
        // Ignore other event types
        break;
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[stripe webhook] handler error:", msg);
    return new Response(`Handler error: ${msg}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}

// ─── helpers ────────────────────────────────────────────────────────

function planFromPriceId(priceId: string | undefined): "individual" | "classes" | "schools" | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_INDIVIDUAL) return "individual";
  if (priceId === process.env.STRIPE_PRICE_CLASSES)    return "classes";
  if (priceId === process.env.STRIPE_PRICE_SCHOOLS)    return "schools";
  return null;
}

async function syncPlanForSubscription(sub: Stripe.Subscription) {
  const clerkUserId = (sub.metadata?.clerkUserId as string | undefined) ?? null;
  if (!clerkUserId) {
    console.warn("[stripe webhook] subscription has no clerkUserId metadata; skipping");
    return;
  }

  const priceId = sub.items.data[0]?.price.id;
  const plan = planFromPriceId(priceId);

  // If the subscription is canceled or expired, downgrade.
  const inactive = sub.status === "canceled" || sub.status === "incomplete_expired" || sub.status === "unpaid";
  const finalPlan = inactive ? "free" : (plan ?? "free");

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      plan: finalPlan,
      stripeCustomerId: sub.customer as string,
      stripeSubscriptionId: inactive ? null : sub.id,
    },
  });
  console.log(`[stripe webhook] updated user ${clerkUserId} → plan=${finalPlan} (status=${sub.status})`);
}

async function downgradeToFree(sub: Stripe.Subscription) {
  const clerkUserId = sub.metadata?.clerkUserId as string | undefined;
  if (!clerkUserId) {
    console.warn("[stripe webhook] canceled subscription has no clerkUserId metadata; skipping");
    return;
  }

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: {
      plan: "free",
      stripeCustomerId: sub.customer as string,
      stripeSubscriptionId: null,
    },
  });
  console.log(`[stripe webhook] downgraded user ${clerkUserId} to free (subscription canceled)`);
}
