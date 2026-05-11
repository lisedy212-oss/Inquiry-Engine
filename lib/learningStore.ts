// Storage layer for learning analytics. Currently uses localStorage for demo;
// the interface is identical to what a real DB-backed implementation would expose,
// so a future swap to Postgres/Supabase is a single function-body change per method.

export type MasteryLevel = "exposed" | "scaffolded" | "demonstrated" | "transferred";
export type QuestionDepth = "surface" | "procedural" | "conceptual";
export type Subject = "Math" | "Science" | "History" | "Languages" | "Coding" | "Literature" | "Other";

export interface ConceptSignal {
  name: string;
  subject: Subject;
  mastery: MasteryLevel;
  evidence: string;
}

export interface Misconception {
  concept: string;
  wrong_model: string;
  addressed: boolean;
}

export interface LearningSnapshot {
  id: string;
  timestamp: number;
  concepts: ConceptSignal[];
  misconceptions: Misconception[];
  hint_count: number;
  aha_moment: string | null;
  question_depth: QuestionDepth;
  engagement_quality: number;
  growth_signals: string[];
  summary: string;
  // ─── attribution & validity ───
  classId?: string;          // tags which class this session belongs to
  detected_subject?: Subject;// what the analyzer thinks the subject was
  subject_mismatch?: boolean;// true if student-tagged subject ≠ detected subject
  valid_for_analytics?: boolean; // false for accidental/off-topic submissions
}

// ─── Derived analytics ──────────────────────────────────────────────
// Snapshot persistence has moved to /api/snapshots (Supabase). The
// types and aggregation functions below stay here.

const MASTERY_RANK: Record<MasteryLevel, number> = {
  exposed: 1,
  scaffolded: 2,
  demonstrated: 3,
  transferred: 4,
};

export interface ConceptMastery {
  name: string;
  subject: Subject;
  level: MasteryLevel;
  encounters: number;
  lastSeen: number;
}

export function aggregateMastery(snapshots: LearningSnapshot[]): ConceptMastery[] {
  const map = new Map<string, ConceptMastery>();
  for (const s of snapshots) {
    for (const c of s.concepts) {
      const key = c.name.toLowerCase();
      const existing = map.get(key);
      if (!existing) {
        map.set(key, { name: c.name, subject: c.subject, level: c.mastery, encounters: 1, lastSeen: s.timestamp });
      } else {
        existing.encounters += 1;
        existing.lastSeen = Math.max(existing.lastSeen, s.timestamp);
        if (MASTERY_RANK[c.mastery] > MASTERY_RANK[existing.level]) existing.level = c.mastery;
      }
    }
  }
  return [...map.values()].sort((a, b) => MASTERY_RANK[b.level] - MASTERY_RANK[a.level]);
}

export function subjectBreakdown(snapshots: LearningSnapshot[]): { subject: Subject; count: number }[] {
  const map = new Map<Subject, number>();
  for (const s of snapshots) {
    for (const c of s.concepts) {
      map.set(c.subject, (map.get(c.subject) ?? 0) + 1);
    }
  }
  return [...map.entries()].map(([subject, count]) => ({ subject, count })).sort((a, b) => b.count - a.count);
}

export function hintTrend(snapshots: LearningSnapshot[]): { t: number; hints: number }[] {
  return snapshots.map((s) => ({ t: s.timestamp, hints: s.hint_count }));
}

export function recentMisconceptions(snapshots: LearningSnapshot[], limit = 5): { concept: string; wrong_model: string; addressed: boolean; when: number }[] {
  const all: { concept: string; wrong_model: string; addressed: boolean; when: number }[] = [];
  for (const s of snapshots) {
    for (const m of s.misconceptions) all.push({ ...m, when: s.timestamp });
  }
  return all.sort((a, b) => b.when - a.when).slice(0, limit);
}

export function growthScore(snapshots: LearningSnapshot[]): number {
  if (snapshots.length < 2) return 0;
  const recent = snapshots.slice(-5);
  const older = snapshots.slice(0, -5);
  if (older.length === 0) return 0;
  const recentAvgHints = recent.reduce((a, s) => a + s.hint_count, 0) / recent.length;
  const olderAvgHints = older.reduce((a, s) => a + s.hint_count, 0) / older.length;
  const recentAvgEng = recent.reduce((a, s) => a + s.engagement_quality, 0) / recent.length;
  const olderAvgEng = older.reduce((a, s) => a + s.engagement_quality, 0) / older.length;
  // Lower hints + higher engagement = positive growth
  const hintImprovement = (olderAvgHints - recentAvgHints) / Math.max(olderAvgHints, 1);
  const engImprovement = (recentAvgEng - olderAvgEng) / Math.max(olderAvgEng, 1);
  return Math.round((hintImprovement + engImprovement) * 50);
}

export function depthTrend(snapshots: LearningSnapshot[]): { surface: number; procedural: number; conceptual: number } {
  const counts = { surface: 0, procedural: 0, conceptual: 0 };
  for (const s of snapshots) counts[s.question_depth] += 1;
  return counts;
}
