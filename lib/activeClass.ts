// Tracks the student's current class context for chat.
// Two modes only:
//   - { type: "class", classId } → tagged to a class, teacher sees the DNA
//   - { type: "none" }           → no class context (only used when student is in 0 classes)

export type ChatMode =
  | { type: "class"; classId: string }
  | { type: "none" };

const KEY = "ie-chat-mode";

export function getChatMode(): ChatMode {
  if (typeof window === "undefined") return { type: "none" };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { type: "none" };
    const parsed = JSON.parse(raw);
    if (parsed?.type === "class" && typeof parsed.classId === "string") return parsed;
    return { type: "none" };
  } catch {
    return { type: "none" };
  }
}

export function setChatMode(mode: ChatMode): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(KEY, JSON.stringify(mode)); } catch { /* quota */ }
}

// Convenience for legacy call sites
export function getActiveClassId(): string | null {
  const m = getChatMode();
  return m.type === "class" ? m.classId : null;
}
export function setActiveClassId(id: string | null): void {
  setChatMode(id ? { type: "class", classId: id } : { type: "none" });
}
