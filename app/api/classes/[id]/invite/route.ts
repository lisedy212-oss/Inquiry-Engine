// POST /api/classes/[id]/invite
// Body: { emails: string[], role?: "student" | "teacher" }
// Creates an invite row + sends email for each address.

import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";
import { sendInviteEmail } from "@/lib/email";

function generateToken(): string {
  // 32 random chars, URL-safe
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 32; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const user = await currentUser();
  const inviterName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Your teacher";

  let body: { emails?: string[]; role?: string };
  try { body = await req.json(); } catch { return err("Invalid JSON", 400); }
  const role = body.role === "teacher" ? "teacher" : "student";
  const emails = (body.emails ?? [])
    .map(e => e.trim().toLowerCase())
    .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  if (emails.length === 0) return err("No valid email addresses provided", 400);

  const sb = supabaseServer();

  // Permission: must be a teacher of this class
  const { data: teacherRow } = await sb.from("class_teachers")
    .select("teacher_id").eq("class_id", classId).eq("teacher_id", userId).maybeSingle();
  if (!teacherRow) return err("You don't teach this class", 403);

  const { data: cls } = await sb.from("classes").select("name").eq("id", classId).maybeSingle();
  if (!cls) return err("Class not found", 404);

  const results: { email: string; ok: boolean; error?: string }[] = [];
  for (const email of emails) {
    const token = generateToken();
    const { error: insertErr } = await sb.from("class_invites").insert({
      class_id: classId, invited_email: email, invited_by: userId, token, role,
    });
    if (insertErr) {
      results.push({ email, ok: false, error: insertErr.message });
      continue;
    }
    const sendResult = await sendInviteEmail({
      to: email, inviterName, className: cls.name, token,
    });
    results.push({ email, ok: sendResult.ok, error: sendResult.error });
  }

  return new Response(JSON.stringify({
    sent: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    results,
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}

function err(m: string, s: number) {
  return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } });
}
