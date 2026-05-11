// Private teacher notes about a student.
// Client-side wrappers around /api/notes/*

export interface TeacherNote {
  studentId: string;
  note: string;
  updatedAt: number;
}

export async function getNote(studentId: string): Promise<TeacherNote | null> {
  const r = await fetch(`/api/notes/${studentId}`, { cache: "no-store" });
  if (!r.ok) return null;
  const data = await r.json();
  if (!data.note) return null;
  return {
    studentId: data.note.student_id,
    note: data.note.note ?? "",
    updatedAt: new Date(data.note.updated_at).getTime(),
  };
}

export async function setNote(studentId: string, note: string): Promise<void> {
  await fetch(`/api/notes/${studentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
}
