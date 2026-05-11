// GET /api/dashboard/stats → aggregate stats across all classes
// the current teacher teaches. Returns counts only, no PII.

import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sb = supabaseServer();

  // Classes I teach
  const { data: myClasses } = await sb
    .from("class_teachers")
    .select("class_id")
    .eq("teacher_id", userId);
  const classIds = (myClasses ?? []).map((c: { class_id: string }) => c.class_id);

  if (classIds.length === 0) {
    return ok({ classes: 0, students: 0, openMisconceptions: 0, masteryRate: 0, sessionsThisWeek: 0 });
  }

  // Unique student IDs across those classes
  const { data: students } = await sb
    .from("class_students")
    .select("student_id")
    .in("class_id", classIds);
  const studentIds = [...new Set((students ?? []).map((s: { student_id: string }) => s.student_id))];

  // All snapshots in those classes
  const { data: snaps } = await sb
    .from("snapshots")
    .select("concepts, misconceptions, created_at")
    .in("class_id", classIds);

  const week = Date.now() - 7 * 86400000;
  let openMisc = 0, totalConcepts = 0, masteredConcepts = 0, sessionsThisWeek = 0;
  interface Concept { mastery: string }
  interface Misc { addressed: boolean }
  for (const s of snaps ?? []) {
    if (new Date(s.created_at).getTime() >= week) sessionsThisWeek++;
    for (const c of (s.concepts ?? []) as Concept[]) {
      totalConcepts++;
      if (c.mastery === "demonstrated" || c.mastery === "transferred") masteredConcepts++;
    }
    for (const m of (s.misconceptions ?? []) as Misc[]) {
      if (!m.addressed) openMisc++;
    }
  }
  const masteryRate = totalConcepts > 0 ? Math.round((masteredConcepts / totalConcepts) * 100) : 0;

  return ok({
    classes: classIds.length,
    students: studentIds.length,
    openMisconceptions: openMisc,
    masteryRate,
    sessionsThisWeek,
  });
}

function ok(d: unknown) { return new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } }); }
function err(m: string, s: number) { return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } }); }
