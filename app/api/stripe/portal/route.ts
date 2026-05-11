// POST /api/stripe/portal
// Creates a Stripe Customer Portal session for the signed-in user
// so they can cancel, update payment method, view invoices, etc.

import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const user = await currentUser();
  const customerId = user?.publicMetadata?.stripeCustomerId as string | undefined;
  if (!customerId) return err("No Stripe customer on file. You must subscribe first.", 400);

  const origin = req.headers.get("origin") ?? "http://localhost:3001";

  const session = await stripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/pricing`,
  });

  return new Response(JSON.stringify({ url: session.url }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}

function err(m: string, s: number) {
  return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } });
}
