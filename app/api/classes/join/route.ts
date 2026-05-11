// POST /api/classes/join { code } → joins by code, auto-detecting
// whether it's a student code (INQ-XXXX) or teacher code (INQ-T-XXXX).

import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonError("Not signed in", 401);

  const user = await currentUser();
  const displayName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Student";
  const avatar = displayName.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);

  let body: { code?: string };
  try { body = await req.json(); } catch { return jsonError("Invalid JSON", 400); }
  const code = (body.code ?? "").trim().toUpperCase();
  if (!code) return jsonError("Code required", 400);

  const sb = supabaseServer();
  const isTeacherCode = code.startsWith("INQ-T-");

  const { data: cls, error: clsErr } = await sb
    .from("classes")
    .select("*")
    .eq(isTeacherCode ? "teacher_code" : "code", code)
    .maybeSingle();
  if (clsErr) return jsonError(clsErr.message, 500);
  if (!cls) return jsonError("No class found with that code. Double-check with your teacher.", 404);

  if (isTeacherCode) {
    const { data: existing } = await sb
      .from("class_teachers")
      .select("teacher_id")
      .eq("class_id", cls.id).eq("teacher_id", userId).maybeSingle();
    if (existing) return jsonError("You're already teaching this class.", 409);
    const { error } = await sb.from("class_teachers").insert({
      class_id: cls.id, teacher_id: userId, teacher_name: displayName,
    });
    if (error) return jsonError(error.message, 500);
    return jsonOk({ class: cls, joinedAs: "teacher" });
  } else {
    const { data: existing } = await sb
      .from("class_students")
      .select("student_id")
      .eq("class_id", cls.id).eq("student_id", userId).maybeSingle();
    if (existing) return jsonError("You're already in this class.", 409);
    const { error } = await sb.from("class_students").insert({
      class_id: cls.id, student_id: userId, display_name: displayName, avatar, is_mock: false,
    });
    if (error) return jsonError(error.message, 500);
    return jsonOk({ class: cls, joinedAs: "student" });
  }
}

function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
}
function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { "Content-Type": "application/json" } });
}
