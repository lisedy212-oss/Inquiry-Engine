// GET /api/classes/mine → { teacherClasses, studentClasses }
// Returns every class the current user is in, in either role.

import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response(JSON.stringify({ error: "Not signed in" }), { status: 401 });

  const sb = supabaseServer();

  // Classes where I am a teacher
  const { data: teacherRows } = await sb
    .from("class_teachers")
    .select("class_id, classes(*)")
    .eq("teacher_id", userId);

  // Classes where I am a student
  const { data: studentRows } = await sb
    .from("class_students")
    .select("class_id, classes(*)")
    .eq("student_id", userId);

  // For each teacher class, also fetch its teachers and student count
  const teacherClassIds = (teacherRows ?? []).map(r => r.class_id);
  let teacherFulls: unknown[] = [];
  if (teacherClassIds.length > 0) {
    const { data: classes } = await sb.from("classes").select("*").in("id", teacherClassIds);
    const { data: allTeachers } = await sb.from("class_teachers").select("*").in("class_id", teacherClassIds);
    const { data: students } = await sb.from("class_students").select("class_id, student_id").in("class_id", teacherClassIds);
    teacherFulls = (classes ?? []).map((c: { id: string }) => ({
      ...c,
      teachers: (allTeachers ?? []).filter((t: { class_id: string }) => t.class_id === c.id),
      student_ids: (students ?? []).filter((s: { class_id: string }) => s.class_id === c.id).map((s: { student_id: string }) => s.student_id),
    }));
  }

  return new Response(JSON.stringify({
    teacherClasses: teacherFulls,
    studentClasses: (studentRows ?? []).map(r => r.classes).filter(Boolean),
  }), { status: 200, headers: { "Content-Type": "application/json" } });
}
