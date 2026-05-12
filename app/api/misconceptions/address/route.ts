// POST /api/misconceptions/address  → flip a misconception's "addressed" field
// Body: { studentId, conceptName, wrongModel }

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  let body: { studentId?: string; conceptName?: string; wrongModel?: string };
  try { body = await req.json(); } catch { return err("Invalid JSON", 400); }
  if (!body.studentId || !body.conceptName) return err("Missing fields", 400);

  const sb = supabaseServer();

  // Permission: teacher of a class this student is in (or self)
  if (userId !== body.studentId) {
    const { data: taught } = await sb.from("class_teachers")
      .select("class_id").eq("teacher_id", userId);
    const classIds = (taught ?? []).map((c: { class_id: string }) => c.class_id);
    if (classIds.length === 0) return err("Forbidden", 403);
    const { data: enrolled } = await sb.from("class_students")
      .select("class_id").eq("student_id", body.studentId).in("class_id", classIds);
    if (!enrolled || enrolled.length === 0) return err("Forbidden", 403);
  }

  const { data: snaps } = await sb.from("snapshots").select("id, misconceptions").eq("student_id", body.studentId);
  if (!snaps) return ok({ updated: 0 });

  let updated = 0;
  for (const s of snaps) {
    let changed = false;
    interface Misc { concept: string; wrong_model: string; addressed: boolean }
    const newMisc = (s.misconceptions as Misc[]).map((m) => {
      if (m.concept === body.conceptName && m.wrong_model === body.wrongModel && !m.addressed) {
        changed = true;
        return { ...m, addressed: true };
      }
      return m;
    });
    if (changed) {
      await sb.from("snapshots").update({ misconceptions: newMisc }).eq("id", s.id);
      updated++;
    }
  }
  return ok({ updated });
}

function ok(d: unknown) { return new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } }); }
function err(m: string, s: number) { return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } }); }
