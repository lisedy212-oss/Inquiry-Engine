// GET  /api/classes/[id]/assignments → list assignments for this class
// POST /api/classes/[id]/assignments → create one (teacher of the class only)

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sb = supabaseServer();
  // Permission: must be a teacher OR student of this class
  const [{ data: t }, { data: s }] = await Promise.all([
    sb.from("class_teachers").select("teacher_id").eq("class_id", classId).eq("teacher_id", userId).maybeSingle(),
    sb.from("class_students").select("student_id").eq("class_id", classId).eq("student_id", userId).maybeSingle(),
  ]);
  if (!t && !s) return err("Forbidden", 403);

  const { data, error } = await sb.from("assignments")
    .select("id, title, content, created_at")
    .eq("class_id", classId)
    .order("created_at", { ascending: false });
  if (error) return err(error.message, 500);
  return ok({ assignments: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  let body: { title?: string; content?: string };
  try { body = await req.json(); } catch { return err("Invalid JSON", 400); }
  if (!body.title?.trim() || !body.content?.trim()) return err("Title and content required", 400);

  const sb = supabaseServer();
  const { data: t } = await sb.from("class_teachers")
    .select("teacher_id").eq("class_id", classId).eq("teacher_id", userId).maybeSingle();
  if (!t) return err("Only teachers of this class can add assignments", 403);

  const { data, error } = await sb.from("assignments").insert({
    class_id: classId, title: body.title.trim(), content: body.content.trim(), created_by: userId,
  }).select().single();
  if (error) return err(error.message, 500);
  return ok({ assignment: data });
}

function ok(d: unknown) { return new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } }); }
function err(m: string, s: number) { return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } }); }
