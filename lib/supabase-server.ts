// Server-only Supabase client. Uses the SERVICE ROLE KEY which bypasses
// RLS. NEVER import this from a client component or expose its output
// to the browser. Only use inside `app/api/*` route handlers.
//
// We use a permissive Database type (any) until we wire up generated
// types via `supabase gen types typescript`. Returns are still validated
// at the route level with explicit field reads.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DB = any;

declare global {
  // eslint-disable-next-line no-var
  var __ie_supabase_server__: SupabaseClient<DB> | undefined;
}

export function supabaseServer(): SupabaseClient<DB> {
  if (global.__ie_supabase_server__) return global.__ie_supabase_server__;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local. See SETUP_DATABASE.md.",
    );
  }

  global.__ie_supabase_server__ = createClient<DB>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return global.__ie_supabase_server__;
}
