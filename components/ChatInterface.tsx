"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, Settings2, Zap, GraduationCap, ChevronDown } from "lucide-react";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import ChatMessage from "./ChatMessage";
import AttachmentMenu, { type PendingAttachment } from "./AttachmentMenu";
import SettingsPanel from "./SettingsPanel";
import NavMenu from "./NavMenu";
import type { Message, ContentBlock, ImageMediaType, AISettings, AIModel } from "@/types";
import { DEFAULT_SETTINGS } from "@/types";
import { getTodayCount, incrementTodayCount, remainingQuestions, FREE_DAILY_LIMIT } from "@/lib/dailyLimit";
import { getClassesByStudent, type ClassRoom } from "@/lib/classStore";
import { getChatMode, setChatMode, type ChatMode } from "@/lib/activeClass";
import { getActiveAssignment, setActiveAssignment, type ActiveAssignment } from "@/lib/activeAssignment";

const SUGGESTED = [
  { emoji: "📐", text: "I have a math problem — where do I even start?" },
  { emoji: "📚", text: "Help me outline an essay on the causes of World War I." },
  { emoji: "⚗️", text: "I'm stuck on a chemistry stoichiometry problem." },
  { emoji: "🧠", text: "What's the difference between correlation and causation?" },
];

const FLOATING = [
  { e: "📚", style: { top: "8%",  left: "4%",  fontSize: "2.2rem", "--dur": "6s",   "--delay": "0s"   } },
  { e: "✏️", style: { top: "20%", right: "5%", fontSize: "1.8rem", "--dur": "8s",   "--delay": "1s"   } },
  { e: "🎓", style: { top: "65%", left: "3%",  fontSize: "2rem",   "--dur": "7s",   "--delay": "2s"   } },
  { e: "🧮", style: { top: "75%", right: "4%", fontSize: "1.6rem", "--dur": "9s",   "--delay": "0.5s" } },
  { e: "🔬", style: { top: "40%", left: "6%",  fontSize: "1.5rem", "--dur": "7.5s", "--delay": "1.5s" } },
  { e: "📝", style: { top: "12%", right: "10%",fontSize: "1.4rem", "--dur": "6.5s", "--delay": "2.5s" } },
  { e: "💡", style: { top: "50%", right: "6%", fontSize: "1.6rem", "--dur": "10s",  "--delay": "3s"   } },
  { e: "🌍", style: { top: "85%", left: "8%",  fontSize: "1.5rem", "--dur": "8.5s", "--delay": "1.2s" } },
];

const MODELS: { id: AIModel; label: string; emoji: string; desc: string }[] = [
  { id: "default",  emoji: "✦",  label: "Default",  desc: "Smart & balanced" },
  { id: "fast",     emoji: "⚡", label: "Fast",     desc: "Quick answers" },
  { id: "thinking", emoji: "🧠", label: "Thinking", desc: "Deep reasoning" },
];

interface Props { plan: string; }

export default function ChatInterface({ plan }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [pdfText, setPdfText] = useState<string | null>(null);
  const [pdfLabel, setPdfLabel] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [aiModel, setAiModel] = useState<AIModel>("default");
  const [focused, setFocused] = useState(false);
  const [questionsUsed, setQuestionsUsed] = useState(0);
  const [quotaModal, setQuotaModal] = useState(false);
  const [shortWarning, setShortWarning] = useState<string | null>(null);
  const { user } = useUser();
  const [myClasses, setMyClasses] = useState<ClassRoom[]>([]);
  const [mode, setMode] = useState<ChatMode>({ type: "none" });
  const [classMenuOpen, setClassMenuOpen] = useState(false);
  const [classAssignments, setClassAssignments] = useState<{ id: string; title: string }[]>([]);
  const [activeAssignment, setActiveAssignmentState] = useState<ActiveAssignment | null>(null);
  const [assignmentMenuOpen, setAssignmentMenuOpen] = useState(false);
  const [classPickerOpen, setClassPickerOpen] = useState(false);
  const [classesLoaded, setClassesLoaded] = useState(false);
  useEffect(() => { setQuestionsUsed(getTodayCount()); }, []);
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const enrolled = await getClassesByStudent();
      setMyClasses(enrolled);
      setMode(getChatMode());
      setActiveAssignmentState(getActiveAssignment());
      setClassesLoaded(true);
      // Force students to confirm their class at the start of each chat session
      if (enrolled.length > 0) setClassPickerOpen(true);
    })();
  }, [user?.id]);

  // When the active class changes, fetch its assignments.
  // If the previously-active assignment is from a different class, clear it.
  useEffect(() => {
    const classId = mode.type === "class" ? mode.classId : null;
    if (!classId) { setClassAssignments([]); return; }
    fetch(`/api/classes/${classId}/assignments`, { cache: "no-store" })
      .then(r => r.ok ? r.json() : { assignments: [] })
      .then(data => setClassAssignments(data.assignments ?? []))
      .catch(() => setClassAssignments([]));
    // Clear active assignment if it doesn't belong to this class
    if (activeAssignment && activeAssignment.classId !== classId) {
      setActiveAssignmentState(null);
      setActiveAssignment(null);
    }
  }, [mode, activeAssignment]);

  function pickAssignment(a: ActiveAssignment | null) {
    setActiveAssignmentState(a);
    setActiveAssignment(a);
    setAssignmentMenuOpen(false);
  }
  const isFree = plan === "free";
  const remaining = isFree ? Math.max(0, FREE_DAILY_LIMIT - questionsUsed) : Infinity;
  const atQuota = isFree && remaining <= 0;
  const activeClassRoom = mode.type === "class" ? myClasses.find(c => c.id === mode.classId) ?? null : null;

  // If saved class is no longer valid (e.g. removed from class), clear it.
  // The modal will then force a re-pick. Students in 0 classes stay in "none" mode.
  useEffect(() => {
    if (myClasses.length === 0) return;
    if (mode.type === "class" && !myClasses.some(c => c.id === mode.classId)) {
      setMode({ type: "none" });
      setChatMode({ type: "none" });
      setClassPickerOpen(true);
    }
  }, [myClasses, mode]);

  function pickMode(next: ChatMode) {
    setMode(next);
    setChatMode(next);
    setClassMenuOpen(false);
  }
  const [settings, setSettings] = useState<AISettings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try { const s = localStorage.getItem("ie-settings"); return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS; }
    catch { return DEFAULT_SETTINGS; }
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function saveSettings(s: AISettings) {
    setSettings(s);
    try { localStorage.setItem("ie-settings", JSON.stringify(s)); } catch { /**/ }
  }

  function resize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;
    // Force class selection before sending
    if (myClasses.length > 0 && mode.type !== "class") {
      setClassPickerOpen(true);
      return;
    }
    // ─── Input validation: prevent accidental/empty/garbage submissions ───
    const meaningful = trimmed.replace(/[\s\W]+/g, "");
    if (meaningful.length < 4) {
      setShortWarning("That looks incomplete — write a real question (at least a few words).");
      setTimeout(() => setShortWarning(null), 4000);
      return;
    }
    if (plan === "free" && remainingQuestions("free") <= 0) {
      setQuotaModal(true);
      return;
    }
    if (plan === "free") {
      const next = incrementTodayCount();
      setQuestionsUsed(next);
    }

    const photoBlocks: ContentBlock[] = attachments
      .filter(a => a.type === "photo")
      .map(a => ({ type: "image", source: { type: "base64", media_type: a.mediaType as ImageMediaType, data: a.data } }));

    const extraText = attachments
      .filter(a => a.type === "file" || a.type === "link")
      .map(a => a.type === "link" ? `[Reference: ${a.data}]` : `[File — ${a.name}]:\n${a.data}`)
      .join("\n\n");

    const fullText = [extraText, trimmed].filter(Boolean).join("\n\n");
    const userContent: string | ContentBlock[] =
      photoBlocks.length > 0 ? [...photoBlocks, { type: "text", text: fullText }] : fullText;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: userContent };
    const aiMsg: Message   = { id: crypto.randomUUID(), role: "assistant", content: "" };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setInput("");
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setStreaming(true);

    const pdfAttachment = attachments.find(a => a.type === "pdf");
    const activePdf = pdfAttachment?.data ?? pdfText ?? null;

    try {
      const history = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, pdfContent: activePdf, settings, model: aiModel, assignmentId: activeAssignment?.id }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: "Request failed." }));
        setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: `Error: ${err.error ?? "Something went wrong."}` } : m));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: (m.content as string) + chunk } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, content: "Error: Unable to reach the server." } : m));
    } finally {
      setStreaming(false);
      // Fire-and-forget background analysis once we have at least 2 user turns
      // (4+ messages = real exchange). Runs async, never blocks the UI.
      setMessages(currentMessages => {
        const userTurns = currentMessages.filter(m => m.role === "user").length;
        const currentMode = getChatMode();
        if (userTurns >= 2 && userTurns % 2 === 0) {
          const payload = currentMessages.map(m => ({ role: m.role, content: m.content }));
          const activeClassId = currentMode.type === "class" ? currentMode.classId : null;
          fetch("/api/analyze-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ messages: payload }),
          })
            .then(r => r.ok ? r.json() : null)
            .then(data => {
              if (!data?.analysis) return;
              // ─── Validity gate: drop garbage sessions ───
              if (data.analysis.valid_for_analytics === false) return;

              // ─── Subject mismatch detection ───
              const classRoom = activeClassId ? myClasses.find(c => c.id === activeClassId) : null;
              const detected = data.analysis.detected_subject ?? null;
              // Infer the class's "expected" subject from its name (best-effort heuristic)
              let mismatch = false;
              if (classRoom && detected) {
                const className = classRoom.name.toLowerCase();
                const subjectGuess: Record<string, string[]> = {
                  Math:       ["math", "calc", "algebra", "geometry", "stat"],
                  Science:    ["science", "bio", "chem", "physics"],
                  History:    ["history", "social", "civic"],
                  Languages:  ["spanish", "french", "german", "language", "latin"],
                  Coding:     ["coding", "cs ", "computer", "programming"],
                  Literature: ["literature", "english", "lit ", "writing"],
                };
                const expectedSubjects = Object.entries(subjectGuess)
                  .filter(([, kws]) => kws.some(k => className.includes(k)))
                  .map(([s]) => s);
                if (expectedSubjects.length > 0 && !expectedSubjects.includes(detected)) {
                  mismatch = true;
                }
              }

              // Save to Supabase via API
              fetch("/api/snapshots", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  classId: activeClassId,
                  concepts: data.analysis.concepts ?? [],
                  misconceptions: data.analysis.misconceptions ?? [],
                  hint_count: data.analysis.hint_count ?? 0,
                  aha_moment: data.analysis.aha_moment ?? null,
                  question_depth: data.analysis.question_depth ?? "surface",
                  engagement_quality: data.analysis.engagement_quality ?? 5,
                  growth_signals: data.analysis.growth_signals ?? [],
                  summary: data.analysis.summary ?? "",
                  detected_subject: detected,
                  subject_mismatch: mismatch,
                  valid_for_analytics: true,
                }),
              }).catch(() => { /* silent */ });
            })
            .catch(() => { /* silent */ });
        }
        return currentMessages;
      });
    }
  }, [messages, pdfText, attachments, streaming, settings, aiModel, plan, activeAssignment, myClasses, mode]);

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  const streamingId = streaming ? messages[messages.length - 1]?.id : null;
  const needsClassPick = classesLoaded && myClasses.length > 0 && mode.type !== "class";
  const canSend = input.trim().length > 0 && !streaming && !atQuota && !needsClassPick;

  const InputBar = (
    <div className={`search-bar ${focused ? "search-bar-focused" : ""}`}>
      {/* Class selector — shown when student is in any classes.
          Always opens a dropdown so students can switch between classes. */}
      {myClasses.length > 0 && (
        <div className="relative" style={{ marginBottom: "-0.2rem" }}>
          <button onClick={() => setClassMenuOpen(o => !o)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all"
            style={{
              background: "rgba(37,99,235,0.16)",
              color: "var(--pill-active-text)",
              border: "1px solid rgba(96,165,250,0.4)",
              cursor: "pointer",
            }}>
            <GraduationCap size={11} />
            <span style={{ opacity: 0.7 }}>Class:</span>
            <strong>{activeClassRoom?.name ?? "Pick a class"}</strong>
            <ChevronDown size={11} style={{ opacity: 0.7 }} />
          </button>

          {classMenuOpen && (
            <div className="absolute top-full mt-1 left-0 z-30 rounded-xl p-1.5 min-w-[260px]"
              style={{ background: "var(--settings-bg)", border: "1px solid var(--settings-border)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
              <div className="px-2.5 pt-1.5 pb-1 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                {myClasses.length > 1 ? "Choose which class you're working on" : "Your class"}
              </div>
              {myClasses.map(c => (
                <ModeOption key={c.id}
                  active={mode.type === "class" && mode.classId === c.id}
                  icon={<GraduationCap size={12} />} title={c.name} subtitle={`Code: ${c.code}`}
                  onClick={() => pickMode({ type: "class", classId: c.id })}
                  activeColor="#3b82f6"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Assignment selector — shown only when in a class with assignments */}
      {mode.type === "class" && classAssignments.length > 0 && (
        <div className="relative" style={{ marginBottom: "-0.2rem" }}>
          <button onClick={() => setAssignmentMenuOpen(o => !o)}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all"
            style={{
              background: activeAssignment ? "rgba(168,85,247,0.18)" : "var(--surface)",
              color: activeAssignment ? "#c084fc" : "var(--text-muted)",
              border: `1px solid ${activeAssignment ? "rgba(168,85,247,0.4)" : "var(--border)"}`,
              cursor: "pointer",
            }}>
            📝 {activeAssignment ? <>Working on: <strong>{activeAssignment.title}</strong></> : <>Assignment: <span style={{ opacity: 0.7 }}>None</span></>}
            <ChevronDown size={11} style={{ opacity: 0.7 }} />
          </button>

          {assignmentMenuOpen && (
            <div className="absolute top-full mt-1 left-0 z-30 rounded-xl p-1.5 min-w-[280px]"
              style={{ background: "var(--settings-bg)", border: "1px solid var(--settings-border)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }}>
              <div className="px-2.5 pt-1.5 pb-1 text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                Pick an assignment to work on
              </div>
              <ModeOption
                active={!activeAssignment}
                icon="✨" title="General study" subtitle="Not tied to an assignment"
                onClick={() => pickAssignment(null)}
                activeColor="#94a3b8"
              />
              <div className="my-1.5 mx-1.5 border-t" style={{ borderColor: "var(--border)" }} />
              {classAssignments.map(a => (
                <ModeOption key={a.id}
                  active={activeAssignment?.id === a.id}
                  icon="📝" title={a.title} subtitle="Click to focus the tutor on this assignment"
                  onClick={() => pickAssignment({ id: a.id, title: a.title, classId: (mode as { type: "class"; classId: string }).classId })}
                  activeColor="#a855f7"
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="model-bar">
        {MODELS.map(m => (
          <button key={m.id} onClick={() => setAiModel(m.id)}
            className={`model-pill ${aiModel === m.id ? "model-pill-active" : "model-pill-inactive"}`}
            title={m.desc}>
            <span>{m.emoji}</span><span>{m.label}</span>
            {aiModel === m.id && m.id === "thinking" && <span className="text-xs animate-pulse">●</span>}
          </button>
        ))}
        {pdfLabel && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full truncate max-w-[140px]"
            style={{ background: "rgba(37,99,235,0.15)", color: "var(--pill-active-text)", border: "1px solid var(--border)" }}>
            📄 {pdfLabel}
          </span>
        )}
      </div>

      <textarea ref={textareaRef} rows={1} value={input}
        onChange={e => { setInput(e.target.value); resize(); }}
        onKeyDown={onKey} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={hasMessages ? "Ask a follow-up…" : "Ask a question, paste homework, or upload a file…"}
        disabled={streaming} className="search-textarea" />

      <div className="search-actions">
        <AttachmentMenu plan={plan} attachments={attachments} onChange={setAttachments}
          onPDFParsed={(text, filename) => { setPdfText(text); setPdfLabel(filename); }} />
        <button onClick={() => send(input)} disabled={!canSend} className="send-btn"
          style={{
            background: canSend ? "linear-gradient(135deg,#1d4ed8,#2563eb)" : "var(--surface)",
            color: canSend ? "#fff" : "var(--text-faint)",
            cursor: canSend ? "pointer" : "not-allowed",
            boxShadow: canSend ? "0 2px 16px rgba(37,99,235,0.5)" : "none",
          }}>
          <Send size={15} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="chat-root">
      <div className="chat-glow-orb chat-glow-1" />
      <div className="chat-glow-orb chat-glow-2" />
      <div className="chat-glow-orb chat-glow-3" />

      <header className="chat-header">
        <Link href="/" className="flex items-center gap-2.5 transition-opacity"
          style={{ textDecoration: "none" }}
          onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
          onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <div className="flex items-center justify-center w-8 h-8 rounded-xl text-sm"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", boxShadow: "0 2px 12px rgba(37,99,235,0.5)" }}>
            🔍
          </div>
          <span className="hidden sm:inline text-sm font-bold" style={{ color: "var(--text-primary)" }}>Inquiry Engine</span>
          <span className="hidden md:inline text-xs px-2 py-0.5 rounded-full"
            style={{ background: "rgba(37,99,235,0.15)", color: "var(--pill-active-text)", border: "1px solid var(--border)" }}>
            Claude AI
          </span>
        </Link>
        <div className="flex items-center gap-1.5 md:gap-2">
          {isFree && (
            <Link href="/pricing" title="Free plan — 5 questions/day. Click to upgrade." className="text-xs px-2 py-1 rounded-full flex items-center gap-1.5"
              style={{ background: remaining <= 1 ? "rgba(245,158,11,0.18)" : "var(--surface)",
                       color: remaining <= 1 ? "#fbbf24" : "var(--text-muted)",
                       border: `1px solid ${remaining <= 1 ? "rgba(245,158,11,0.4)" : "var(--border)"}`,
                       textDecoration: "none" }}>
              <Zap size={11} /> {remaining}<span className="hidden sm:inline"> / {FREE_DAILY_LIMIT}</span>
            </Link>
          )}
          <button onClick={() => setSettingsOpen(true)}
            className="flex items-center justify-center rounded-lg p-2 transition-all"
            title="AI Settings"
            style={{ color: "var(--text-muted)", border: "1px solid transparent" }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--primary)"; e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent"; }}>
            <Settings2 size={16} />
          </button>
          <NavMenu dark />
          <UserButton />
        </div>
      </header>

      <main className="chat-main">
        {!hasMessages ? (
          <div className="welcome-wrap">
            {FLOATING.map((f, i) => (
              <div key={i} className="chat-emoji" style={f.style as React.CSSProperties}>{f.e}</div>
            ))}
            <div className="welcome-inner">
              <div className="welcome-icon">🔍</div>
              <h1 className="welcome-title">What would you like to <span>explore?</span></h1>
              <p className="welcome-sub">Ask anything — we&apos;ll work through it together.</p>
              {InputBar}
              <div className="suggestions">
                {SUGGESTED.map(s => (
                  <button key={s.text} onClick={() => { setInput(s.text); textareaRef.current?.focus(); }}
                    className="suggestion-chip">
                    <span>{s.emoji}</span><span>{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map(m => <ChatMessage key={m.id} message={m} isStreaming={m.id === streamingId} />)}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {hasMessages && (
        <footer className="chat-footer">
          <div className="chat-footer-inner">
            {InputBar}
            <p className="footer-note">Inquiry Engine guides — never gives direct answers · Powered by Claude</p>
          </div>
        </footer>
      )}

      <SettingsPanel open={settingsOpen} settings={settings} onChange={saveSettings} onClose={() => setSettingsOpen(false)} />

      {/* Class picker — forces students to confirm class at the start of each chat session */}
      {classPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="rounded-3xl max-w-md w-full p-7"
            style={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
            <div className="text-4xl mb-4 text-center">🎓</div>
            <h2 className="font-extrabold text-xl mb-2 text-center" style={{ color: "#fff" }}>
              Which class are you working on?
            </h2>
            <p className="text-sm mb-5 text-center" style={{ color: "#9ca3af" }}>
              Pick the class so your teacher sees your progress for the right one. You can switch any time during the chat.
            </p>
            <div className="flex flex-col gap-2 mb-2">
              {myClasses.map(c => {
                const isCurrent = mode.type === "class" && mode.classId === c.id;
                return (
                  <button key={c.id}
                    onClick={() => {
                      pickMode({ type: "class", classId: c.id });
                      setClassPickerOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: isCurrent ? "rgba(59,130,246,0.22)" : "rgba(255,255,255,0.05)",
                      border: `1.5px solid ${isCurrent ? "rgba(59,130,246,0.55)" : "rgba(255,255,255,0.08)"}`,
                    }}
                    onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
                    onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}>
                      <GraduationCap size={16} style={{ color: "#fff" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold" style={{ color: "#fff" }}>{c.name}</div>
                      <div className="text-xs font-mono mt-0.5" style={{ color: "#9ca3af" }}>{c.code}</div>
                    </div>
                    {isCurrent && (
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "rgba(59,130,246,0.3)", color: "#93c5fd" }}>Last used</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Short-input warning toast */}
      {shortWarning && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 rounded-xl px-4 py-2.5 text-xs flex items-center gap-2"
          style={{ background: "rgba(245,158,11,0.18)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.4)", backdropFilter: "blur(8px)" }}>
          ⚠️ {shortWarning}
        </div>
      )}

      {/* Quota exhausted modal */}
      {quotaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
          onClick={() => setQuotaModal(false)}>
          <div className="rounded-3xl max-w-md w-full p-7 text-center"
            onClick={e => e.stopPropagation()}
            style={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>
            <div className="text-5xl mb-4">⚡</div>
            <h2 className="text-xl font-extrabold mb-2" style={{ color: "#fff" }}>You&apos;ve used your 5 free questions today</h2>
            <p className="text-sm mb-6 leading-relaxed" style={{ color: "#9ca3af" }}>
              Your quota resets at midnight. Or upgrade for <strong style={{ color: "#fff" }}>unlimited questions</strong>, file uploads, links, and your personal Learning DNA profile.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setQuotaModal(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-medium"
                style={{ background: "rgba(255,255,255,0.06)", color: "#d1d5db", border: "1px solid rgba(255,255,255,0.1)" }}>
                Wait until tomorrow
              </button>
              <Link href="/pricing"
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", boxShadow: "0 4px 18px rgba(37,99,235,0.5)", textDecoration: "none" }}>
                Upgrade Now →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeOption({ active, icon, title, subtitle, onClick, activeColor }: {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  activeColor: string;
}) {
  return (
    <button onClick={onClick}
      className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-start gap-2.5"
      style={{
        background: active ? `${activeColor}22` : "transparent",
        border: `1px solid ${active ? activeColor + "55" : "transparent"}`,
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}>
      <span className="text-base mt-0.5" style={{ flexShrink: 0, color: activeColor }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold" style={{ color: active ? activeColor : "var(--text-primary)" }}>{title}</div>
        <div className="text-xs mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>{subtitle}</div>
      </div>
      {active && <span style={{ color: activeColor, fontSize: "0.8rem", flexShrink: 0 }}>✓</span>}
    </button>
  );
}
