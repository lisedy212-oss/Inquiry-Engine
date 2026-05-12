"use client";

import { useEffect, useState } from "react";
import {
  Sparkles, MessageSquare, Paperclip, GraduationCap, BarChart3,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";

const KEY = "ie-onboarded-v1";

interface Step {
  icon: React.ReactNode;
  emoji: string;
  title: string;
  description: string;
  accent: string;
  bullets?: string[];
}

const STEPS: Step[] = [
  {
    icon: <Sparkles size={26} />,
    emoji: "👋",
    title: "Welcome to the Inquiry Engine",
    description: "An AI study partner that guides you to answers — instead of just handing them over. Real learning, faster.",
    accent: "#2563eb",
    bullets: [
      "Built for any subject",
      "Powered by Claude (Anthropic)",
      "Your progress is private to you and your teacher",
    ],
  },
  {
    icon: <MessageSquare size={26} />,
    emoji: "💬",
    title: "Just ask",
    description: "Type any question — homework, a confusing concept, an essay you're stuck on. The AI will ask the right next question to guide you.",
    accent: "#10b981",
    bullets: [
      "Be specific — \"why does the chain rule work?\" beats \"help with math\"",
      "Three AI modes: Default, Fast, and Thinking (for hard problems)",
      "Free plan: 5 questions/day. Paid plans: unlimited.",
    ],
  },
  {
    icon: <Paperclip size={26} />,
    emoji: "📎",
    title: "Bring your homework with you",
    description: "Tap the + button next to the chat to attach things. The AI can read PDFs, photos of worksheets, and more.",
    accent: "#f59e0b",
    bullets: [
      "Upload a PDF — textbook chapter, worksheet, notes",
      "Upload a photo — homework from your library",
      "Pro: take a photo with your camera, attach files, paste URLs",
    ],
  },
  {
    icon: <GraduationCap size={26} />,
    emoji: "🎓",
    title: "Pick your class",
    description: "If your teacher added you to a class, you'll choose which class you're studying for at the start of each chat session.",
    accent: "#a855f7",
    bullets: [
      "Switch classes anytime via the pill above the search bar",
      "If your teacher uploaded an assignment, you can focus the AI on it",
      "Your work counts toward your teacher's class dashboard",
    ],
  },
  {
    icon: <BarChart3 size={26} />,
    emoji: "📊",
    title: "Watch yourself grow",
    description: "Every session, the AI tracks what you've actually learned — your Learning DNA. Open the menu (☰) any time to see it.",
    accent: "#ec4899",
    bullets: [
      "Concepts you've mastered",
      "Misconceptions caught and addressed",
      "Aha moments captured word-for-word",
    ],
  },
];

interface Props {
  /** If true, allow this user to see the tour. We further gate on localStorage. */
  enabled?: boolean;
}

export default function OnboardingTour({ enabled = true }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;
    try {
      const seen = localStorage.getItem(KEY);
      if (!seen) setOpen(true);
    } catch { /* ignore */ }
  }, [enabled]);

  function dismiss() {
    try { localStorage.setItem(KEY, "1"); } catch { /* */ }
    setOpen(false);
  }

  if (!open) return null;
  const s = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}>
      <div className="rounded-3xl max-w-md w-full overflow-hidden"
        style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

        {/* Progress dots + skip */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className="rounded-full transition-all"
                style={{
                  width: i === step ? 18 : 6, height: 6,
                  background: i === step ? s.accent : (i < step ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"),
                }} />
            ))}
          </div>
          <button onClick={dismiss} className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg"
            style={{ color: "#9ca3af" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}>
            Skip <X size={12} />
          </button>
        </div>

        {/* Step content */}
        <div className="px-7 py-6">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="text-5xl mb-3">{s.emoji}</div>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: `${s.accent}22`, color: s.accent, boxShadow: `0 4px 20px ${s.accent}33` }}>
              {s.icon}
            </div>
            <h2 className="text-xl font-extrabold mb-2" style={{ color: "#fff" }}>{s.title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>{s.description}</p>
          </div>

          {s.bullets && (
            <ul className="flex flex-col gap-2 mb-5">
              {s.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: "#d1d5db" }}>
                  <span style={{ color: s.accent, flexShrink: 0, marginTop: 2 }}>▸</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3 px-5 pb-5">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={isFirst}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-xl transition-all"
            style={{
              color: isFirst ? "#525252" : "#d1d5db",
              cursor: isFirst ? "not-allowed" : "pointer",
              background: isFirst ? "transparent" : "rgba(255,255,255,0.05)",
            }}>
            <ChevronLeft size={14} /> Back
          </button>

          <span className="text-xs" style={{ color: "#6b7280" }}>{step + 1} / {STEPS.length}</span>

          {isLast ? (
            <button onClick={dismiss}
              className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white"
              style={{ background: `linear-gradient(135deg,${s.accent},${darken(s.accent)})`, boxShadow: `0 4px 16px ${s.accent}55` }}>
              Let&apos;s go <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              className="flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white"
              style={{ background: `linear-gradient(135deg,${s.accent},${darken(s.accent)})`, boxShadow: `0 4px 16px ${s.accent}55` }}>
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick & dirty hex darken — drops 20% luminance.
function darken(hex: string): string {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const r = Math.max(0, ((num >> 16) & 0xff) - 50);
  const g = Math.max(0, ((num >> 8) & 0xff) - 50);
  const b = Math.max(0, (num & 0xff) - 50);
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}
