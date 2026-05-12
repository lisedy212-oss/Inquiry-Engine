// GET /api/snapshots/[studentId] → snapshots for a student (teacher view)
// Permission: viewer must teach a class the student is enrolled in,
// OR be the student themselves.

import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(_req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sb = supabaseServer();

  if (userId !== studentId) {
    // 1) all classes the requester teaches
    const { data: taught } = await sb.from("class_teachers")
      .select("class_id").eq("teacher_id", userId);
    const classIds = (taught ?? []).map((c: { class_id: string }) => c.class_id);
    if (classIds.length === 0) return err("Forbidden — you don't teach any class", 403);

    // 2) is the student enrolled in any of those?
    const { data: enrolled } = await sb.from("class_students")
      .select("class_id").eq("student_id", studentId).in("class_id", classIds);
    if (!enrolled || enrolled.length === 0) {
      return err("Forbidden — student is not in any class you teach", 403);
    }
  }

  const { data, error } = await sb.from("snapshots").select("*")
    .eq("student_id", studentId).order("created_at", { ascending: true });
  if (error) return err(error.message, 500);
  return ok({ snapshots: data ?? [] });
}

function ok(d: unknown) { return new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } }); }
function err(m: string, s: number) { return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } }); }
