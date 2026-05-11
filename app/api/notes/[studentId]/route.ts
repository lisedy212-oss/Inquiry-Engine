// GET /api/notes/[studentId]  → my private note about this student
// PUT /api/notes/[studentId]  → upsert my note

import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(_req: Request, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  const sb = supabaseServer();
  const { data } = await sb.from("teacher_notes")
    .select("*").eq("teacher_id", userId).eq("student_id", studentId).maybeSingle();
  return ok({ note: data });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  const { userId } = await auth();
  if (!userId) return err("Not signed in", 401);

  let body: { note?: string };
  try { body = await req.json(); } catch { return err("Invalid JSON", 400); }

  const sb = supabaseServer();
  const { data, error } = await sb.from("teacher_notes")
    .upsert({ teacher_id: userId, student_id: studentId, note: body.note ?? "", updated_at: new Date().toISOString() })
    .select().single();
  if (error) return err(error.message, 500);
  return ok({ note: data });
}

function ok(d: unknown) { return new Response(JSON.stringify(d), { status: 200, headers: { "Content-Type": "application/json" } }); }
function err(m: string, s: number) { return new Response(JSON.stringify({ error: m }), { status: s, headers: { "Content-Type": "application/json" } }); }
