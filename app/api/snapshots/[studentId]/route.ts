// GET /api/snapshots/[studentId] → snapshots for a student (teacher view)
// Permission: viewer must be a teacher of a class the student is in.

import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(_req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sb = supabaseServer();

  // Self-access always allowed
  if (userId !== studentId) {
    // Find classes where this teacher teaches AND this student is enrolled
    const { data: shared } = await sb
      .from("class_teachers")
      .select("class_id, class_students!inner(student_id)")
      .eq("teacher_id", userId)
      .eq("class_students.student_id", studentId);
    if (!shared || shared.length === 0) return err("Forbidden", 403);
  }

  const { data, error } = await sb.from("snapshots").select("*").eq("student_id", studentId).order("created_at", { ascending: true });
  if (error) return err(error.message, 500);
  return ok({ snapshots: data ?? [] });
}

function ok(d: unknown) { return new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } }); }
function err(m: string, s: number) { return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } }); }
