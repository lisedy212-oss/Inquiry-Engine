"use client";

import { useState } from "react";
import Link from "next/link";
import {
  GraduationCap, Users, Sparkles, Brain,
  Shield, FileText, Image as ImageIcon, KeyRound, Eye, EyeOff,
  AlertTriangle, TrendingUp, Award, StickyNote, Download,
  Zap, ChevronRight, CheckCircle2, UserPlus,
} from "lucide-react";
import NavMenu from "@/components/NavMenu";

type Tab = "student" | "teacher";

export default function GuidePage() {
  const [tab, setTab] = useState<Tab>("student");

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc" }}>

      {/* Header */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, zIndex: 30 }}>
        <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 max-w-6xl mx-auto gap-2">
          <Link href="/" className="flex items-center gap-2.5 min-w-0" style={{ textDecoration: "none" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 2px 8px rgba(37,99,235,0.3)" }}>
              🔍
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm truncate" style={{ color: "#0f172a" }}>Inquiry Engine</div>
              <div className="text-xs" style={{ color: "#94a3b8" }}>User Guide</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/chat" className="text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg"
              style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe", textDecoration: "none" }}>
              Open Chat →
            </Link>
            <NavMenu />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-14 px-8" style={{ background: "linear-gradient(180deg, #eff6ff, #fff)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-4">📖</div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3" style={{ color: "#0f172a" }}>
            How to use the <span style={{ background: "linear-gradient(135deg,#2563eb,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Inquiry Engine</span>
          </h1>
          <p className="text-base" style={{ color: "#475569" }}>
            A short, practical guide. Pick your role below.
          </p>

          {/* Tab switcher */}
          <div className="inline-flex mt-8 rounded-2xl p-1.5" style={{ background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
            <TabButton active={tab === "student"} onClick={() => setTab("student")} icon={<GraduationCap size={15} />} label="For Students" />
            <TabButton active={tab === "teacher"} onClick={() => setTab("teacher")} icon={<Users size={15} />} label="For Teachers" />
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-8 pb-20">
        <div className="max-w-4xl mx-auto">
          {tab === "student" ? <StudentGuide /> : <TeacherGuide />}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-8 py-14" style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#fff" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-extrabold mb-2">Ready to start?</h2>
          <p className="text-sm mb-6" style={{ color: "#cbd5e1" }}>The best way to learn the Inquiry Engine is to try it.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link href="/chat" className="rounded-2xl px-6 py-3 text-sm font-bold"
              style={{ background: "#fff", color: "#0f172a", textDecoration: "none" }}>
              Open Chat
            </Link>
            <Link href="/dashboard" className="rounded-2xl px-6 py-3 text-sm font-bold"
              style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", textDecoration: "none" }}>
              Open Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Tab button ─────────────────────────────────────────────────────
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
      style={{
        background: active ? "linear-gradient(135deg,#2563eb,#1d4ed8)" : "transparent",
        color: active ? "#fff" : "#64748b",
        boxShadow: active ? "0 4px 12px rgba(37,99,235,0.3)" : "none",
      }}>
      {icon} {label}
    </button>
  );
}

// ═══ STUDENT GUIDE ════════════════════════════════════════════════
function StudentGuide() {
  return (
    <div className="flex flex-col gap-8">

      {/* Intro */}
      <Card>
        <SectionTitle icon="✨" title="What is the Inquiry Engine?" />
        <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
          The Inquiry Engine is an AI study partner powered by <strong>Claude</strong>. It&apos;s different from ChatGPT or Google: <strong>it will never just give you the answer</strong>. Instead, it asks you the right questions to guide you to discover the answer yourself — building the kind of real understanding that sticks for tests, projects, and real life.
        </p>
        <Callout color="blue" icon={<Sparkles size={14} />}>
          Think of it like a great tutor who refuses to do your homework for you, but always knows the next question to ask.
        </Callout>
      </Card>

      {/* Quick start */}
      <Card>
        <SectionTitle icon="🚀" title="Quick Start (3 steps)" />
        <div className="flex flex-col gap-3">
          <Step n={1} title="Join your class">
            Go to the <strong>Dashboard</strong>, click <strong>&ldquo;I&apos;m a Student&rdquo;</strong>, and enter the class code your teacher gave you (looks like <code className="px-1 py-0.5 rounded font-mono text-xs" style={{ background: "#eff6ff", color: "#1d4ed8" }}>INQ-A8X2</code>).
          </Step>
          <Step n={2} title="Pick which class to study for">
            In the chat, above the search bar you&apos;ll see a class pill. If you&apos;re in multiple classes, click it to switch between them. Every session counts toward whichever class you have selected.
          </Step>
          <Step n={3} title="Ask a real question">
            Type something you&apos;re actually stuck on. The more specific, the better. Don&apos;t just say <em>&ldquo;help with math&rdquo;</em> — say <em>&ldquo;I don&apos;t understand why the chain rule works.&rdquo;</em>
          </Step>
        </div>
      </Card>

      {/* How classes work */}
      <Card highlight>
        <SectionTitle icon="🎓" title="Switching between classes" />
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#475569" }}>
          If you&apos;re in more than one class (say, Biology and Pre-Calc), you need to tell the Engine which one you&apos;re working on <em>before</em> you start chatting. Otherwise your Biology questions might get tagged to your Pre-Calc class.
        </p>
        <ol className="text-sm space-y-1.5 ml-5 list-decimal mb-4" style={{ color: "#374151" }}>
          <li>Look at the pill above the chat search bar — it shows the current class (e.g. <strong>&ldquo;Class: Biology&rdquo;</strong>)</li>
          <li><strong>Click the pill</strong> to open a dropdown of all your classes</li>
          <li>Pick the class you&apos;re studying for right now</li>
          <li>Every message you send next gets tagged to that class&apos;s teacher dashboard</li>
        </ol>
        <Callout color="blue" icon={<Shield size={14} />}>
          You can also jump straight in by clicking <strong>&ldquo;Study →&rdquo;</strong> on any class card in your dashboard — it&apos;ll open the chat with that class already selected.
        </Callout>
      </Card>

      {/* Joining a class */}
      <Card>
        <SectionTitle icon={<KeyRound size={18} />} title="Joining your teacher's class" />
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#475569" }}>
          Your teacher will give you a class code like <code className="px-1.5 py-0.5 rounded font-mono text-xs" style={{ background: "#eff6ff", color: "#1d4ed8" }}>INQ-A8X2</code>. To join:
        </p>
        <ol className="text-sm space-y-1.5 ml-5 list-decimal" style={{ color: "#374151" }}>
          <li>Go to <strong>Dashboard</strong> from the chat header</li>
          <li>Click <strong>&ldquo;I&apos;m a Student → Join my class&rdquo;</strong></li>
          <li>Enter the code and hit Join</li>
        </ol>
        <Callout color="green" icon={<CheckCircle2 size={14} />}>
          Once you&apos;re in a class, you can tag any chat to that class via the privacy mode pill. Only the teachers of that class can see those sessions — never other students.
        </Callout>
      </Card>

      {/* Features */}
      <Card>
        <SectionTitle icon="🛠️" title="Features in the chat" />
        <div className="grid md:grid-cols-2 gap-4">
          <Feature icon={<FileText size={16} />} title="PDF Upload" desc="Upload a textbook or worksheet and the AI cites exact pages — never just summarizes." free />
          <Feature icon={<ImageIcon size={16} />} title="Photo Upload" desc="Pick a homework photo from your library. The AI reads it and walks you through it." free />
          <Feature icon="📸" title="Take a Photo" desc="Open your device camera right inside the chat. Works on phones, tablets, and laptops with webcams." />
          <Feature icon={<Brain size={16} />} title="3 AI Modes" desc="Default (balanced), Fast (Haiku — instant), Thinking (deeper reasoning for hard problems)." />
          <Feature icon={<Sparkles size={16} />} title="Suggested Questions" desc="Stuck on what to ask? The welcome screen has four conversation starters by subject." />
          <Feature icon="📎" title="Attach Files & Links" desc="Paid plans: upload .txt/.md/.csv files or reference URLs." />
          <Feature icon={<Zap size={16} />} title="5 free questions/day" desc="Free plan limit. Resets at midnight. Upgrade for unlimited." />
        </div>
      </Card>

      {/* Learning DNA */}
      <Card>
        <SectionTitle icon="🧬" title="Your Learning DNA" />
        <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
          After every meaningful conversation, Claude analyzes your transcript and extracts:
        </p>
        <ul className="text-sm space-y-2 mt-3" style={{ color: "#374151" }}>
          <li className="flex items-start gap-2"><Brain size={14} style={{ color: "#6366f1", marginTop: 2, flexShrink: 0 }} /> <span><strong>Concepts you touched</strong> — each tagged with mastery (exposed → scaffolded → demonstrated → mastered)</span></li>
          <li className="flex items-start gap-2"><AlertTriangle size={14} style={{ color: "#d97706", marginTop: 2, flexShrink: 0 }} /> <span><strong>Misconceptions caught</strong> — the wrong mental models the AI noticed you had</span></li>
          <li className="flex items-start gap-2"><Sparkles size={14} style={{ color: "#fbbf24", marginTop: 2, flexShrink: 0 }} /> <span><strong>Aha moments</strong> — the exact quote where you got it</span></li>
          <li className="flex items-start gap-2"><TrendingUp size={14} style={{ color: "#10b981", marginTop: 2, flexShrink: 0 }} /> <span><strong>Growth signals</strong> — how your thinking is improving over time</span></li>
        </ul>
        <p className="text-sm mt-3 leading-relaxed" style={{ color: "#475569" }}>
          See your own profile in <strong>Dashboard</strong>. Nobody else does (except your teacher, and only for sessions tagged to their class).
        </p>
      </Card>

      {/* FAQ */}
      <Card>
        <SectionTitle icon="❓" title="FAQ" />
        <div className="flex flex-col gap-3">
          <Faq q="Why won't it just give me the answer?" a="Because answers don't make you smarter — understanding does. If you have a test tomorrow, the Inquiry Engine will get you to the answer faster than Googling it, AND you'll actually remember it." />
          <Faq q="Will my teacher see everything I ask?" a="Yes — every session you have while a class is selected gets analyzed and added to your teacher's dashboard for that class. That's the whole point: your teacher can see what concepts you've understood and what you're still stuck on, so they can help you in class. Pick the right class from the dropdown before you start chatting." />
          <Faq q="What if I'm in multiple classes?" a="Click the class pill above the chat search bar to switch between them. Whichever class is selected when you send a message is the one that session gets attributed to. You can also click 'Study →' on a class card in your dashboard to jump right in with that class active." />
          <Faq q="Can I use it for any subject?" a="Yes — math, science, history, coding, languages, literature, anything. The Socratic method works everywhere." />
          <Faq q="What if I type something by accident?" a="The Engine blocks very short or empty submissions. If you do send something nonsensical, the analyzer ignores it and your DNA stays clean." />
        </div>
      </Card>

    </div>
  );
}

// ═══ TEACHER GUIDE ════════════════════════════════════════════════
function TeacherGuide() {
  return (
    <div className="flex flex-col gap-8">

      <Card>
        <SectionTitle icon="🎓" title="What you'll get out of this" />
        <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>
          The Inquiry Engine isn&apos;t just a chatbot — it&apos;s a learning analytics platform. While your students use it for homework help, Claude analyzes every conversation and surfaces what they actually understood, what misconceptions they revealed, and how their thinking is changing over time. You see all of it from one screen.
        </p>
        <Callout color="blue" icon={<Award size={14} />}>
          <strong>The pitch to parents and admins:</strong> &ldquo;I can show you each student&apos;s real conceptual mastery, not just their grade.&rdquo;
        </Callout>
      </Card>

      {/* Setup */}
      <Card>
        <SectionTitle icon="🏫" title="30-second setup" />
        <div className="flex flex-col gap-3">
          <Step n={1} title="Create a class">
            Open <strong>Dashboard</strong>, click <strong>&ldquo;I&apos;m a Teacher&rdquo;</strong>, name your class (e.g. &ldquo;Period 3 Biology&rdquo;).
          </Step>
          <Step n={2} title="Get your codes">
            You&apos;ll see two codes — a <strong style={{ color: "#2563eb" }}>blue student code</strong> and an <strong style={{ color: "#d97706" }}>amber teacher code</strong>. Click any code to copy it.
          </Step>
          <Step n={3} title="Share with students">
            Put the blue code on the board. Students enter it once and they&apos;re in. No emails, no rosters.
          </Step>
          <Step n={4} title="Track in real time">
            Click any student in your roster to see their full Learning DNA — concepts mastered, misconceptions to address, growth over time.
          </Step>
        </div>
        <Callout color="green" icon={<Sparkles size={14} />}>
          When you create your first class, we auto-populate 6 sample students so you can immediately see what a full dashboard looks like. Real students replace them as they join.
        </Callout>
      </Card>

      {/* Co-teachers */}
      <Card>
        <SectionTitle icon={<UserPlus size={18} />} title="Co-teachers & admins" />
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#475569" }}>
          Share the <strong style={{ color: "#d97706" }}>amber teacher code</strong> with co-teachers, department heads, or administrators. They join as full co-teachers with the same access to student DNA — but each keeps their own private notes.
        </p>
        <ul className="text-sm space-y-1.5 ml-5 list-disc" style={{ color: "#374151" }}>
          <li>The teacher who creates the class is the <strong>Owner</strong> (badge in the teachers panel)</li>
          <li>Only the Owner can delete the class or remove other teachers</li>
          <li>Any teacher can mark misconceptions as addressed, add notes, and export CSVs</li>
          <li>Notes are <strong>private per teacher</strong> — what you write is only visible to you</li>
        </ul>
        <Callout color="amber" icon={<Shield size={14} />}>
          Only share the teacher code with people who should see all student data. The student code stays public-safe.
        </Callout>
      </Card>

      {/* Reading the dashboard */}
      <Card>
        <SectionTitle icon="📊" title="Reading the Learning DNA" />
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#475569" }}>
          When you click a student, you see their full profile. Here&apos;s what every section means:
        </p>
        <div className="flex flex-col gap-3">
          <DnaRow icon={<Brain size={16} />} color="#6366f1" title="Concept Mastery" desc="Each concept they've touched, plus a mastery badge. Aim for students to move from 'Scaffolded' to 'Demonstrated' over a unit." />
          <DnaRow icon={<AlertTriangle size={16} />} color="#d97706" title="Misconceptions" desc="The specific wrong mental models the AI caught. Click 'Mark as addressed ✓' once you've covered it in class — moves it to a green resolved state." />
          <DnaRow icon={<Sparkles size={16} />} color="#fbbf24" title="Aha Moments" desc="Verbatim quotes from when the student crossed from confusion to understanding. Great for parent-teacher conferences." />
          <DnaRow icon={<TrendingUp size={16} />} color="#10b981" title="Growth Signals" desc="Specific observations of progress — fewer hints needed, deeper questions, cross-subject transfer." />
          <DnaRow icon={<StickyNote size={16} />} color="#d97706" title="Private Notes" desc="Your own notes on each student — invisible to other teachers and to the student. Use them for pull-aside reminders, parent emails, IEP context." />
        </div>
      </Card>

      {/* Concept mastery scale */}
      <Card>
        <SectionTitle icon="🎯" title="The mastery scale, explained" />
        <p className="text-sm leading-relaxed mb-4" style={{ color: "#475569" }}>
          Claude assigns each concept one of four levels based on transcript evidence:
        </p>
        <div className="flex flex-col gap-2">
          <MasteryBadge level="Exposed" color="#64748b" bg="#f1f5f9" desc="Student encountered the concept but didn't show understanding." />
          <MasteryBadge level="Scaffolded" color="#b45309" bg="#fef3c7" desc="Student followed AI hints to arrive at the idea, with significant prompting." />
          <MasteryBadge level="Demonstrated" color="#1d4ed8" bg="#dbeafe" desc="Student articulated the concept clearly in their own words at least once." />
          <MasteryBadge level="Mastered" color="#15803d" bg="#dcfce7" desc="Student applied the concept to a new situation — true transfer. The gold standard." />
        </div>
      </Card>

      {/* Teacher tools */}
      <Card>
        <SectionTitle icon="🛠️" title="Tools at your disposal" />
        <div className="grid md:grid-cols-2 gap-4">
          <Feature icon={<StickyNote size={16} />} title="Private notes" desc="Per-student, per-teacher. Saves automatically." />
          <Feature icon={<CheckCircle2 size={16} />} title="Mark misconceptions" desc="One click moves a misconception from 'open' to 'addressed' (green)." />
          <Feature icon={<Download size={16} />} title="Export CSV" desc="One click downloads your full roster with all stats. Drop it in your grade book." />
          <Feature icon="🔍" title="Search & sort" desc="Sort the roster by activity, growth, name, or open misconceptions." />
          <Feature icon={<Eye size={16} />} title="See aha moments" desc="Verbatim quotes of student breakthroughs. Powerful for conferences." />
          <Feature icon="⚠" title="Subject mismatch flags" desc="The AI flags when a student tags a session to your class but the conversation is clearly a different subject." />
        </div>
      </Card>

      {/* Privacy */}
      <Card highlight>
        <SectionTitle icon={<Shield size={18} />} title="Privacy & what students see" />
        <p className="text-sm leading-relaxed mb-3" style={{ color: "#475569" }}>
          You should know what students <strong>can</strong> and <strong>cannot</strong> hide from you:
        </p>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <Eye size={14} style={{ color: "#16a34a", marginTop: 2, flexShrink: 0 }} />
            <div className="text-xs" style={{ color: "#166534" }}>
              <strong>You see:</strong> Sessions where the student explicitly picked your class as the context.
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <EyeOff size={14} style={{ color: "#dc2626", marginTop: 2, flexShrink: 0 }} />
            <div className="text-xs" style={{ color: "#991b1b" }}>
              <strong>You never see:</strong> Sessions tagged to a different class. A student in both Biology and Pre-Calc who&apos;s studying Pre-Calc won&apos;t pollute the Biology dashboard — and vice versa. Each class&apos;s data stays scoped to that class&apos;s teachers.
            </div>
          </div>
        </div>
        <Callout color="blue" icon={<Shield size={14} />}>
          For parents and admins: this is <strong>FERPA-friendly</strong>. Students opt-in per session to share with you; nothing is shared by default.
        </Callout>
      </Card>

      {/* FAQ */}
      <Card>
        <SectionTitle icon="❓" title="FAQ" />
        <div className="flex flex-col gap-3">
          <Faq q="Can I see what a student asked, word-for-word?" a="You see Claude's analysis: the concepts, the mastery level with one-sentence evidence, the misconception (if any), and the aha moment as a verbatim quote. Full transcripts are not exposed by design — for student privacy and to keep your dashboard focused on what matters." />
          <Faq q="What if students just type 'give me the answer'?" a="The AI tutor will Socratically redirect them. The analyzer also flags sessions with no academic engagement as invalid — they're discarded and never enter the DNA." />
          <Faq q="Can co-teachers see my private notes?" a="No. Notes are scoped to (teacher, student) — each teacher has their own private notes." />
          <Faq q="What happens when the semester ends?" a="Currently classes persist. We're adding archival next so you can keep historical data without it cluttering your current view." />
        </div>
      </Card>

    </div>
  );
}

// ═══ Shared UI ════════════════════════════════════════════════════
function Card({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="rounded-2xl p-7"
      style={{
        background: "#fff",
        border: `1.5px solid ${highlight ? "#bfdbfe" : "#e2e8f0"}`,
        boxShadow: highlight ? "0 4px 20px rgba(37,99,235,0.08)" : "0 1px 6px rgba(0,0,0,0.04)",
      }}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="text-xl">{icon}</span>
      <h2 className="font-extrabold text-xl" style={{ color: "#0f172a" }}>{title}</h2>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold text-white flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
        {n}
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm mb-0.5" style={{ color: "#0f172a" }}>{title}</div>
        <div className="text-sm leading-relaxed" style={{ color: "#475569" }}>{children}</div>
      </div>
    </div>
  );
}

function Callout({ color, icon, children }: { color: "blue" | "amber" | "green"; icon: React.ReactNode; children: React.ReactNode }) {
  const palette = {
    blue:  { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
    amber: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
    green: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  }[color];
  return (
    <div className="rounded-xl p-3 mt-4 flex items-start gap-2"
      style={{ background: palette.bg, border: `1px solid ${palette.border}` }}>
      <div style={{ color: palette.text, marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div className="text-xs leading-relaxed" style={{ color: palette.text }}>{children}</div>
    </div>
  );
}

function ModeRow({ icon, color, title, subtitle }: { icon: React.ReactNode; color: string; title: string; subtitle: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
        style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm" style={{ color: "#0f172a" }}>{title}</div>
        <div className="text-xs mt-0.5" style={{ color: "#64748b" }}>{subtitle}</div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc, free }: { icon: React.ReactNode; title: string; desc: string; free?: boolean }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
      <div className="flex items-center gap-2 mb-1.5">
        <div style={{ color: "#2563eb" }}>{icon}</div>
        <span className="font-bold text-sm" style={{ color: "#0f172a" }}>{title}</span>
        {free && <span className="text-xs px-1.5 py-0.5 rounded-full font-bold" style={{ background: "#dcfce7", color: "#15803d" }}>Free</span>}
      </div>
      <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{desc}</p>
    </div>
  );
}

function DnaRow({ icon, color, title, desc }: { icon: React.ReactNode; color: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm mb-0.5" style={{ color: "#0f172a" }}>{title}</div>
        <div className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{desc}</div>
      </div>
    </div>
  );
}

function MasteryBadge({ level, color, bg, desc }: { level: string; color: string; bg: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#fff", border: "1px solid #f1f5f9" }}>
      <span className="text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0"
        style={{ background: bg, color }}>{level}</span>
      <span className="text-xs" style={{ color: "#475569" }}>{desc}</span>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(o => !o)}
      className="w-full text-left p-4 rounded-xl transition-colors"
      style={{ background: open ? "#eff6ff" : "#f8fafc", border: `1px solid ${open ? "#bfdbfe" : "#e2e8f0"}` }}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm" style={{ color: "#0f172a" }}>{q}</span>
        <ChevronRight size={14} style={{ color: "#94a3b8", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
      </div>
      {open && (
        <p className="text-xs mt-2 leading-relaxed" style={{ color: "#475569" }}>{a}</p>
      )}
    </button>
  );
}

// silence unused-warning helpers
