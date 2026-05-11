// Server-only Stripe client. Never import from client components.

import Stripe from "stripe";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured.");
  cached = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  return cached;
}

export const PRICE_IDS: Record<"individual" | "classes" | "schools", string | undefined> = {
  individual: process.env.STRIPE_PRICE_INDIVIDUAL,
  classes:    process.env.STRIPE_PRICE_CLASSES,
  schools:    process.env.STRIPE_PRICE_SCHOOLS,
};
