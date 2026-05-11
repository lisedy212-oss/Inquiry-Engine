// Per-day question quota for free users. Resets at local midnight.
// localStorage-backed for demo; in production this lives on the server.

export const FREE_DAILY_LIMIT = 5;

function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `ie-questions-${y}-${m}-${d}`;
}

export function getTodayCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(todayKey()) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function incrementTodayCount(): number {
  if (typeof window === "undefined") return 0;
  const next = getTodayCount() + 1;
  try { localStorage.setItem(todayKey(), String(next)); } catch { /* quota */ }
  return next;
}

export function remainingQuestions(plan: string): number {
  if (plan !== "free") return Infinity;
  return Math.max(0, FREE_DAILY_LIMIT - getTodayCount());
}

export function hasQuotaRemaining(plan: string): boolean {
  return remainingQuestions(plan) > 0;
}
