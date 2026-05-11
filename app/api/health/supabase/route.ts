// Quick connection check — no auth required. Visit /api/health/supabase
// in the browser to confirm the database is reachable.

import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  try {
    const sb = supabaseServer();
    const { count, error } = await sb.from("classes").select("*", { count: "exact", head: true });
    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({
      ok: true,
      message: "Supabase is connected and the schema is in place.",
      classCount: count ?? 0,
    }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ ok: false, error: msg }), { status: 500 });
  }
}
