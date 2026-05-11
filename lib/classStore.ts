// Client-side wrappers around the /api/classes/* routes.
// All functions are async — they hit the server, which talks to Supabase.

import type { LearningSnapshot } from "./learningStore";

export interface TeacherInfo {
  id: string;
  name: string;
  joinedAt: number;
}

export interface ClassRoom {
  id: string;
  code: string;
  teacherCode: string;
  name: string;
  teachers: TeacherInfo[];
  ownerId: string;
  createdAt: number;
  studentIds: string[];
}

export interface ClassMember {
  classId: string;
  userId: string;
  joinedAt: number;
  isMock: boolean;
  displayName: string;
  avatar: string;
}

// ─── Helpers to normalize server snake_case → camelCase ─────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toClass(c: any): ClassRoom {
  return {
    id: c.id,
    code: c.code,
    teacherCode: c.teacher_code,
    name: c.name,
    ownerId: c.owner_id,
    createdAt: new Date(c.created_at).getTime(),
    studentIds: c.student_ids ?? [],
    teachers: (c.teachers ?? []).map((t: { teacher_id: string; teacher_name: string; joined_at: string }) => ({
      id: t.teacher_id, name: t.teacher_name, joinedAt: new Date(t.joined_at).getTime(),
    })),
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMember(m: any, classId: string): ClassMember {
  return {
    classId,
    userId: m.student_id,
    joinedAt: new Date(m.joined_at).getTime(),
    isMock: m.is_mock ?? false,
    displayName: m.display_name,
    avatar: m.avatar,
  };
}

async function get<T>(url: string): Promise<T | null> {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) return null;
  return r.json();
}
async function send<T>(url: string, method: string, body?: unknown): Promise<T | { error: string }> {
  const r = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  return r.json();
}

// ─── Class CRUD ─────────────────────────────────────────────────────
export async function createClass(name: string): Promise<ClassRoom | null> {
  const r = await send<{ class: unknown; error?: string }>("/api/classes", "POST", { name });
  if ("error" in r && r.error) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return toClass((r as any).class);
}

export async function getMyClasses(): Promise<{ teacher: ClassRoom[]; student: ClassRoom[] }> {
  const r = await get<{ teacherClasses: unknown[]; studentClasses: unknown[] }>("/api/classes/mine");
  if (!r) return { teacher: [], student: [] };
  return {
    teacher: (r.teacherClasses ?? []).map(toClass),
    student: (r.studentClasses ?? []).map(toClass),
  };
}

export async function getClassesByTeacher(): Promise<ClassRoom[]> {
  return (await getMyClasses()).teacher;
}
export async function getClassesByStudent(): Promise<ClassRoom[]> {
  return (await getMyClasses()).student;
}

export async function getClassDetail(id: string): Promise<{ classRoom: ClassRoom; members: ClassMember[] } | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await get<any>(`/api/classes/${id}`);
  if (!r) return null;
  const cls = r.class;
  cls.teachers = r.teachers;
  cls.student_ids = (r.students ?? []).map((s: { student_id: string }) => s.student_id);
  return {
    classRoom: toClass(cls),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    members: (r.students ?? []).map((s: any) => toMember(s, cls.id)),
  };
}

export async function deleteClass(classId: string): Promise<boolean> {
  const r = await send<{ deleted?: boolean; error?: string }>(`/api/classes/${classId}`, "DELETE");
  return "deleted" in r && !!r.deleted;
}

// ─── Joining ────────────────────────────────────────────────────────
export async function joinClassByCode(code: string): Promise<{ ok: boolean; error?: string; joinedAs?: "student" | "teacher" }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r = await send<any>("/api/classes/join", "POST", { code });
  if (r.error) return { ok: false, error: r.error };
  return { ok: true, joinedAs: r.joinedAs };
}

// ─── Co-teachers ────────────────────────────────────────────────────
export async function removeCoTeacher(classId: string, teacherIdToRemove: string): Promise<boolean> {
  const r = await send<{ removed?: boolean; error?: string }>(`/api/classes/${classId}/teachers/${teacherIdToRemove}`, "DELETE");
  return "removed" in r && !!r.removed;
}

// ─── Snapshots ──────────────────────────────────────────────────────
export async function getSnapshotsForStudent(studentId: string): Promise<LearningSnapshot[]> {
  const r = await get<{ snapshots: unknown[] }>(`/api/snapshots/${studentId}`);
  if (!r) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (r.snapshots ?? []).map((s: any) => ({
    id: s.id,
    timestamp: new Date(s.created_at).getTime(),
    concepts: s.concepts ?? [],
    misconceptions: s.misconceptions ?? [],
    hint_count: s.hint_count ?? 0,
    aha_moment: s.aha_moment ?? null,
    question_depth: s.question_depth ?? "surface",
    engagement_quality: s.engagement_quality ?? 5,
    growth_signals: s.growth_signals ?? [],
    summary: s.summary ?? "",
    classId: s.class_id ?? undefined,
    detected_subject: s.detected_subject ?? undefined,
    subject_mismatch: s.subject_mismatch ?? false,
    valid_for_analytics: s.valid_for_analytics ?? true,
  }));
}

export async function getMySnapshots(): Promise<LearningSnapshot[]> {
  const r = await get<{ snapshots: unknown[] }>("/api/snapshots");
  if (!r) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (r.snapshots ?? []).map((s: any) => ({
    id: s.id,
    timestamp: new Date(s.created_at).getTime(),
    concepts: s.concepts ?? [],
    misconceptions: s.misconceptions ?? [],
    hint_count: s.hint_count ?? 0,
    aha_moment: s.aha_moment ?? null,
    question_depth: s.question_depth ?? "surface",
    engagement_quality: s.engagement_quality ?? 5,
    growth_signals: s.growth_signals ?? [],
    summary: s.summary ?? "",
    classId: s.class_id ?? undefined,
    detected_subject: s.detected_subject ?? undefined,
    subject_mismatch: s.subject_mismatch ?? false,
    valid_for_analytics: s.valid_for_analytics ?? true,
  }));
}

export async function markMisconceptionAddressed(studentId: string, conceptName: string, wrongModel: string): Promise<void> {
  await send("/api/misconceptions/address", "POST", { studentId, conceptName, wrongModel });
}

// ─── Permission check ───────────────────────────────────────────────
// Permission is enforced server-side; this client-side function is a
// best-effort check used only to gate UI. The server is the source of truth.
export function canViewStudent(): boolean {
  return true; // Server enforces — if fetch returns 403, UI shows lock state
}
