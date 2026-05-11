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
      // Seed mock students (we'll move this to a stored proc later; inline for now)
      await seedMockStudents(sb, cls.id);
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

async function seedMockStudents(
  sb: ReturnType<typeof supabaseServer>,
  classId: string,
) {
  const templates = [
    { name: "Sofia Martinez",  snaps: [
      { hint_count: 2, eng: 9, depth: "conceptual",  summary: "Worked through causes of WWI with strong conceptual depth.",
        concepts: [{ name: "Causes of WWI", subject: "History", mastery: "transferred", evidence: "Connected nationalism and alliance systems to spark of the war" }],
        misconceptions: [], aha: "The assassination wasn't really the cause, it was just the spark on top of decades of tension.",
        growth: ["Started asking 'why' instead of 'what'"], days: 6 },
      { hint_count: 1, eng: 9, depth: "conceptual",  summary: "Strong thesis construction on essay outline.",
        concepts: [{ name: "Thesis statements", subject: "Literature", mastery: "transferred", evidence: "Reframed her thesis after I asked what was at stake" }],
        misconceptions: [], aha: "A thesis is an argument I'm making, not just a topic I'm covering.",
        growth: ["Needed only 1 hint where she used to need 4"], days: 1 },
    ]},
    { name: "Jordan Lee",      snaps: [
      { hint_count: 5, eng: 6, depth: "procedural", summary: "Struggling with recursion — keeps confusing base case with recursive case.",
        concepts: [{ name: "Recursion", subject: "Coding", mastery: "scaffolded", evidence: "Got there with significant prompting" }],
        misconceptions: [{ concept: "Recursion", wrong_model: "Believes the base case 'calls itself once and stops' — doesn't see it as a termination condition.", addressed: false }],
        aha: null, growth: [], days: 5 },
    ]},
    { name: "Priya Patel",     snaps: [
      { hint_count: 2, eng: 10, depth: "conceptual", summary: "Chain rule revisited — strong recall, applied to new function type.",
        concepts: [{ name: "Chain rule", subject: "Math", mastery: "transferred", evidence: "Applied to a composition she hadn't seen" }],
        misconceptions: [], aha: "I don't have to memorize this — I just have to keep applying the same rule recursively.",
        growth: ["Hint count dropped from 5 to 2 on the same concept"], days: 4 },
    ]},
    { name: "Marcus Williams", snaps: [
      { hint_count: 5, eng: 3, depth: "surface", summary: "Theme analysis — engagement slipping.",
        concepts: [{ name: "Themes in literature", subject: "Literature", mastery: "exposed", evidence: "Identified theme but couldn't argue it" }],
        misconceptions: [{ concept: "Theme", wrong_model: "Still treats theme as a single word, not a claim.", addressed: false }],
        aha: null, growth: [], days: 2 },
    ]},
    { name: "Emma Johansson",  snaps: [
      { hint_count: 4, eng: 8, depth: "conceptual", summary: "Tone analysis — needed prompting but got there.",
        concepts: [{ name: "Tone analysis", subject: "Literature", mastery: "scaffolded", evidence: "Asked her to point to specific words; she could after that" }],
        misconceptions: [], aha: "The tone is in the word choice, not just what's being said.", growth: [], days: 1 },
    ]},
    { name: "Aisha Okonkwo",   snaps: [
      { hint_count: 2, eng: 10, depth: "conceptual", summary: "Catalysts — moved from procedure to mechanism in one session.",
        concepts: [{ name: "Catalysts", subject: "Science", mastery: "transferred", evidence: "Predicted how a new catalyst would behave" }],
        misconceptions: [], aha: "So the catalyst doesn't change where you end up — it changes the path you take to get there.",
        growth: ["Connected to a topic from last week's session unprompted"], days: 6 },
    ]},
  ];

  for (const t of templates) {
    const mockId = `mock-${classId}-${t.name.replace(/\s/g, "")}`;
    const avatar = (t.name.split(" ").map(p => p[0]).join("") + "").toUpperCase().slice(0, 2);
    await sb.from("class_students").insert({
      class_id: classId, student_id: mockId, display_name: t.name, avatar, is_mock: true,
    });
    for (const s of t.snaps) {
      await sb.from("snapshots").insert({
        student_id: mockId, class_id: classId,
        created_at: new Date(Date.now() - s.days * 86400000).toISOString(),
        concepts: s.concepts, misconceptions: s.misconceptions,
        hint_count: s.hint_count, aha_moment: s.aha,
        question_depth: s.depth, engagement_quality: s.eng,
        growth_signals: s.growth, summary: s.summary,
        valid_for_analytics: true,
      });
    }
  }
}

function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), { status: 200, headers: { "Content-Type": "application/json" } });
}
function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { "Content-Type": "application/json" } });
}
