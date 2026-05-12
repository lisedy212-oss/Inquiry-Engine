// Tracks the student's currently active assignment for the chat.
// localStorage so the selection persists across page reloads.

const KEY = "ie-active-assignment";

export interface ActiveAssignment {
  id: string;
  title: string;
  classId: string;
}

export function getActiveAssignment(): ActiveAssignment | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (typeof v?.id === "string" && typeof v?.title === "string" && typeof v?.classId === "string") return v;
    return null;
  } catch { return null; }
}

export function setActiveAssignment(a: ActiveAssignment | null): void {
  if (typeof window === "undefined") return;
  try {
    if (a) localStorage.setItem(KEY, JSON.stringify(a));
    else localStorage.removeItem(KEY);
  } catch { /* */ }
}
