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
