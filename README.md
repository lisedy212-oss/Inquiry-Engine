# Inquiry Engine

A Socratic AI tutor for schools. Powered by Claude.

The Inquiry Engine never just gives students the answer — it asks the right questions to guide them to discover the answer themselves. After every conversation, Claude analyzes the transcript and surfaces a Learning DNA profile: concept mastery, misconceptions, growth signals, and aha moments. Teachers see this per-student, scoped to their class.

## Stack

- **Next.js 15** (App Router)
- **Claude API** via `@anthropic-ai/sdk` (Sonnet for chat, Haiku for analysis)
- **Clerk** for authentication
- **Supabase** (Postgres) for persistent storage
- **Stripe** for subscription billing
- **Tailwind CSS** + custom CSS variables for theming

## Local development

```bash
npm install
npm run dev
```

See `SETUP_DATABASE.md` for the one-time Supabase configuration.

## Environment variables

Set these in `.env.local` (never commit this file):

```
ANTHROPIC_API_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/chat
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/pricing
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_INDIVIDUAL=
STRIPE_PRICE_CLASSES=
STRIPE_PRICE_SCHOOLS=
```
