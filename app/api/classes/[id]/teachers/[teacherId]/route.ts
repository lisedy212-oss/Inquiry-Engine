// DELETE /api/classes/[id]/teachers/[teacherId]  → remove a co-teacher (owner only)

import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; teacherId: string }> }) {
  const { id, teacherId } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sb = supabaseServer();
  const { data: cls } = await sb.from("classes").select("owner_id").eq("id", id).maybeSingle();
  if (!cls) return err("Class not found", 404);
  if (cls.owner_id !== userId) return err("Only the class owner can remove co-teachers", 403);
  if (teacherId === cls.owner_id) return err("Cannot remove the class owner", 400);

  const { error } = await sb.from("class_teachers").delete().eq("class_id", id).eq("teacher_id", teacherId);
  if (error) return err(error.message, 500);
  return ok({ removed: true });
}

function ok(d: unknown) { return new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } }); }
function err(m: string, s: number) { return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } }); }
