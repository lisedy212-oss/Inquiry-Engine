// GET /api/stripe/checkout/verify?session_id=...
// Confirms the Stripe Checkout session is paid, then updates the
// signed-in user's Clerk publicMetadata.plan accordingly.

import { NextRequest } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sessionId = new URL(req.url).searchParams.get("session_id");
  if (!sessionId) return err("Missing session_id", 400);

  const session = await stripe().checkout.sessions.retrieve(sessionId);

  // Defensive: ensure the session belongs to this user
  if (session.metadata?.clerkUserId && session.metadata.clerkUserId !== userId) {
    return err("Session does not belong to you", 403);
  }

  if (session.payment_status !== "paid") {
    return err(`Payment not completed (status: ${session.payment_status})`, 400);
  }

  const plan = (session.metadata?.plan as string) ?? "individual";

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(userId, {
    publicMetadata: {
      plan,
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
    },
  });

  return new Response(JSON.stringify({ plan }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}

function err(m: string, s: number) {
  return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } });
}
