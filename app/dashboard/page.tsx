"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { setChatMode } from "@/lib/activeClass";
import {
  Users, TrendingUp, Brain, AlertTriangle, Sparkles,
  Search, ChevronRight, Activity, Award, Copy, Check,
  Plus, BookOpen, Lock, GraduationCap, ChevronLeft, Trash2,
  StickyNote, Download, ArrowUpDown, UserPlus, X, Clock,
} from "lucide-react";
import NavMenu from "@/components/NavMenu";
import {
  aggregateMastery, recentMisconceptions, growthScore,
  depthTrend, subjectBreakdown,
  type LearningSnapshot,
} from "@/lib/learningStore";
import {
  createClass, getMyClasses, getClassDetail,
  getSnapshotsForStudent, getMySnapshots, joinClassByCode, deleteClass,
  markMisconceptionAddressed, removeCoTeacher,
  type ClassRoom, type ClassMember,
} from "@/lib/classStore";
import { getNote, setNote } from "@/lib/teacherNotes";

const MASTERY_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  exposed:      { bg: "#f1f5f9", text: "#64748b", label: "Exposed" },
  scaffolded:   { bg: "#fef3c7", text: "#b45309", label: "Scaffolded" },
  demonstrated: { bg: "#dbeafe", text: "#1d4ed8", label: "Demonstrated" },
  transferred:  { bg: "#dcfce7", text: "#15803d", label: "Mastered" },
};

type View = "hub" | "class" | "student";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const [view, setView] = useState<View>("hub");
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [joinModal, setJoinModal] = useState(false);
  const [inviteTeacherModal, setInviteTeacherModal] = useState(false);
  const [inviteStudentsModal, setInviteStudentsModal] = useState(false);

  const [teacherClasses, setTeacherClasses] = useState<ClassRoom[]>([]);
  const [studentClasses, setStudentClasses] = useState<ClassRoom[]>([]);
  const [classDetail, setClassDetail] = useState<{ classRoom: ClassRoom; members: ClassMember[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id ?? "anon";
  const displayName = user ? `${user.firstName ?? "You"} ${user.lastName ?? ""}`.trim() : "You";

  const reloadClasses = useCallback(async () => {
    setLoading(true);
    const { teacher, student } = await getMyClasses();
    setTeacherClasses(teacher);
    setStudentClasses(student);
    setLoading(false);
  }, []);

  useEffect(() => { if (isLoaded) reloadClasses(); }, [isLoaded, reloadClasses]);

  // Refresh active class when it changes
  useEffect(() => {
    if (!activeClassId) { setClassDetail(null); return; }
    getClassDetail(activeClassId).then(setClassDetail);
  }, [activeClassId]);

  const isTeacher = teacherClasses.length > 0;

  if (!isLoaded || loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc", color: "#94a3b8" }}>Loading…</div>;
  }

  // First visit
  if (teacherClasses.length === 0 && studentClasses.length === 0) {
    return <EmptyState
      onCreate={() => setCreateModal(true)} onJoin={() => setJoinModal(true)}
      createModal={createModal} setCreateModal={setCreateModal}
      joinModal={joinModal} setJoinModal={setJoinModal}
      onAction={reloadClasses} />;
  }

  // Student view
  if (!isTeacher && studentClasses.length > 0) {
    return <StudentView userId={userId} displayName={displayName} classes={studentClasses}
      onJoin={() => setJoinModal(true)}
      joinModal={joinModal} setJoinModal={setJoinModal} onAction={reloadClasses} />;
  }

  // Teacher view
  const activeStudent = classDetail?.members.find(m => m.userId === activeStudentId) ?? null;

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <Header
        breadcrumb={
          view === "hub" ? null :
          view === "class" ? { label: classDetail?.classRoom.name ?? "Class", back: () => { setView("hub"); setActiveClassId(null); } } :
          { label: `${classDetail?.classRoom.name ?? "Class"} › ${activeStudent?.displayName ?? "Student"}`, back: () => { setView("class"); setActiveStudentId(null); } }
        }
        roleLabel="Teacher"
      />

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        {view === "hub" && (
          <TeacherHub
            teacherClasses={teacherClasses}
            onCreateClass={() => setCreateModal(true)}
            onOpenClass={(id) => { setActiveClassId(id); setView("class"); }}
            onDeleteClass={async (id) => {
              if (confirm("Delete this class? Students will lose access.")) {
                await deleteClass(id); await reloadClasses();
              }
            }}
          />
        )}

        {view === "class" && classDetail && (
          <ClassView
            classRoom={classDetail.classRoom}
            members={classDetail.members}
            viewerId={userId}
            onOpenStudent={(id) => { setActiveStudentId(id); setView("student"); }}
            onRefresh={async () => { if (activeClassId) setClassDetail(await getClassDetail(activeClassId)); }}
            onInviteTeacher={() => setInviteTeacherModal(true)}
            onInviteStudents={() => setInviteStudentsModal(true)}
          />
        )}

        {view === "student" && activeStudent && (
          <AsyncStudentDetailView
            student={activeStudent}
            classFilter={activeClassId}
            viewerId={userId}
            onRefresh={async () => { if (activeClassId) setClassDetail(await getClassDetail(activeClassId)); }}
          />
        )}
      </div>

      {createModal && <CreateClassModal onClose={() => setCreateModal(false)} onCreated={async () => { setCreateModal(false); await reloadClasses(); }} />}
      {joinModal && <JoinClassModal onClose={() => setJoinModal(false)} onJoined={async () => { setJoinModal(false); await reloadClasses(); }} />}
      {inviteTeacherModal && classDetail && (
        <InviteTeacherModal classRoom={classDetail.classRoom} onClose={() => setInviteTeacherModal(false)} />
      )}
      {inviteStudentsModal && classDetail && (
        <InviteStudentsModal classRoom={classDetail.classRoom} onClose={() => setInviteStudentsModal(false)} />
      )}
    </div>
  );
}

// ═══ COMPONENTS ════════════════════════════════════════════════════

function Header({ breadcrumb, roleLabel }: { breadcrumb: { label: string; back: () => void } | null; roleLabel: string }) {
  return (
    <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 30 }}>
      <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 max-w-7xl mx-auto gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {breadcrumb && (
            <button onClick={breadcrumb.back} className="inline-flex items-center gap-1 p-1.5 rounded-lg flex-shrink-0" style={{ color: "#64748b" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f1f5f9")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <ChevronLeft size={16} />
            </button>
          )}
          <Link href="/" className="flex items-center gap-2.5 transition-opacity min-w-0" style={{ textDecoration: "none" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
              🎓
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm flex items-center gap-2 truncate" style={{ color: "#0f172a" }}>
                <span className="truncate">{breadcrumb ? breadcrumb.label : "Dashboard"}</span>
                <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg,#dbeafe,#e0e7ff)", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                  {roleLabel}
                </span>
              </div>
              <div className="hidden md:block text-xs" style={{ color: "#94a3b8" }}>Learning DNA · privacy-protected per student</div>
            </div>
          </Link>
        </div>
        <NavMenu />
      </div>
    </header>
  );
}

// ─── Hub ────────────────────────────────────────────────────────────
interface HubStats { classes: number; students: number; openMisconceptions: number; masteryRate: number; sessionsThisWeek: number }

function TeacherHub({ teacherClasses, onCreateClass, onOpenClass, onDeleteClass }: {
  teacherClasses: ClassRoom[];
  onCreateClass: () => void;
  onOpenClass: (id: string) => void;
  onDeleteClass: (id: string) => void;
}) {
  const [stats, setStats] = useState<HubStats | null>(null);
  useEffect(() => {
    fetch("/api/dashboard/stats", { cache: "no-store" })
      .then(r => r.ok ? r.json() : null)
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  return (
    <>
      {/* Hero stat strip — single cohesive card, more polished than 4 separate boxes */}
      <div className="rounded-2xl p-6 mb-8 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#1e3a8a 100%)", color: "#fff", boxShadow: "0 8px 32px rgba(15,23,42,0.25)" }}>
        {/* subtle glow */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 240, height: 240, borderRadius: "9999px",
          background: "radial-gradient(circle, rgba(59,130,246,0.25), transparent 70%)", filter: "blur(20px)", pointerEvents: "none" }} />

        <div className="flex items-center justify-between mb-5 relative">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#93c5fd" }}>Your Classes Overview</div>
            <h2 className="text-xl font-extrabold">{teacherClasses.length === 0 ? "Get started" : `${teacherClasses.length} class${teacherClasses.length !== 1 ? "es" : ""} you teach`}</h2>
          </div>
          <button onClick={onCreateClass}
            className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold"
            style={{ background: "#fff", color: "#0f172a", boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}>
            <Plus size={15} /> New Class
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative">
          <HeroStat label="Students" value={stats?.students ?? "—"} sub="across all classes" color="#60a5fa" />
          <HeroStat label="Sessions this week" value={stats?.sessionsThisWeek ?? "—"} sub="real chat activity" color="#34d399" />
          <HeroStat label="Open misconceptions" value={stats?.openMisconceptions ?? "—"} sub="needs follow-up" color="#fbbf24" alert={stats ? stats.openMisconceptions > 0 : false} />
          <HeroStat label="Mastery rate" value={stats ? `${stats.masteryRate}%` : "—"} sub="concepts mastered" color="#a78bfa" />
        </div>
      </div>


      <div className="grid md:grid-cols-2 gap-5">
        {teacherClasses.map(c => (
          <div key={c.id} className="rounded-2xl p-5 transition-all cursor-pointer"
            onClick={() => onOpenClass(c.id)}
            style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(37,99,235,0.12)")}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)")}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-base mb-0.5" style={{ color: "#0f172a" }}>{c.name}</h3>
                <div className="flex items-center gap-2 text-xs" style={{ color: "#64748b" }}>
                  <Users size={11} /> {c.studentIds.length} student{c.studentIds.length !== 1 ? "s" : ""}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDeleteClass(c.id); }}
                className="p-1.5 rounded-lg" style={{ color: "#cbd5e1" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
                onMouseLeave={e => (e.currentTarget.style.color = "#cbd5e1")}>
                <Trash2 size={14} />
              </button>
            </div>
            <ClassCode code={c.code} />
            <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: "#f1f5f9" }}>
              <div>
                <div className="text-xs" style={{ color: "#94a3b8" }}>Created</div>
                <div className="text-sm font-bold" style={{ color: "#0f172a" }}>{new Date(c.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: "#2563eb" }}>
                Open class <ChevronRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Class detail ───────────────────────────────────────────────────
type SortBy = "name" | "growth" | "miscs" | "activity";

function ClassView({ classRoom, members, viewerId, onOpenStudent, onRefresh, onInviteTeacher, onInviteStudents }: {
  classRoom: ClassRoom;
  members: ClassMember[];
  viewerId: string;
  onOpenStudent: (id: string) => void;
  onRefresh: () => void;
  onInviteTeacher: () => void;
  onInviteStudents: () => void;
}) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("activity");
  const [enriched, setEnriched] = useState<EnrichedMember[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const results = await Promise.all(members.map(async m => {
        const snaps = (await getSnapshotsForStudent(m.userId)).filter(s => s.classId === classRoom.id);
        const lastSnap = snaps[snaps.length - 1];
        const mastery = aggregateMastery(snaps);
        const masteryCount = mastery.filter(c => c.level === "demonstrated" || c.level === "transferred").length;
        const miscs = snaps.flatMap(s => s.misconceptions).filter(x => !x.addressed).length;
        const growth = growthScore(snaps);
        const lastActive = lastSnap?.timestamp ?? 0;
        return { m, snaps, lastSnap, masteryCount, miscs, growth, lastActive };
      }));
      if (!cancelled) setEnriched(results);
    })();
    return () => { cancelled = true; };
  }, [members, classRoom.id]);

  if (!enriched) {
    return <div className="text-center py-12 text-sm" style={{ color: "#94a3b8" }}>Loading roster…</div>;
  }

  const sorted = [...enriched].sort((a, b) => {
    if (sortBy === "name") return a.m.displayName.localeCompare(b.m.displayName);
    if (sortBy === "growth") return b.growth - a.growth;
    if (sortBy === "miscs") return b.miscs - a.miscs;
    return b.lastActive - a.lastActive;
  });

  const filtered = sorted.filter(x => x.m.displayName.toLowerCase().includes(search.toLowerCase()));

  function exportCSV() {
    const rows = [
      ["Student", "Joined", "Sessions", "Concepts Mastered", "Open Misconceptions", "Growth Score", "Last Active", "Latest Summary"],
      ...enriched!.map(x => [
        x.m.displayName,
        new Date(x.m.joinedAt).toLocaleDateString(),
        x.snaps.length.toString(),
        x.masteryCount.toString(),
        x.miscs.toString(),
        (x.growth >= 0 ? "+" : "") + x.growth,
        x.lastActive ? new Date(x.lastActive).toLocaleString() : "Never",
        (x.lastSnap?.summary ?? "").replace(/"/g, '""'),
      ]),
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${classRoom.name.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Class header */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#fff" }}>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#93c5fd" }}>Student Join Code</div>
            <p className="text-xs mb-3" style={{ color: "#cbd5e1" }}>Students enter this to join your class:</p>
            <ClassCode code={classRoom.code} dark />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: "#fbbf24" }}>Co-Teacher Code</div>
            <p className="text-xs mb-3" style={{ color: "#cbd5e1" }}>Other teachers enter this to co-teach:</p>
            <ClassCode code={classRoom.teacherCode} dark accent="#fbbf24" />
          </div>
        </div>

        <div className="mt-5 pt-5 border-t flex items-center justify-between flex-wrap gap-3" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "#cbd5e1" }}>Teachers:</span>
            {classRoom.teachers.map(t => {
              const isOwner = t.id === classRoom.ownerId;
              const isMe = t.id === viewerId;
              const canRemove = viewerId === classRoom.ownerId && !isOwner;
              return (
                <span key={t.id} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: `1px solid ${isOwner ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.15)"}` }}>
                  <div className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold"
                    style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)" }}>
                    {t.name.slice(0, 2).toUpperCase()}
                  </div>
                  {t.name}{isMe && " (you)"}
                  {isOwner && <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: "0.65rem" }}>OWNER</span>}
                  {canRemove && (
                    <button onClick={async () => { if (confirm(`Remove ${t.name}?`)) { await removeCoTeacher(classRoom.id, t.id); onRefresh(); } }}
                      style={{ color: "#fca5a5", marginLeft: 2 }}>
                      <X size={10} />
                    </button>
                  )}
                </span>
              );
            })}
            <button onClick={onInviteTeacher}
              className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
              style={{ background: "rgba(251,191,36,0.18)", color: "#fbbf24", border: "1px dashed rgba(251,191,36,0.4)" }}>
              <UserPlus size={11} /> Invite co-teacher
            </button>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: "#cbd5e1" }}>Created {new Date(classRoom.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      </div>

      {/* Roster */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
        <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3" style={{ borderColor: "#f1f5f9" }}>
          <h2 className="font-bold text-sm" style={{ color: "#0f172a" }}>Roster · {classRoom.name}</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs">
              <ArrowUpDown size={11} style={{ color: "#94a3b8" }} />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)}
                className="bg-transparent outline-none text-xs px-2 py-1 rounded-lg"
                style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a" }}>
                <option value="activity">Sort: Recent activity</option>
                <option value="name">Sort: Name</option>
                <option value="growth">Sort: Growth (high → low)</option>
                <option value="miscs">Sort: Open misconceptions</option>
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs"
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <Search size={12} style={{ color: "#94a3b8" }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search students…" className="bg-transparent outline-none text-xs w-36"
                style={{ color: "#0f172a" }} />
            </div>
            <button onClick={onInviteStudents}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg text-white"
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>
              <UserPlus size={11} /> Invite Students
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
              <Download size={11} /> Export CSV
            </button>
          </div>
        </div>

        <div className="divide-y" style={{ borderColor: "#f1f5f9" }}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: "#94a3b8" }}>
              {search ? "No students match your search." : "No students yet. Share the class code above so they can join."}
            </div>
          ) : filtered.map(({ m, snaps, lastSnap, masteryCount, miscs, growth, lastActive }) => (
            <button key={m.userId} onClick={() => onOpenStudent(m.userId)} className="w-full text-left px-6 py-4 transition-colors"
              onMouseEnter={e => (e.currentTarget.style.background = "#fafafa")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg,#2563eb,#6366f1)" }}>
                    {m.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm" style={{ color: "#0f172a" }}>{m.displayName}</span>
                      {!m.isMock && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#dcfce7", color: "#15803d" }}>LIVE</span>}
                    </div>
                    <div className="text-xs flex items-center gap-2 flex-wrap" style={{ color: "#94a3b8" }}>
                      <span title={lastActive ? new Date(lastActive).toLocaleString() : "Never active"}>
                        Last active {lastActive ? timeAgo(lastActive) : "never"}
                      </span>
                      <span>·</span>
                      <span>{snaps.length} session{snaps.length !== 1 ? "s" : ""}</span>
                      {lastSnap && <><span>·</span><span className="truncate max-w-[280px] inline-block">{lastSnap.summary}</span></>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
                  <div className="hidden md:block"><Stat label="Mastered" value={masteryCount} color="#16a34a" /></div>
                  <Stat label="Misc." value={miscs} color={miscs > 0 ? "#d97706" : "#94a3b8"} />
                  <Stat label="Growth" value={growth >= 0 ? `+${growth}` : `${growth}`} color={growth > 10 ? "#16a34a" : growth >= 0 ? "#64748b" : "#dc2626"} />
                  <ChevronRight size={16} style={{ color: "#94a3b8" }} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

interface EnrichedMember {
  m: ClassMember; snaps: LearningSnapshot[]; lastSnap: LearningSnapshot | undefined;
  masteryCount: number; miscs: number; growth: number; lastActive: number;
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="text-right">
      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{label}</div>
      <div className="text-sm font-extrabold" style={{ color }}>{value}</div>
    </div>
  );
}

// ─── Async wrapper for student detail (loads snapshots) ─────────────
function AsyncStudentDetailView({ student, classFilter, viewerId, onRefresh }: {
  student: ClassMember;
  classFilter: string | null;
  viewerId: string;
  onRefresh: () => void;
}) {
  const [snapshots, setSnapshots] = useState<LearningSnapshot[] | null>(null);
  const [forbidden, setForbidden] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadSnaps = useCallback(async () => {
    try {
      const r = await fetch(`/api/snapshots/${student.userId}`, { cache: "no-store" });
      if (r.status === 403) { setForbidden(true); return; }
      const data = await r.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setSnapshots((data.snapshots ?? []).map((s: any) => ({
        id: s.id, timestamp: new Date(s.created_at).getTime(),
        concepts: s.concepts ?? [], misconceptions: s.misconceptions ?? [],
        hint_count: s.hint_count ?? 0, aha_moment: s.aha_moment ?? null,
        question_depth: s.question_depth ?? "surface",
        engagement_quality: s.engagement_quality ?? 5,
        growth_signals: s.growth_signals ?? [], summary: s.summary ?? "",
        classId: s.class_id ?? undefined,
        detected_subject: s.detected_subject ?? undefined,
        subject_mismatch: s.subject_mismatch ?? false,
        valid_for_analytics: s.valid_for_analytics ?? true,
      })));
    } catch { setSnapshots([]); }
  }, [student.userId]);

  useEffect(() => { loadSnaps(); }, [loadSnaps, reloadKey]);

  const refresh = useCallback(() => {
    setReloadKey(k => k + 1);
    onRefresh();
  }, [onRefresh]);

  if (forbidden) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
        <Lock size={32} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
        <h2 className="font-bold text-lg mb-2" style={{ color: "#0f172a" }}>Private profile</h2>
        <p className="text-sm" style={{ color: "#64748b" }}>You don&apos;t have permission to view this student&apos;s Learning DNA.</p>
      </div>
    );
  }
  if (!snapshots) return <div className="text-center py-12 text-sm" style={{ color: "#94a3b8" }}>Loading…</div>;

  return <StudentDetailView student={student} snapshots={snapshots} classFilter={classFilter} viewerId={viewerId} onRefresh={refresh} />;
}

// ─── Student detail body ────────────────────────────────────────────
function StudentDetailView({ student, snapshots: snapshotsIn, classFilter, viewerId, onRefresh }: {
  student: ClassMember;
  snapshots: LearningSnapshot[];
  classFilter?: string | null;
  viewerId?: string;
  onRefresh?: () => void;
}) {
  const snapshots = classFilter ? snapshotsIn.filter(s => s.classId === classFilter) : snapshotsIn;

  const [noteText, setNoteText] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteUpdatedAt, setNoteUpdatedAt] = useState<number | null>(null);
  useEffect(() => {
    if (!viewerId || viewerId === student.userId) return;
    (async () => {
      const n = await getNote(student.userId);
      setNoteText(n?.note ?? "");
      setNoteUpdatedAt(n?.updatedAt ?? null);
    })();
  }, [viewerId, student.userId]);

  async function saveNote() {
    if (!viewerId) return;
    await setNote(student.userId, noteText);
    setNoteSaved(true);
    setNoteUpdatedAt(Date.now());
    setTimeout(() => setNoteSaved(false), 2000);
  }
  const showNotePanel = viewerId && viewerId !== student.userId;

  const mastery = aggregateMastery(snapshots);
  const miscs = recentMisconceptions(snapshots, 10);
  const subjects = subjectBreakdown(snapshots);
  const depths = depthTrend(snapshots);
  const growth = growthScore(snapshots);
  const avgEng = snapshots.length ? Math.round(snapshots.reduce((a, s) => a + s.engagement_quality, 0) / snapshots.length) : 0;
  const latestAha = [...snapshots].reverse().find(s => s.aha_moment)?.aha_moment ?? null;
  const allGrowthSignals = snapshots.flatMap(s => s.growth_signals).slice(-5);

  return (
    <>
      <div className="rounded-2xl p-6 mb-6" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg,#2563eb,#6366f1)" }}>
            {student.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#0f172a" }}>{student.displayName}</h1>
            <p className="text-sm flex items-center gap-1.5" style={{ color: "#64748b" }}>
              {snapshots.length} session{snapshots.length !== 1 ? "s" : ""} analyzed
              {snapshots.length > 0 && (
                <>
                  <span>·</span>
                  <Clock size={11} />
                  <span>last active {timeAgo(snapshots[snapshots.length - 1].timestamp)}</span>
                </>
              )}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6 w-full md:w-auto">
            <Stat label="Mastery" value={mastery.filter(c => c.level === "demonstrated" || c.level === "transferred").length} color="#16a34a" />
            <Stat label="Engagement" value={`${avgEng}/10`} color="#2563eb" />
            <Stat label="Growth" value={growth >= 0 ? `+${growth}` : `${growth}`} color={growth >= 0 ? "#16a34a" : "#dc2626"} />
          </div>
        </div>
      </div>

      {latestAha && (
        <div className="rounded-2xl p-5 mb-6 flex items-start gap-3"
          style={{ background: "linear-gradient(135deg,#fffbeb,#fef3c7)", border: "1px solid #fde68a" }}>
          <Sparkles size={20} style={{ color: "#d97706", flexShrink: 0, marginTop: 2 }} />
          <div>
            <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "#92400e" }}>Latest aha moment</div>
            <p className="text-sm italic leading-relaxed" style={{ color: "#92400e" }}>&ldquo;{latestAha}&rdquo;</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: "#0f172a" }}>Concept Mastery</h2>
          {mastery.length === 0 ? (
            <p className="text-xs" style={{ color: "#94a3b8" }}>No concepts tracked yet.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {mastery.map(c => (
                <div key={c.name} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: "#f8fafc" }}>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Brain size={13} style={{ color: "#6366f1", flexShrink: 0 }} />
                    <span className="text-sm font-medium truncate" style={{ color: "#0f172a" }}>{c.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#fff", color: "#64748b", border: "1px solid #e2e8f0" }}>{c.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "#94a3b8" }}>{c.encounters}x</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: MASTERY_COLOR[c.level].bg, color: MASTERY_COLOR[c.level].text }}>
                      {MASTERY_COLOR[c.level].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {showNotePanel && (
            <div className="rounded-2xl p-5" style={{ background: "#fffbeb", border: "1px solid #fde68a", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <h2 className="font-bold text-sm mb-1 flex items-center gap-1.5" style={{ color: "#92400e" }}>
                <StickyNote size={13} /> My Notes (private)
              </h2>
              <p className="text-xs mb-3" style={{ color: "#a16207" }}>Only you can see this.</p>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4}
                placeholder="Pull aside next week to review chain rule…"
                className="w-full rounded-lg px-3 py-2 text-xs resize-none outline-none"
                style={{ background: "#fff", border: "1px solid #fde68a", color: "#0f172a" }} />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs" style={{ color: "#a16207" }}>
                  {noteUpdatedAt ? `Updated ${timeAgo(noteUpdatedAt)}` : "Not saved yet"}
                </span>
                <button onClick={saveNote}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{ background: noteSaved ? "#16a34a" : "#d97706", color: "#fff" }}>
                  {noteSaved ? "✓ Saved" : "Save Note"}
                </button>
              </div>
            </div>
          )}

          <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <h2 className="font-bold text-sm mb-3 flex items-center gap-1.5" style={{ color: "#0f172a" }}>
              <AlertTriangle size={13} style={{ color: "#d97706" }} /> Misconceptions
            </h2>
            {miscs.length === 0 ? (
              <p className="text-xs" style={{ color: "#16a34a" }}>✓ No active misconceptions detected.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {miscs.slice(0, 5).map((m, i) => (
                  <div key={i} className="p-2.5 rounded-lg" style={{ background: m.addressed ? "#f0fdf4" : "#fffbeb", border: `1px solid ${m.addressed ? "#bbf7d0" : "#fde68a"}` }}>
                    <div className="text-xs font-bold" style={{ color: m.addressed ? "#15803d" : "#92400e" }}>{m.concept}</div>
                    <p className="text-xs leading-snug mt-0.5" style={{ color: m.addressed ? "#166534" : "#78350f" }}>{m.wrong_model}</p>
                    {m.addressed ? (
                      <span className="text-xs mt-1 inline-block" style={{ color: "#16a34a" }}>✓ Addressed</span>
                    ) : viewerId && viewerId !== student.userId ? (
                      <button
                        onClick={async () => { await markMisconceptionAddressed(student.userId, m.concept, m.wrong_model); onRefresh?.(); }}
                        className="text-xs mt-1.5 px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: "#16a34a", color: "#fff" }}>
                        Mark as addressed ✓
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
            <h2 className="font-bold text-sm mb-3" style={{ color: "#0f172a" }}>Subjects</h2>
            <div className="flex flex-col gap-2">
              {subjects.map(s => (
                <div key={s.subject} className="flex items-center justify-between text-xs">
                  <span style={{ color: "#374151" }}>{s.subject}</span>
                  <span className="font-bold" style={{ color: "#2563eb" }}>{s.count}</span>
                </div>
              ))}
              {subjects.length === 0 && <span className="text-xs" style={{ color: "#94a3b8" }}>None yet.</span>}
            </div>
          </div>

          {allGrowthSignals.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
              <h2 className="font-bold text-sm mb-3" style={{ color: "#0f172a" }}>Growth Signals</h2>
              <ul className="flex flex-col gap-1.5">
                {allGrowthSignals.map((g, i) => (
                  <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: "#374151" }}>
                    <TrendingUp size={11} style={{ color: "#10b981", flexShrink: 0, marginTop: 2 }} />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
        <h2 className="font-bold text-sm mb-4" style={{ color: "#0f172a" }}>Session History</h2>
        <div className="flex flex-col gap-3">
          {[...snapshots].reverse().slice(0, 8).map(s => (
            <div key={s.id} className="p-3 rounded-lg flex items-center justify-between gap-3" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium flex items-center gap-2" style={{ color: "#0f172a" }}>{s.summary}</div>
                <div className="text-xs mt-0.5 flex items-center gap-1.5 flex-wrap" style={{ color: "#94a3b8" }}>
                  <Clock size={10} />
                  <span title={new Date(s.timestamp).toLocaleString()}>
                    <strong style={{ color: "#475569" }}>{new Date(s.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</strong>
                    <span> · {timeAgo(s.timestamp)}</span>
                  </span>
                  <span>·</span><span>{s.concepts.length} concept{s.concepts.length !== 1 ? "s" : ""}</span>
                  <span>·</span><span>{s.hint_count} hint{s.hint_count !== 1 ? "s" : ""}</span>
                  <span>·</span><span>engagement {s.engagement_quality}/10</span>
                </div>
              </div>
              {s.question_depth === "conceptual" && (
                <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0" style={{ background: "#dcfce7", color: "#15803d" }}>conceptual</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Student view (their own profile) ───────────────────────────────
function StudentView({ userId, displayName, classes, onJoin, joinModal, setJoinModal, onAction }: {
  userId: string; displayName: string; classes: ClassRoom[];
  onJoin: () => void; joinModal: boolean; setJoinModal: (b: boolean) => void;
  onAction: () => void;
}) {
  const router = useRouter();
  const [snapshots, setSnapshots] = useState<LearningSnapshot[] | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  useEffect(() => { getMySnapshots().then(setSnapshots); }, []);

  function studyForClass(classId: string) {
    setChatMode({ type: "class", classId });
    router.push("/chat");
  }

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>
      <Header breadcrumb={null} roleLabel="Student" />
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold mb-1" style={{ color: "#0f172a" }}>Your Learning Profile</h1>
            <p className="text-sm" style={{ color: "#64748b" }}>Private to you. Your teacher sees their own copy of your progress.</p>
          </div>
          <button onClick={onJoin}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
            <Plus size={14} /> Join Another Class
          </button>
        </div>

        <div className="rounded-2xl p-5 mb-6" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>Your Classes</div>
            <div className="text-xs" style={{ color: "#94a3b8" }}>Click a class to study for it, or filter your DNA below.</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: activeFilter === null ? "#0f172a" : "#f8fafc",
                color: activeFilter === null ? "#fff" : "#64748b",
                border: `1px solid ${activeFilter === null ? "#0f172a" : "#e2e8f0"}`,
              }}>
              All sessions
            </button>
            {classes.map(c => {
              const isFiltered = activeFilter === c.id;
              return (
                <div key={c.id} className="flex items-center gap-1 rounded-full transition-all"
                  style={{
                    background: isFiltered ? "#1d4ed8" : "#eff6ff",
                    border: `1px solid ${isFiltered ? "#1d4ed8" : "#bfdbfe"}`,
                  }}>
                  <button
                    onClick={() => setActiveFilter(isFiltered ? null : c.id)}
                    className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs font-medium"
                    style={{ color: isFiltered ? "#fff" : "#1d4ed8" }}
                    title="Filter DNA below by this class">
                    <GraduationCap size={11} /> {c.name}
                    <span className="font-mono opacity-70" style={{ color: isFiltered ? "#dbeafe" : "#64748b" }}>{c.code}</span>
                  </button>
                  <button
                    onClick={() => studyForClass(c.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-r-full"
                    style={{
                      background: isFiltered ? "rgba(255,255,255,0.18)" : "#2563eb",
                      color: "#fff",
                      borderLeft: `1px solid ${isFiltered ? "rgba(255,255,255,0.25)" : "#1d4ed8"}`,
                    }}
                    title="Open chat and study for this class">
                    Study <ChevronRight size={11} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {!snapshots ? (
          <div className="text-center py-12 text-sm" style={{ color: "#94a3b8" }}>Loading…</div>
        ) : snapshots.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
            <Sparkles size={32} style={{ color: "#2563eb", margin: "0 auto 12px" }} />
            <h2 className="font-bold text-lg mb-2" style={{ color: "#0f172a" }}>Your Learning DNA is empty</h2>
            <p className="text-sm" style={{ color: "#64748b" }}>Start a conversation in the chat and Claude will track your understanding.</p>
            <Link href="/chat" className="inline-flex items-center gap-1.5 mt-4 rounded-xl px-4 py-2 text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", textDecoration: "none" }}>
              Start Chatting
            </Link>
          </div>
        ) : (
          <StudentDetailView
            student={{ classId: "", userId, joinedAt: 0, isMock: false, displayName, avatar: displayName.slice(0, 2).toUpperCase() }}
            snapshots={snapshots}
            classFilter={activeFilter}
            viewerId={userId}
          />
        )}
      </div>

      {joinModal && <JoinClassModal onClose={() => setJoinModal(false)} onJoined={async () => { setJoinModal(false); onAction(); }} />}
    </div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────
function EmptyState({ onCreate, onJoin, createModal, setCreateModal, joinModal, setJoinModal, onAction }: {
  onCreate: () => void; onJoin: () => void;
  createModal: boolean; setCreateModal: (b: boolean) => void;
  joinModal: boolean; setJoinModal: (b: boolean) => void;
  onAction: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: "#f8fafc" }}>
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🎓</div>
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: "#0f172a" }}>Welcome to the Dashboard</h1>
          <p className="text-base" style={{ color: "#64748b" }}>Are you a teacher or a student?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <button onClick={onCreate} className="rounded-2xl p-6 text-left transition-all"
            style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff", boxShadow: "0 8px 32px rgba(37,99,235,0.3)" }}>
            <GraduationCap size={28} style={{ marginBottom: 12 }} />
            <h3 className="font-bold text-lg mb-1.5">I&apos;m a Teacher</h3>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.85)" }}>Create a class, share the code with your students, and track every student&apos;s understanding from one screen.</p>
            <div className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: "#fff" }}>
              Create my first class <ChevronRight size={14} />
            </div>
          </button>

          <button onClick={onJoin} className="rounded-2xl p-6 text-left transition-all"
            style={{ background: "#fff", color: "#0f172a", border: "2px solid #e2e8f0" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "#2563eb")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "#e2e8f0")}>
            <Users size={28} style={{ marginBottom: 12, color: "#2563eb" }} />
            <h3 className="font-bold text-lg mb-1.5">I&apos;m a Student</h3>
            <p className="text-sm mb-4" style={{ color: "#64748b" }}>Have a class code from your teacher? Enter it to join your class and track your own learning DNA.</p>
            <div className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: "#2563eb" }}>
              Join my class <ChevronRight size={14} />
            </div>
          </button>
        </div>

        <div className="text-center mt-8">
          <Link href="/chat" className="text-sm" style={{ color: "#94a3b8" }}>Skip — just chat for now</Link>
        </div>
      </div>

      {createModal && <CreateClassModal onClose={() => setCreateModal(false)} onCreated={async () => { setCreateModal(false); onAction(); }} />}
      {joinModal && <JoinClassModal onClose={() => setJoinModal(false)} onJoined={async () => { setJoinModal(false); onAction(); }} />}
    </div>
  );
}

// ─── Modals ─────────────────────────────────────────────────────────
function CreateClassModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<ClassRoom | null>(null);

  async function submit() {
    if (!name.trim() || busy) return;
    setBusy(true);
    const c = await createClass(name.trim());
    setBusy(false);
    if (c) setCreated(c);
    else alert("Failed to create class. Try again.");
  }

  return (
    <ModalShell onClose={onClose}>
      {!created ? (
        <>
          <div className="text-3xl mb-4 text-center">🏫</div>
          <h2 className="font-extrabold text-xl mb-2 text-center" style={{ color: "#0f172a" }}>Create a New Class</h2>
          <p className="text-sm mb-5 text-center" style={{ color: "#64748b" }}>Give your class a name. You&apos;ll get a code to share with students.</p>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus
            onKeyDown={e => e.key === "Enter" && submit()}
            placeholder='e.g. "Period 3 Biology"'
            className="w-full rounded-xl px-4 py-3 text-sm mb-4"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#0f172a" }} />
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium"
              style={{ background: "#f1f5f9", color: "#64748b" }}>Cancel</button>
            <button onClick={submit} disabled={!name.trim() || busy} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white"
              style={{ background: name.trim() && !busy ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "#cbd5e1", cursor: name.trim() && !busy ? "pointer" : "not-allowed" }}>
              {busy ? "Creating…" : "Create Class"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-3xl mb-4 text-center">🎉</div>
          <h2 className="font-extrabold text-xl mb-2 text-center" style={{ color: "#0f172a" }}>Class created!</h2>
          <p className="text-sm mb-5 text-center" style={{ color: "#64748b" }}>Share this code with your students:</p>
          <div className="mb-5"><ClassCode code={created.code} large /></div>
          <div className="rounded-xl p-3 mb-5 text-xs" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }}>
            ℹ️ We&apos;ve pre-populated 6 sample students so you can see what the dashboard looks like.
          </div>
          <button onClick={onCreated} className="w-full rounded-xl py-2.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
            Go to Class
          </button>
        </>
      )}
    </ModalShell>
  );
}

function JoinClassModal({ onClose, onJoined }: { onClose: () => void; onJoined: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy) return;
    setError(null); setBusy(true);
    const result = await joinClassByCode(code);
    setBusy(false);
    if (!result.ok) setError(result.error ?? "Could not join.");
    else onJoined();
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="text-3xl mb-4 text-center">🔑</div>
      <h2 className="font-extrabold text-xl mb-2 text-center" style={{ color: "#0f172a" }}>Join a Class</h2>
      <p className="text-sm mb-5 text-center" style={{ color: "#64748b" }}>Enter the code your teacher gave you.</p>
      <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} autoFocus
        onKeyDown={e => e.key === "Enter" && submit()}
        placeholder="INQ-XXXX"
        className="w-full rounded-xl px-4 py-3 text-base font-mono text-center tracking-widest mb-3"
        style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#0f172a" }} />
      {error && <p className="text-xs mb-3 text-center" style={{ color: "#dc2626" }}>{error}</p>}
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium"
          style={{ background: "#f1f5f9", color: "#64748b" }}>Cancel</button>
        <button onClick={submit} disabled={code.length < 4 || busy} className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white"
          style={{ background: code.length >= 4 && !busy ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "#cbd5e1", cursor: code.length >= 4 && !busy ? "pointer" : "not-allowed" }}>
          {busy ? "Joining…" : "Join Class"}
        </button>
      </div>
    </ModalShell>
  );
}

function InviteStudentsModal({ classRoom, onClose }: { classRoom: ClassRoom; onClose: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; results: { email: string; ok: boolean; error?: string }[] } | null>(null);

  function parseEmails(s: string): string[] {
    // Split on commas, semicolons, spaces, or newlines
    return s.split(/[\s,;]+/).map(e => e.trim()).filter(Boolean);
  }
  const emails = parseEmails(text);
  const validCount = emails.filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)).length;

  async function send() {
    if (busy || validCount === 0) return;
    setBusy(true);
    const r = await fetch(`/api/classes/${classRoom.id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emails, role: "student" }),
    });
    const data = await r.json();
    setBusy(false);
    if (r.ok) setResult(data);
    else alert(data.error ?? "Failed to send invites");
  }

  return (
    <ModalShell onClose={onClose}>
      {!result ? (
        <>
          <div className="text-3xl mb-4 text-center">📧</div>
          <h2 className="font-extrabold text-xl mb-2 text-center" style={{ color: "#0f172a" }}>Invite Students by Email</h2>
          <p className="text-sm mb-4 text-center" style={{ color: "#64748b" }}>
            Paste student emails — one per line, or separated by commas. Each student gets an email with a one-click join link for <strong>{classRoom.name}</strong>.
          </p>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={6} autoFocus
            placeholder={"alex@school.edu\nsofia@school.edu\njordan@school.edu"}
            className="w-full rounded-xl px-3 py-2 text-sm font-mono outline-none resize-none mb-2"
            style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#0f172a" }} />
          <div className="text-xs mb-4" style={{ color: "#64748b" }}>
            {validCount > 0
              ? <><strong style={{ color: "#16a34a" }}>{validCount}</strong> valid email{validCount !== 1 ? "s" : ""} detected</>
              : "Add at least one email to send"}
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 rounded-xl py-2.5 text-sm font-medium"
              style={{ background: "#f1f5f9", color: "#64748b" }}>Cancel</button>
            <button onClick={send} disabled={validCount === 0 || busy}
              className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white"
              style={{ background: validCount > 0 && !busy ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "#cbd5e1",
                       cursor: validCount > 0 && !busy ? "pointer" : "not-allowed" }}>
              {busy ? "Sending…" : `Send ${validCount} Invite${validCount !== 1 ? "s" : ""}`}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="text-3xl mb-4 text-center">✉️</div>
          <h2 className="font-extrabold text-xl mb-2 text-center" style={{ color: "#0f172a" }}>
            {result.sent > 0 ? `${result.sent} invite${result.sent !== 1 ? "s" : ""} sent!` : "Couldn't send invites"}
          </h2>
          <p className="text-sm mb-5 text-center" style={{ color: "#64748b" }}>
            {result.sent > 0 ? "Students will get an email with a one-click join link. The link expires in 30 days." : "Check the errors below and try again."}
          </p>

          {result.results.some(r => !r.ok) && (
            <div className="rounded-xl p-3 mb-4 text-xs" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
              <div className="font-bold mb-1" style={{ color: "#92400e" }}>Some failed:</div>
              <ul className="space-y-0.5" style={{ color: "#78350f" }}>
                {result.results.filter(r => !r.ok).map((r, i) => (
                  <li key={i}><code>{r.email}</code> — {r.error}</li>
                ))}
              </ul>
            </div>
          )}

          <button onClick={onClose} className="w-full rounded-xl py-2.5 text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
            Done
          </button>
        </>
      )}
    </ModalShell>
  );
}

function InviteTeacherModal({ classRoom, onClose }: { classRoom: ClassRoom; onClose: () => void }) {
  return (
    <ModalShell onClose={onClose}>
      <div className="text-3xl mb-4 text-center">🤝</div>
      <h2 className="font-extrabold text-xl mb-2 text-center" style={{ color: "#0f172a" }}>Invite a Co-Teacher</h2>
      <p className="text-sm mb-5 text-center" style={{ color: "#64748b" }}>
        Share this <strong>teacher code</strong> with another teacher.
      </p>
      <div className="mb-5"><ClassCode code={classRoom.teacherCode} large accent="#d97706" /></div>
      <div className="rounded-xl p-3 mb-5 text-xs" style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e" }}>
        ⚠ <strong>Only share with teachers and admins.</strong> Anyone with this code can view all student data in this class.
      </div>
      <button onClick={onClose} className="w-full rounded-xl py-2.5 text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
        Done
      </button>
    </ModalShell>
  );
}

function ModalShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }} onClick={onClose}>
      <div className="rounded-3xl max-w-md w-full p-6" style={{ background: "#fff", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ─── Class code with copy ───────────────────────────────────────────
function ClassCode({ code, dark, large, accent }: { code: string; dark?: boolean; large?: boolean; accent?: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }
  const accentColor = accent ?? "#1d4ed8";
  return (
    <button onClick={copy} className="flex items-center gap-2 rounded-xl transition-all"
      style={{
        background: dark ? "rgba(255,255,255,0.08)" : `${accentColor}11`,
        border: dark ? `1.5px dashed ${accent ?? "rgba(255,255,255,0.3)"}` : `1.5px dashed ${accentColor}55`,
        padding: large ? "1rem 1.5rem" : "0.5rem 0.85rem",
        color: dark ? "#fff" : accentColor,
        fontFamily: "ui-monospace, monospace",
        fontSize: large ? "1.5rem" : "0.85rem",
        fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer",
      }}>
      {code}
      {copied ? <Check size={large ? 18 : 13} /> : <Copy size={large ? 16 : 12} style={{ opacity: 0.7 }} />}
    </button>
  );
}

function HeroStat({ label, value, sub, color, alert }: { label: string; value: string | number; sub: string; color: string; alert?: boolean }) {
  return (
    <div className="rounded-xl p-4 relative"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: `1px solid ${alert ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.08)"}`,
        backdropFilter: "blur(8px)",
      }}>
      <div className="text-xs font-bold uppercase tracking-wide mb-1.5" style={{ color }}>{label}</div>
      <div className="text-3xl font-extrabold mb-0.5" style={{ color: "#fff" }}>{value}</div>
      <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{sub}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color, bg }: {
  icon: React.ElementType; label: string; value: string | number; sub: string; color: string; bg: string;
}) {
  return (
    <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 1px 6px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#94a3b8" }}>{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div className="text-3xl font-extrabold mb-0.5" style={{ color: "#0f172a" }}>{value}</div>
      <div className="text-xs" style={{ color: "#94a3b8" }}>{sub}</div>
    </div>
  );
}

function timeAgo(t: number | undefined): string {
  if (!t) return "—";
  const ms = Date.now() - t;
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? "s" : ""} ago`;
  return new Date(t).toLocaleDateString();
}

void Activity;
