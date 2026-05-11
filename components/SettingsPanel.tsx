"use client";

import { useEffect } from "react";
import { X, Brain, GraduationCap, Lightbulb, AlignLeft } from "lucide-react";
import type { AISettings } from "@/types";

interface Props {
  open: boolean;
  settings: AISettings;
  onChange: (s: AISettings) => void;
  onClose: () => void;
}

type OptionGroup<K extends keyof AISettings> = {
  key: K;
  label: string;
  icon: React.ElementType;
  description: string;
  options: { value: AISettings[K]; label: string; desc: string }[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GROUPS: OptionGroup<any>[] = [
  {
    key: "subject",
    label: "Subject Focus",
    icon: Brain,
    description: "Tailors Socratic strategies to your subject area.",
    options: [
      { value: "general",    label: "General",    desc: "Works for any topic" },
      { value: "math",       label: "Math",        desc: "Variables, formulas, proofs" },
      { value: "science",    label: "Science",     desc: "Experiments, hypotheses" },
      { value: "humanities", label: "Humanities",  desc: "Essays, history, analysis" },
      { value: "languages",  label: "Languages",   desc: "Grammar, translation, writing" },
      { value: "coding",     label: "Coding",      desc: "Debugging, algorithms, logic" },
    ],
  },
  {
    key: "level",
    label: "Academic Level",
    icon: GraduationCap,
    description: "Adjusts complexity and vocabulary to your level.",
    options: [
      { value: "elementary",   label: "Elementary",   desc: "Ages 6–11" },
      { value: "middle",       label: "Middle School", desc: "Ages 11–14" },
      { value: "high",         label: "High School",   desc: "Ages 14–18" },
      { value: "university",   label: "University",    desc: "Undergraduate+" },
      { value: "professional", label: "Professional",  desc: "Expert / grad level" },
    ],
  },
  {
    key: "hintDepth",
    label: "Hint Depth",
    icon: Lightbulb,
    description: "Controls how many hints you get before being redirected to think.",
    options: [
      { value: "gentle",   label: "Gentle",   desc: "More hints & scaffolding" },
      { value: "balanced", label: "Balanced", desc: "Standard Socratic method" },
      { value: "strict",   label: "Strict",   desc: "One question at a time, minimal hints" },
    ],
  },
  {
    key: "responseStyle",
    label: "Response Length",
    icon: AlignLeft,
    description: "How much the AI writes per response.",
    options: [
      { value: "concise",  label: "Concise",  desc: "Short, focused nudges" },
      { value: "balanced", label: "Balanced", desc: "Standard length" },
      { value: "detailed", label: "Detailed", desc: "Thorough context and explanation" },
    ],
  },
];

function Pill<K extends keyof AISettings>({
  option, selected, onSelect,
}: {
  option: { value: AISettings[K]; label: string; desc: string };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-start gap-0.5 rounded-xl px-3 py-2.5 text-left transition-all w-full"
      style={{
        background: selected ? "var(--pill-active-bg)" : "var(--pill-inactive-bg)",
        border: selected ? "1.5px solid var(--pill-active-border)" : "1.5px solid var(--pill-inactive-border)",
        boxShadow: selected ? "0 2px 8px rgba(37,99,235,0.15)" : "none",
      }}
    >
      <span className="text-sm font-medium" style={{ color: selected ? "var(--pill-active-text)" : "var(--text-muted)" }}>
        {option.label}
      </span>
      <span className="text-xs" style={{ color: selected ? "var(--primary)" : "var(--text-faint)" }}>
        {option.desc}
      </span>
    </button>
  );
}

export default function SettingsPanel({ open, settings, onChange, onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-30 transition-opacity duration-300"
        style={{
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      {/* Drawer */}
      <div
        className="fixed right-0 top-0 bottom-0 z-40 flex flex-col overflow-y-auto"
        style={{
          width: 380,
          background: "var(--settings-bg)",
          borderLeft: "1px solid var(--settings-border)",
          boxShadow: "-8px 0 48px rgba(0,0,0,0.35)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: "var(--settings-border)" }}>
          <div>
            <h2 className="font-bold" style={{ color: "var(--settings-text)" }}>AI Settings</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--settings-sub)" }}>
              Customize how the Inquiry Engine guides you
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 transition-colors"
            style={{ color: "var(--settings-sub)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--settings-text)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--settings-sub)")}>
            <X size={18} />
          </button>
        </div>

        {/* Groups */}
        <div className="flex flex-col gap-6 p-5">
          {GROUPS.map((group) => (
            <div key={group.key}>
              <div className="flex items-center gap-2 mb-1">
                <group.icon size={14} style={{ color: "#60a5fa" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--settings-text)" }}>{group.label}</span>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--settings-sub)" }}>{group.description}</p>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map((opt) => (
                  <Pill
                    key={String(opt.value)}
                    option={opt}
                    selected={settings[group.key as keyof AISettings] === opt.value}
                    onSelect={() => onChange({ ...settings, [group.key]: opt.value })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto px-5 py-4 border-t" style={{ borderColor: "var(--settings-border)" }}>
          <p className="text-xs text-center" style={{ color: "var(--settings-sub)" }}>
            Settings apply to new messages in this session.
          </p>
        </div>
      </div>
    </>
  );
}
