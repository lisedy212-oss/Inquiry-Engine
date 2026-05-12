// GET    /api/assignments/[id]  → fetch (must be teacher or student of the class)
// DELETE /api/assignments/[id]  → delete (must be teacher of the class)

import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sb = supabaseServer();
  const { data: assignment } = await sb.from("assignments").select("*").eq("id", id).maybeSingle();
  if (!assignment) return err("Assignment not found", 404);

  // Permission: teacher OR student of the assignment's class
  const [{ data: t }, { data: s }] = await Promise.all([
    sb.from("class_teachers").select("teacher_id").eq("class_id", assignment.class_id).eq("teacher_id", userId).maybeSingle(),
    sb.from("class_students").select("student_id").eq("class_id", assignment.class_id).eq("student_id", userId).maybeSingle(),
  ]);
  if (!t && !s) return err("Forbidden", 403);

  return ok({ assignment });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sb = supabaseServer();
  const { data: a } = await sb.from("assignments").select("class_id").eq("id", id).maybeSingle();
  if (!a) return err("Assignment not found", 404);

  const { data: t } = await sb.from("class_teachers")
    .select("teacher_id").eq("class_id", a.class_id).eq("teacher_id", userId).maybeSingle();
  if (!t) return err("Only teachers can delete assignments", 403);

  const { error } = await sb.from("assignments").delete().eq("id", id);
  if (error) return err(error.message, 500);
  return ok({ deleted: true });
}

function ok(d: unknown) { return new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } }); }
function err(m: string, s: number) { return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } }); }
