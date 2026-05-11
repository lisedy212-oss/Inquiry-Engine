# Database Setup — Supabase

We're migrating Inquiry Engine from browser-only `localStorage` to a real Postgres database via Supabase. This unlocks cross-device usage, real co-teachers, and production deployment.

This guide takes ~10 minutes. You'll do three things: **create a Supabase project, run the SQL, copy the env vars.**

---

## Step 1 — Create a Supabase project

1. Go to **https://supabase.com** and sign in with GitHub (free tier is fine — no card required)
2. Click **"New Project"**
3. Fill it in:
   - **Name:** `inquiry-engine` (or whatever you want)
   - **Database Password:** click "Generate a password" and save it somewhere safe — you won't need it day-to-day but you can't recover it later
   - **Region:** pick one near you (e.g. `us-east-1` for the US east coast)
   - **Plan:** Free
4. Click **"Create new project"** and wait ~2 minutes for it to provision

---

## Step 2 — Run the schema

1. In the Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"+ New query"**
3. Open this file in your code editor: `supabase/schema.sql`
4. **Copy the entire contents** and paste it into the Supabase SQL editor
5. Click **"Run"** (or `⌘+Enter`)

You should see "Success. No rows returned." That means the tables were created.

To confirm: click **"Table Editor"** in the sidebar — you should see `classes`, `class_teachers`, `class_students`, `snapshots`, `teacher_notes`, `daily_quota`.

---

## Step 3 — Add the env vars

1. In Supabase, click the gear icon → **"API"** (or **"Project Settings → API"**)
2. You'll see two values you need:
   - **Project URL** (looks like `https://abcdefghij.supabase.co`)
   - **Service Role Key** — click "Reveal" under "Project API keys" → **service_role** (NOT anon key — service role is needed)

3. Open `.env.local` in the project root and **add these two lines**:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

> ⚠️ **The service role key bypasses all permissions.** Never commit `.env.local` to git, never expose this key to the browser. The app only uses it from server-side API routes.

4. **Restart your dev server** (`Ctrl+C`, then `npm run dev`) — Next.js only reads env vars at startup.

---

## Step 4 — Test it

Go to `/dashboard` and create a class. It should now persist server-side. To confirm:
- In Supabase Table Editor → `classes` table → you'll see your new row
- Sign in from a different browser (or incognito window) → you should see the same class as a co-teacher when you join with the teacher code

---

## What's been migrated so far

Currently migrated to Supabase:
- ✅ Classes (create, list, join with code, co-teachers, students)
- ✅ Auto-seeded demo students (now persisted server-side)

Still on localStorage (will be migrated next):
- ⏳ Learning DNA snapshots (your real chat data)
- ⏳ Teacher notes
- ⏳ Daily quota tracking
- ⏳ Misconception "mark addressed"

Stays on localStorage (UI preferences only):
- 🟢 Theme, settings, current class context, AI model preference

---

## Troubleshooting

**"Supabase env vars missing"** when you try to use the dashboard
→ You forgot to restart `npm run dev` after adding env vars. Stop and restart it.

**Class created but doesn't show up**
→ Open browser DevTools → Network tab → look at the `/api/classes/mine` response. If it's 500, check the server console (the `npm run dev` terminal) for the actual Supabase error.

**"duplicate key value violates unique constraint"**
→ Two classes ended up with the same code (extremely unlikely — 1 in a million). The create endpoint retries automatically; if it ever bubbles up, just try again.
