// POST   /api/classes        → create a class (teacher)
// All requests auth'd via Clerk; logic enforced server-side.

import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { supabaseServer } from "@/lib/supabase-server";

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function generateCode(prefix = "INQ-") {
  let s = prefix;
  for (let i = 0; i < 4; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)];
  return s;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return jsonError("Not signed in", 401);
  const user = await currentUser();
  const teacherName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Teacher";

  let body: { name?: string };
  try { body = await req.json(); } catch { return jsonError("Invalid JSON", 400); }
  if (!body.name || body.name.trim().length === 0) return jsonError("Class name required", 400);

  const sb = supabaseServer();

  // Generate unique codes (re-roll on collision; the unique index will reject duplicates)
  let code = generateCode();
  let teacherCode = generateCode("INQ-T-");
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await sb
      .from("classes")
      .insert({ code, teacher_code: teacherCode, name: body.name.trim(), owner_id: userId })
      .select()
      .single();
    if (!error) {
      const cls = data;
      // Add the creator as the first teacher
      await sb.from("class_teachers").insert({
        class_id: cls.id, teacher_id: userId, teacher_name: teacherName,
      });
      return jsonOk({ class: cls });
    }
    // 23505 = unique violation — collision on code, regenerate
    if ((error as { code?: string }).code === "23505") {
      code = generateCode();
      teacherCode = generateCode("INQ-T-");
      continue;
    }
    return jsonError(error.message, 500);
  }
  return jsonError("Could not generate a unique class code, try again", 500);
}


function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
}
function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { "Content-Type": "application/json" } });
}
