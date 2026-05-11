// POST /api/invites/accept { token }
// Accepts an invite for the currently signed-in user.
// Adds them to the class as student or teacher (based on the invite's role).

import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return err("Sign in to accept this invite", 401);

  const user = await currentUser();
  const displayName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Student";
  const avatar = displayName.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

  let body: { token?: string };
  try { body = await req.json(); } catch { return err("Invalid JSON", 400); }
  if (!body.token) return err("Missing token", 400);

  const sb = supabaseServer();
  const { data: invite } = await sb.from("class_invites").select("*").eq("token", body.token).maybeSingle();
  if (!invite) return err("Invite not found", 404);
  if (invite.accepted_at) return err("Invite already used", 410);
  if (new Date(invite.expires_at).getTime() < Date.now()) return err("Invite expired", 410);

  if (invite.role === "teacher") {
    // Add as co-teacher (skip if already there)
    const { data: existing } = await sb.from("class_teachers")
      .select("teacher_id").eq("class_id", invite.class_id).eq("teacher_id", userId).maybeSingle();
    if (!existing) {
      await sb.from("class_teachers").insert({
        class_id: invite.class_id, teacher_id: userId, teacher_name: displayName,
      });
    }
  } else {
    const { data: existing } = await sb.from("class_students")
      .select("student_id").eq("class_id", invite.class_id).eq("student_id", userId).maybeSingle();
    if (!existing) {
      await sb.from("class_students").insert({
        class_id: invite.class_id, student_id: userId, display_name: displayName, avatar, is_mock: false,
      });
    }
  }

  await sb.from("class_invites").update({ accepted_at: new Date().toISOString() }).eq("token", body.token);

  return new Response(JSON.stringify({ ok: true, classId: invite.class_id, role: invite.role }), {
    status: 200, headers: { "Content-Type": "application/json" },
  });
}

function err(m: string, s: number) {
  return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } });
}
