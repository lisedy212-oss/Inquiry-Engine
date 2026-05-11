// GET /api/invites/preview?token=...
// Public preview of an invite — used by the /join/[token] page
// before the user signs in.

import { NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return err("Missing token", 400);

  const sb = supabaseServer();
  const { data: invite } = await sb.from("class_invites").select("*").eq("token", token).maybeSingle();
  if (!invite) return err("Invite not found or expired", 404);
  if (invite.accepted_at) return err("This invite has already been used", 410);
  if (new Date(invite.expires_at).getTime() < Date.now()) return err("This invite has expired", 410);

  const { data: cls } = await sb.from("classes").select("name").eq("id", invite.class_id).maybeSingle();
  if (!cls) return err("Class no longer exists", 404);

  return new Response(JSON.stringify({
    classId: invite.class_id,
    className: cls.name,
    invitedEmail: invite.invited_email,
    role: invite.role,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

function err(m: string, s: number) {
  return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } });
}
