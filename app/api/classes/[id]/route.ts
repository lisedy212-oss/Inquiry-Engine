// GET    /api/classes/[id]  → class details + teachers + students (teacher-only)
// DELETE /api/classes/[id]  → delete class (owner only)

import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sb = supabaseServer();
  const { data: cls, error } = await sb.from("classes").select("*").eq("id", id).maybeSingle();
  if (error) return err(error.message, 500);
  if (!cls) return err("Class not found", 404);

  // Only teachers of this class can fetch its details
  const { data: teacherRow } = await sb.from("class_teachers")
    .select("teacher_id").eq("class_id", id).eq("teacher_id", userId).maybeSingle();
  if (!teacherRow) return err("Forbidden", 403);

  const { data: teachers } = await sb.from("class_teachers").select("*").eq("class_id", id);
  const { data: students } = await sb.from("class_students").select("*").eq("class_id", id);

  return ok({ class: cls, teachers: teachers ?? [], students: students ?? [] });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sb = supabaseServer();
  const { data: cls } = await sb.from("classes").select("owner_id").eq("id", id).maybeSingle();
  if (!cls) return err("Class not found", 404);
  if (cls.owner_id !== userId) return err("Only the owner can delete this class", 403);

  const { error } = await sb.from("classes").delete().eq("id", id);
  if (error) return err(error.message, 500);
  return ok({ deleted: true });
}

function ok(d: unknown) { return new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } }); }
function err(m: string, s: number) { return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } }); }
