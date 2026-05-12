// POST /api/snapshots → save a Learning DNA snapshot for the current user
// GET  /api/snapshots → get my own snapshots (the signed-in user)

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return err("Invalid JSON", 400); }
  if (body.valid_for_analytics === false) return ok({ skipped: true });

  const sb = supabaseServer();

  // ─── Teacher-only filter ──────────────────────────────────────────
  // If the user is a teacher of any class AND not a student anywhere,
  // they're testing the product — don't pollute the DNA with their data.
  const [{ data: teaches }, { data: studies }] = await Promise.all([
    sb.from("class_teachers").select("class_id").eq("teacher_id", userId).limit(1),
    sb.from("class_students").select("class_id").eq("student_id", userId).limit(1),
  ]);
  if (teaches && teaches.length > 0 && (!studies || studies.length === 0)) {
    return ok({ skipped: true, reason: "teacher_only" });
  }

  // If a classId was provided, the user must be a student of that class
  // (a teacher's session tagged to their own class should never save).
  if (body.classId) {
    const { data: enrolled } = await sb.from("class_students")
      .select("student_id")
      .eq("class_id", body.classId).eq("student_id", userId).maybeSingle();
    if (!enrolled) {
      return ok({ skipped: true, reason: "not_a_student_of_class" });
    }
  }

  const { data, error } = await sb.from("snapshots").insert({
    student_id: userId,
    class_id: body.classId ?? null,
    concepts: body.concepts ?? [],
    misconceptions: body.misconceptions ?? [],
    hint_count: body.hint_count ?? 0,
    aha_moment: body.aha_moment ?? null,
    question_depth: body.question_depth ?? "surface",
    engagement_quality: body.engagement_quality ?? 5,
    growth_signals: body.growth_signals ?? [],
    summary: body.summary ?? "",
    detected_subject: body.detected_subject ?? null,
    subject_mismatch: body.subject_mismatch ?? false,
    valid_for_analytics: true,
  }).select().single();

  if (error) return err(error.message, 500);
  return ok({ snapshot: data });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sb = supabaseServer();
  const { data, error } = await sb.from("snapshots").select("*").eq("student_id", userId).order("created_at", { ascending: true });
  if (error) return err(error.message, 500);
  return ok({ snapshots: data ?? [] });
}

function ok(d: unknown) { return new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } }); }
function err(m: string, s: number) { return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } }); }
