// POST /api/stripe/checkout { plan: "individual" | "classes" | "schools" }
// Creates a Stripe Checkout Session and returns its URL.

import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe, PRICE_IDS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email) return err("No email on file", 400);

  let body: { plan?: string };
  try { body = await req.json(); } catch { return err("Invalid JSON", 400); }

  const plan = body.plan as keyof typeof PRICE_IDS;
  if (!plan || !(plan in PRICE_IDS)) return err("Invalid plan", 400);
  const priceId = PRICE_IDS[plan];
  if (!priceId) return err(`Price ID for ${plan} not configured`, 500);

  const origin = req.headers.get("origin") ?? "http://localhost:3001";

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { clerkUserId: userId, plan },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing?canceled=1`,
    allow_promotion_codes: true,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}

function err(m: string, s: number) {
  return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } });
}
