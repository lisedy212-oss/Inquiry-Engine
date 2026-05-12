"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SignUpButton, useUser } from "@clerk/nextjs";
import { ArrowRight, Check, Lock, Zap, BookOpen, FileSearch, Map, Brain, AlertTriangle, TrendingUp, Sparkles } from "lucide-react";
import NavMenu from "./NavMenu";

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const FEATURES = [
  { icon: Zap, emoji: "⚡", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a",
    title: "Never Gets Stuck", desc: "Ask any question from any subject. The Inquiry Engine always finds a Socratic path forward — no topic is off limits." },
  { icon: FileSearch, emoji: "🔍", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",
    title: "PDF Page Citations", desc: "Upload a textbook. The AI directs you to the exact page and paragraph — never just summarizes it for you." },
  { icon: Map, emoji: "🗺️", color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd",
    title: "Study Roadmap", desc: "Paste 10 homework questions. Get a numbered roadmap with one conceptual hint per question — never the answers." },
  { icon: BookOpen, emoji: "📚", color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0",
    title: "Any Subject", desc: "Math, science, history, coding, languages — the Socratic method works everywhere and the AI knows how to apply it." },
];

const SUBJECT_QUESTIONS = [
  {
    subject: "Mathematics", emoji: "📐", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe",
    questions: [
      "Why does the order of operations matter?",
      "How do I know which trig identity to use?",
      "What's actually happening when I integrate?",
      "How do I approach a word problem I've never seen before?",
    ],
  },
  {
    subject: "Science", emoji: "⚗️", color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0",
    questions: [
      "What's the difference between speed and velocity?",
      "Why is entropy always increasing?",
      "How do I balance a chemical equation?",
      "What does a hypothesis actually have to do with an experiment?",
    ],
  },
  {
    subject: "History & Humanities", emoji: "🏛️", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a",
    questions: [
      "Why did World War I really start?",
      "How do I write a strong thesis statement?",
      "What makes a primary source different from secondary?",
      "How do I analyze an author's argument?",
    ],
  },
  {
    subject: "Coding", emoji: "💻", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe",
    questions: [
      "Why does my for loop run forever?",
      "When should I use a list vs. a dictionary?",
      "What does 'undefined is not a function' actually mean?",
      "How do I think about time complexity?",
    ],
  },
  {
    subject: "Languages", emoji: "🗣️", color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8",
    questions: [
      "What's the difference between ser and estar?",
      "How do I know when to use the subjunctive?",
      "Why does word order change in German?",
      "How do I get better at reading comprehension?",
    ],
  },
  {
    subject: "Literature", emoji: "📖", color: "#f97316", bg: "#fff7ed", border: "#fed7aa",
    questions: [
      "How do I find the theme of a novel?",
      "What is the author's tone and how do I identify it?",
      "How do I write a literary analysis paragraph?",
      "What does symbolism actually mean in this context?",
    ],
  },
];

const PLANS = [
  { id: "free", name: "Free", price: "$0", period: "/month",
    features: ["5 questions per day", "PDF uploads", "Photo uploads", "Socratic guidance"],
    locked: ["Unlimited questions", "Learning DNA tracking", "File uploads", "Link references"], highlight: false, cta: "Get Started" },
  { id: "individual", name: "Individual", price: "$15", period: "/month",
    features: ["Unlimited questions", "Personal Learning DNA", "Camera, files & link uploads", "All AI models (Thinking)", "Priority responses", "Custom AI tutor settings"],
    locked: [], highlight: true, cta: "Start Learning" },
  { id: "classes", name: "Classes", price: "$100", period: "/month",
    features: ["Everything in Individual", "Class Learning DNA Dashboard", "Up to 35 students", "Misconception alerts", "Per-student growth tracking", "Assignment-aware tutoring"],
    locked: [], highlight: false, cta: "For Educators" },
  { id: "schools", name: "Schools", price: "$1,500", period: "/month",
    features: ["Everything in Classes", "Unlimited students & teachers", "School-wide DNA Analytics", "Admin dashboard", "LMS integration (Canvas, Google)", "Custom branding", "Dedicated support & SLA"],
    locked: [], highlight: false, cta: "Contact Sales" },
];

const WORDS = ["think.", "discover.", "understand.", "succeed."];

export default function LandingPage() {
  const { isSignedIn } = useUser();
  const features = useInView();
  const examples = useInView();
  const pricing = useInView();

  const [wordIdx, setWordIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setFade(false);
      setTimeout(() => { setWordIdx(i => (i + 1) % WORDS.length); setFade(true); }, 280);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "#f0f7ff" }}>

      {/* ── Nav ── */}
      <nav style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(37,99,235,0.1)", position: "sticky", top: 0, zIndex: 50 }}>
        <div className="flex items-center justify-between px-4 md:px-8 py-4 max-w-7xl mx-auto gap-2">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl text-xl"
              style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 4px 12px rgba(37,99,235,0.35)" }}>
              🔍
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight" style={{ color: "#0f172a" }}>Inquiry Engine</span>
              <span className="hidden md:inline ml-2 text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                Powered by Claude
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {isSignedIn ? (
              <Link href="/chat" className="flex items-center gap-1.5 rounded-xl px-3 sm:px-5 py-2 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 4px 16px rgba(37,99,235,0.35)" }}>
                <span className="hidden sm:inline">Open Chat</span><span className="sm:hidden">Chat</span> <ArrowRight size={14} />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button className="flex items-center gap-1.5 rounded-xl px-3 sm:px-5 py-2 text-sm font-bold text-white transition-all"
                  style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                  <span className="hidden sm:inline">Get Started Free</span><span className="sm:hidden">Sign Up</span>
                  <ArrowRight size={14} />
                </button>
              </SignUpButton>
            )}
            <NavMenu />
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Background blobs */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          <div className="landing-orb" style={{ width: 700, height: 700, top: -200, left: -150, background: "rgba(147,197,253,0.18)", animationDuration: "16s" }} />
          <div className="landing-orb" style={{ width: 500, height: 500, top: -100, right: -100, background: "rgba(29,78,216,0.12)", animationDuration: "20s", animationDelay: "-8s" }} />
          <div className="landing-orb" style={{ width: 350, height: 350, bottom: -50, left: "40%", background: "rgba(251,191,36,0.1)", animationDuration: "14s", animationDelay: "-4s" }} />
        </div>

        {/* Floating school emojis */}
        {[
          { e: "📚", top: "12%", left: "5%",  size: "2.5rem", delay: "0s",   dur: "6s"  },
          { e: "✏️", top: "25%", right: "6%", size: "2rem",   delay: "1s",   dur: "7s"  },
          { e: "🎓", top: "60%", left: "3%",  size: "2.2rem", delay: "2s",   dur: "8s"  },
          { e: "🧮", top: "70%", right: "4%", size: "1.8rem", delay: "0.5s", dur: "9s"  },
          { e: "🔬", top: "40%", left: "7%",  size: "1.6rem", delay: "1.5s", dur: "7.5s"},
          { e: "📝", top: "15%", right: "12%",size: "1.5rem", delay: "2.5s", dur: "6.5s"},
        ].map((item, i) => (
          <div key={i} style={{
            position: "absolute", top: item.top, left: "left" in item ? item.left : undefined,
            right: "right" in item ? item.right : undefined,
            fontSize: item.size, opacity: 0.35, pointerEvents: "none",
            animation: `icon-float ${item.dur} ${item.delay} ease-in-out infinite alternate`,
          }}>
            {item.e}
          </div>
        ))}

        <div className="relative z-10 flex flex-col items-center text-center px-4 md:px-6 pt-16 md:pt-24 pb-20 md:pb-32 max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold mb-8 animate-fade-in"
            style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#2563eb", boxShadow: "0 2px 8px rgba(37,99,235,0.12)" }}>
            ✨ Your smartest study buddy — powered by Claude AI
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s", color: "#0f172a" }}>
            Learn to{" "}
            <span style={{
              background: "linear-gradient(135deg, #2563eb, #1d4ed8, #0ea5e9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
              transition: "opacity 0.28s ease",
              opacity: fade ? 1 : 0,
            }}>
              {WORDS[wordIdx]}
            </span>
          </h1>

          <p className="text-lg max-w-xl leading-relaxed mb-10 animate-fade-in" style={{ color: "#6b7280", animationDelay: "0.2s" }}>
            The AI study partner that <strong style={{ color: "#0f172a" }}>teaches you how to think.</strong>{" "}
            It asks the perfect questions to guide you to your own answers — building real understanding that sticks.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            {isSignedIn ? (
              <Link href="/chat" className="flex items-center gap-2 rounded-2xl px-8 py-3.5 text-base font-bold text-white"
                style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 6px 28px rgba(37,99,235,0.4)" }}>
                Open Chat <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <button className="flex items-center gap-2 rounded-2xl px-8 py-3.5 text-base font-bold text-white transition-all"
                    style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 6px 28px rgba(37,99,235,0.4)" }}
                    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 36px rgba(37,99,235,0.6)")}
                    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 6px 28px rgba(37,99,235,0.4)")}>
                    Start Free — No Credit Card <ArrowRight size={16} />
                  </button>
                </SignUpButton>
                <a href="#examples" className="text-sm font-medium transition-colors" style={{ color: "#9ca3af" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#2563eb")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
                  See example questions ↓
                </a>
              </>
            )}
          </div>

          {/* Social proof strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            {["📐 Math", "⚗️ Science", "📖 History", "💻 Coding", "🗣️ Languages", "✍️ Writing"].map(s => (
              <span key={s} className="text-sm font-medium" style={{ color: "#9ca3af" }}>{s}</span>
            ))}
          </div>

          {/* Mock chat */}
          <div className="mt-16 w-full max-w-2xl animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="rounded-3xl overflow-hidden" style={{ background: "#fff", border: "1px solid #dbeafe", boxShadow: "0 20px 60px rgba(37,99,235,0.12), 0 4px 16px rgba(0,0,0,0.05)" }}>
              {/* Titlebar */}
              <div className="flex items-center gap-2 px-5 py-3" style={{ background: "#eff6ff", borderBottom: "1px solid #dbeafe" }}>
                <div className="w-3 h-3 rounded-full" style={{ background: "#fca5a5" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#fde68a" }} />
                <div className="w-3 h-3 rounded-full" style={{ background: "#bbf7d0" }} />
                <span className="ml-3 text-xs font-medium" style={{ color: "#9ca3af" }}>inquiry-engine.app/chat</span>
              </div>
              {/* Chat */}
              <div className="p-6 space-y-4 text-sm text-left">
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-sm px-4 py-3 max-w-[78%]"
                    style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff" }}>
                    I need the answer to question 7. My test is in 2 hours.
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm px-4 py-3 max-w-[82%]"
                    style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#374151" }}>
                    I know the pressure is on — let&apos;s make these 2 hours count! 🎯<br /><br />
                    Tell me: what does the question ask you to <em>find</em>, and what information does it give you? Starting there will unlock everything.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-sm px-4 py-3 max-w-[78%]"
                    style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff" }}>
                    It gives me the initial velocity and time, and asks for displacement.
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-sm px-4 py-3 max-w-[82%]"
                    style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#374151" }}>
                    Perfect — you&apos;ve already done the hardest part. Which kinematic equation connects <strong>displacement</strong>, <strong>initial velocity</strong>, and <strong>time</strong>? 🔍
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Teacher Setup — 30 seconds ── */}
      <section className="py-20 px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold mb-4"
              style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a" }}>
              ⚡ For Teachers
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: "#0f172a" }}>
              Set up your whole class in <span style={{ color: "#2563eb" }}>30 seconds</span>
            </h2>
            <p className="text-base max-w-xl mx-auto" style={{ color: "#475569" }}>
              No training, no IT ticket, no integration meeting. Three clicks and you&apos;re tracking every student.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-8">
            {[
              { n: 1, emoji: "🏫", title: "Create your class", desc: "Click \"Create New Class\", give it a name like \"Period 3 Biology\". Done — you have a private class code." },
              { n: 2, emoji: "🔑", title: "Share one code", desc: "Write it on the board. Students enter it once and they're in. No emails, no rosters to import." },
              { n: 3, emoji: "📊", title: "Track every student", desc: "Click any student to see their concept mastery, misconceptions to address, and growth over time — analyzed by Claude." },
            ].map(step => (
              <div key={step.n} className="rounded-2xl p-6" style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-extrabold text-white"
                    style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
                    {step.n}
                  </div>
                  <span className="text-2xl">{step.emoji}</span>
                </div>
                <h3 className="font-bold text-base mb-1.5" style={{ color: "#0f172a" }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{step.desc}</p>
              </div>
            ))}
          </div>

          {/* Visual: mock class code */}
          <div className="rounded-2xl p-8 flex flex-wrap items-center justify-between gap-6"
            style={{ background: "linear-gradient(135deg,#eff6ff,#e0e7ff)", border: "1.5px solid #bfdbfe" }}>
            <div className="flex-1 min-w-[260px]">
              <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#1d4ed8" }}>What students see</div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#1e293b" }}>
                Students simply enter the code you give them. Their data stays private — they can only see <strong>their own</strong> Learning DNA. Only you, the teacher, see the full class view.
              </p>
              <div className="flex items-center gap-2 text-xs" style={{ color: "#475569" }}>
                <Check size={12} style={{ color: "#10b981" }} /> Privacy enforced per student
                <span style={{ color: "#cbd5e1" }}>·</span>
                <Check size={12} style={{ color: "#10b981" }} /> No PII required
                <span style={{ color: "#cbd5e1" }}>·</span>
                <Check size={12} style={{ color: "#10b981" }} /> FERPA-friendly
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-2xl px-6 py-4"
              style={{ background: "#fff", border: "1.5px dashed #bfdbfe", boxShadow: "0 4px 16px rgba(37,99,235,0.12)" }}>
              <span className="text-2xl font-mono font-extrabold tracking-widest" style={{ color: "#1d4ed8" }}>INQ-A8X2</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Learning DNA — the moat ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #f0f7ff 0%, #fff 60%)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold mb-4"
              style={{ background: "linear-gradient(135deg,#dbeafe,#e0e7ff)", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
              <Sparkles size={12} /> Exclusive to Inquiry Engine
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: "#0f172a" }}>
              Meet <span style={{ background: "linear-gradient(135deg,#2563eb,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Learning DNA™</span>
            </h2>
            <p className="text-base max-w-2xl mx-auto" style={{ color: "#475569" }}>
              Other AI tutors track <em>that</em> a student studied. We track <strong style={{ color: "#0f172a" }}>whether they actually understood.</strong> After every conversation, Claude analyzes the transcript and extracts what your student really learned.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5 mb-10">
            {[
              { icon: Brain, color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe",
                title: "Concept Mastery Tracking",
                desc: "See exactly which concepts each student has been exposed to, scaffolded through, demonstrated, or fully transferred to new problems." },
              { icon: AlertTriangle, color: "#f59e0b", bg: "#fffbeb", border: "#fde68a",
                title: "Misconception Alerts",
                desc: "Claude catches the specific wrong mental model a student revealed — \"thinks velocity is the same as acceleration\" — so teachers know what to address in class tomorrow." },
              { icon: TrendingUp, color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0",
                title: "Growth Over Time",
                desc: "Hint count trending down. Questions getting deeper. Engagement rising. Real, measurable learning progress — not just engagement metrics." },
              { icon: Sparkles, color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe",
                title: "Aha Moment Detection",
                desc: "Every breakthrough is captured verbatim. Teachers see the exact moment a student crossed from confusion to understanding." },
            ].map(card => (
              <div key={card.title} className="rounded-2xl p-6" style={{ background: card.bg, border: `1.5px solid ${card.border}` }}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <card.icon size={20} style={{ color: card.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base mb-1.5" style={{ color: "#0f172a" }}>{card.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "#475569" }}>{card.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4"
            style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)", color: "#fff" }}>
            <div className="flex-1 min-w-[280px]">
              <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#93c5fd" }}>For Teachers & Schools</div>
              <h3 className="font-bold text-lg mb-1">The teacher dashboard renews itself.</h3>
              <p className="text-sm" style={{ color: "#cbd5e1" }}>
                Show parents real understanding. Show admins real progress. Show your district real ROI.
              </p>
            </div>
            <Link href="/sign-up" className="rounded-xl px-5 py-2.5 text-sm font-bold flex items-center gap-2"
              style={{ background: "#fff", color: "#0f172a", textDecoration: "none" }}>
              See it in action <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section ref={features.ref} className="py-16 md:py-24 px-4 md:px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto" style={{ transition: "opacity 0.7s, transform 0.7s", opacity: features.inView ? 1 : 0, transform: features.inView ? "none" : "translateY(32px)" }}>
          <div className="text-center mb-14">
            <div className="inline-block text-4xl mb-3">🎓</div>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: "#0f172a" }}>Built for real learning</h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: "#9ca3af" }}>
              Not just an AI that talks — an AI that teaches. There&apos;s a big difference.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="rounded-2xl p-6" style={{
                background: f.bg, border: `1.5px solid ${f.border}`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                transition: `opacity 0.5s ease ${i*0.1}s, transform 0.5s ease ${i*0.1}s`,
                opacity: features.inView ? 1 : 0,
                transform: features.inView ? "none" : "translateY(20px)",
              }}>
                <div className="text-3xl mb-4">{f.emoji}</div>
                <h3 className="font-bold text-base mb-2" style={{ color: "#0f172a" }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#6b7280" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Claude Attribution ── */}
      <section className="py-14 px-6" style={{ background: "linear-gradient(135deg, #eff6ff, #eff6ff)" }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-3 rounded-2xl px-6 py-4"
            style={{ background: "#fff", border: "1.5px solid #bfdbfe", boxShadow: "0 4px 20px rgba(37,99,235,0.1)" }}>
            <span className="text-2xl">🤖</span>
            <div className="text-left">
              <div className="font-bold text-sm" style={{ color: "#0f172a" }}>Powered by Claude — Anthropic&apos;s AI</div>
              <div className="text-xs mt-0.5" style={{ color: "#9ca3af" }}>
                The Inquiry Engine runs on Claude, one of the world&apos;s most capable and safest AI models, built by Anthropic.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Example Questions ── */}
      <section id="examples" ref={examples.ref} className="py-16 md:py-24 px-4 md:px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto" style={{ transition: "opacity 0.7s, transform 0.7s", opacity: examples.inView ? 1 : 0, transform: examples.inView ? "none" : "translateY(32px)" }}>
          <div className="text-center mb-14">
            <div className="inline-block text-4xl mb-3">💡</div>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: "#0f172a" }}>What can you ask?</h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: "#9ca3af" }}>
              Anything! But here are some ideas to get you started. The Inquiry Engine works across every subject.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SUBJECT_QUESTIONS.map((subj, i) => (
              <div key={subj.subject} className="rounded-2xl p-5" style={{
                background: subj.bg,
                border: `1.5px solid ${subj.border}`,
                boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                transition: `opacity 0.5s ease ${i*0.08}s, transform 0.5s ease ${i*0.08}s`,
                opacity: examples.inView ? 1 : 0,
                transform: examples.inView ? "none" : "translateY(20px)",
              }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{subj.emoji}</span>
                  <span className="font-bold text-sm" style={{ color: subj.color }}>{subj.subject}</span>
                </div>
                <ul className="space-y-2.5">
                  {subj.questions.map(q => (
                    <li key={q} className="flex items-start gap-2 text-sm" style={{ color: "#374151" }}>
                      <span style={{ color: subj.color, flexShrink: 0, marginTop: 2 }}>›</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            {isSignedIn ? (
              <Link href="/chat" className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 6px 24px rgba(37,99,235,0.35)" }}>
                Try it now <ArrowRight size={15} />
              </Link>
            ) : (
              <SignUpButton mode="modal">
                <button className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 6px 24px rgba(37,99,235,0.35)" }}>
                  Try any of these questions free <ArrowRight size={15} />
                </button>
              </SignUpButton>
            )}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" ref={pricing.ref} className="py-16 md:py-24 px-4 md:px-6" style={{ background: "#f0f7ff" }}>
        <div className="max-w-6xl mx-auto" style={{ transition: "opacity 0.7s, transform 0.7s", opacity: pricing.inView ? 1 : 0, transform: pricing.inView ? "none" : "translateY(32px)" }}>
          <div className="text-center mb-14">
            <div className="inline-block text-4xl mb-3">💳</div>
            <h2 className="text-3xl font-extrabold mb-3" style={{ color: "#0f172a" }}>Simple pricing</h2>
            <p className="text-base" style={{ color: "#6b7280" }}>Start free. Upgrade when you&apos;re ready.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-5">
            {PLANS.map((plan, i) => (
              <div key={plan.id} className="rounded-2xl p-6 flex flex-col" style={{
                background: plan.highlight ? "linear-gradient(145deg,#2563eb,#1d4ed8)" : "#fff",
                border: plan.highlight ? "none" : "1.5px solid #dbeafe",
                boxShadow: plan.highlight ? "0 12px 40px rgba(37,99,235,0.35)" : "0 2px 12px rgba(0,0,0,0.04)",
                transition: `opacity 0.5s ease ${i*0.1}s, transform 0.5s ease ${i*0.1}s`,
                opacity: pricing.inView ? 1 : 0,
                transform: pricing.inView ? "none" : "translateY(20px)",
              }}>
                {plan.highlight && (
                  <div className="text-xs font-bold rounded-full px-3 py-1 mb-3 w-fit"
                    style={{ background: "rgba(255,255,255,0.2)", color: "#fff" }}>
                    ⭐ Most Popular
                  </div>
                )}
                <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: plan.highlight ? "rgba(255,255,255,0.7)" : "#9ca3af" }}>{plan.name}</div>
                <div className="text-3xl font-extrabold mb-1" style={{ color: plan.highlight ? "#fff" : "#0f172a" }}>
                  {plan.price}<span className="text-sm font-normal" style={{ color: plan.highlight ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>{plan.period}</span>
                </div>
                <div className="my-4 border-t" style={{ borderColor: plan.highlight ? "rgba(255,255,255,0.15)" : "#dbeafe" }} />
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: plan.highlight ? "rgba(255,255,255,0.85)" : "#374151" }}>
                      <Check size={12} style={{ color: plan.highlight ? "#fff" : "#2563eb", flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                  {plan.locked.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs" style={{ color: plan.highlight ? "rgba(255,255,255,0.35)" : "#d1d5db" }}>
                      <Lock size={11} style={{ flexShrink: 0 }} /> {f}
                    </li>
                  ))}
                </ul>
                {isSignedIn ? (
                  <Link href="/pricing" className="block text-center rounded-xl py-2.5 text-sm font-bold transition-all"
                    style={{
                      background: plan.highlight ? "rgba(255,255,255,0.2)" : "#eff6ff",
                      color: plan.highlight ? "#fff" : "#2563eb",
                      border: plan.highlight ? "1px solid rgba(255,255,255,0.3)" : "1px solid #bfdbfe",
                    }}>
                    {plan.cta}
                  </Link>
                ) : (
                  <SignUpButton mode="modal">
                    <button className="w-full rounded-xl py-2.5 text-sm font-bold transition-all"
                      style={{
                        background: plan.highlight ? "rgba(255,255,255,0.2)" : "#eff6ff",
                        color: plan.highlight ? "#fff" : "#2563eb",
                        border: plan.highlight ? "1px solid rgba(255,255,255,0.3)" : "1px solid #bfdbfe",
                      }}>
                      {plan.cta}
                    </button>
                  </SignUpButton>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 text-center" style={{ background: "#fff", borderTop: "1px solid #dbeafe" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-xl">🔍</span>
          <span className="font-extrabold" style={{ color: "#0f172a" }}>Inquiry Engine</span>
        </div>
        <div className="flex items-center justify-center gap-4 mb-3 flex-wrap text-xs" style={{ color: "#64748b" }}>
          <Link href="/guide" style={{ color: "#64748b", textDecoration: "none" }}>Guide</Link>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <Link href="/privacy" style={{ color: "#64748b", textDecoration: "none" }}>Privacy</Link>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <Link href="/terms" style={{ color: "#64748b", textDecoration: "none" }}>Terms</Link>
          <span style={{ color: "#cbd5e1" }}>·</span>
          <a href="mailto:inquiryengine1@gmail.com" style={{ color: "#64748b", textDecoration: "none" }}>Contact</a>
        </div>
        <p className="text-xs mb-1" style={{ color: "#94a3b8" }}>AI responses powered by Claude · Anthropic</p>
        <p className="text-xs" style={{ color: "#94a3b8" }}>© 2026 Inquiry Engine · Built to make you think</p>
      </footer>
    </div>
  );
}
