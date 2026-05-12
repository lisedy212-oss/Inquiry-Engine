"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, FileText, Image, Paperclip, Link2, Lock, X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export interface PendingAttachment {
  id: string; type: "pdf" | "photo" | "file" | "link";
  name: string; data: string; mediaType?: string;
}

interface Props {
  plan: string; attachments: PendingAttachment[];
  onChange: (a: PendingAttachment[]) => void;
  onPDFParsed: (text: string, filename: string, numPages: number) => void;
}

type AttachmentType = "pdf" | "photo" | "file" | "link";

const isAllowed = (type: AttachmentType, plan: string) =>
  type === "pdf" || type === "photo" || plan !== "free";

export default function AttachmentMenu({ plan, attachments, onChange, onPDFParsed }: Props) {
  const [open, setOpen] = useState(false);
  const [linkPrompt, setLinkPrompt] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false); setLinkPrompt(false);
      }
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  async function handlePDF(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setOpen(false);
    const form = new FormData(); form.append("file", file);
    const res = await fetch("/api/parse-pdf", { method: "POST", body: form });
    const json = await res.json();
    if (!json.error) onPDFParsed(json.text, file.name, json.numPages);
    setUploading(false); e.target.value = "";
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setOpen(false);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      onChange([...attachments, { id: crypto.randomUUID(), type: "photo", name: file.name, data: base64, mediaType: file.type }]);
    };
    reader.readAsDataURL(file); e.target.value = "";
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setOpen(false);
    const text = await file.text();
    onChange([...attachments, { id: crypto.randomUUID(), type: "file", name: file.name, data: text }]);
    e.target.value = "";
  }

  function submitLink() {
    let url = linkValue.trim();
    if (!url) return;
    // Auto-prepend https:// if user pasted without scheme
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    onChange([...attachments, { id: crypto.randomUUID(), type: "link", name: url, data: url }]);
    setLinkValue(""); setLinkPrompt(false); setOpen(false);
  }

  interface Item {
    icon: typeof FileText;
    label: string;
    subtitle: string;
    type: AttachmentType;
    onSelect: () => void;
    keepOpen?: boolean;
  }

  const ITEMS: Item[] = [
    {
      icon: FileText, label: "Upload a PDF",
      subtitle: "Textbook, worksheet, notes",
      type: "pdf",
      onSelect: () => pdfRef.current?.click(),
    },
    {
      icon: Image, label: "Upload a Photo",
      subtitle: "Homework, diagram, screenshot",
      type: "photo",
      onSelect: () => photoRef.current?.click(),
    },
    {
      icon: Paperclip, label: "Upload a Document",
      subtitle: ".txt, .md, .csv, .json",
      type: "file",
      onSelect: () => fileRef.current?.click(),
    },
    {
      icon: Link2, label: "Paste a URL",
      subtitle: "Reference a website",
      type: "link",
      onSelect: () => setLinkPrompt(true),
      keepOpen: true, // keep menu open so the URL input is visible
    },
  ];

  function handleItemClick(item: Item) {
    const allowed = isAllowed(item.type, plan);
    if (!allowed) {
      setOpen(false);
      router.push("/pricing");
      return;
    }
    item.onSelect();
    if (!item.keepOpen) setOpen(false);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={pdfRef}   type="file" accept=".pdf,application/pdf" className="hidden" onChange={handlePDF} />
      <input ref={photoRef} type="file" accept="image/*"              className="hidden" onChange={handlePhoto} />
      <input ref={fileRef}  type="file" accept=".txt,.md,.csv,.json,.xml,.html" className="hidden" onChange={handleFile} />

      {attachments.map(att => (
        <div key={att.id} className="flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs"
          style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(96,165,250,0.3)", color: "#93c5fd" }}>
          {att.type === "photo" ? <Image size={11} /> : att.type === "link" ? <Link2 size={11} /> : att.type === "file" ? <Paperclip size={11} /> : <FileText size={11} />}
          <span className="max-w-[120px] truncate">{att.name}</span>
          <button onClick={() => onChange(attachments.filter(a => a.id !== att.id))}
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}>
            <X size={11} />
          </button>
        </div>
      ))}

      <div className="relative" ref={menuRef}>
        {/* Count badge */}
        {attachments.length > 0 && !open && (
          <div className="absolute -top-1.5 -right-1.5 z-10 w-4 h-4 rounded-full flex items-center justify-center font-bold"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", fontSize: "0.6rem" }}>
            {attachments.length}
          </div>
        )}

        {open && (
          <div className="absolute bottom-11 left-0 z-20 rounded-2xl p-1.5 min-w-[280px]"
            style={{ background: "var(--settings-bg)", border: "1px solid var(--settings-border)", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>

            {/* URL input — shown when Link is being entered */}
            {linkPrompt && (
              <div className="p-3 mb-1 rounded-xl" style={{ background: "rgba(37,99,235,0.08)", border: "1px solid var(--border)" }}>
                <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--primary)" }}>Paste URL</div>
                <div className="flex gap-1.5">
                  <input autoFocus value={linkValue} onChange={e => setLinkValue(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submitLink()}
                    placeholder="https://example.com"
                    className="flex-1 rounded-lg px-2.5 py-1.5 text-xs bg-transparent outline-none"
                    style={{ border: "1px solid var(--border)", color: "var(--input-text)" }} />
                  <button onClick={submitLink} disabled={!linkValue.trim()}
                    className="rounded-lg px-2.5 py-1.5 flex items-center justify-center"
                    style={{
                      background: linkValue.trim() ? "linear-gradient(135deg,#1d4ed8,#2563eb)" : "rgba(255,255,255,0.05)",
                      color: linkValue.trim() ? "#fff" : "var(--text-faint)",
                      cursor: linkValue.trim() ? "pointer" : "not-allowed",
                    }}>
                    <ArrowRight size={13} />
                  </button>
                </div>
                <button onClick={() => { setLinkPrompt(false); setLinkValue(""); }}
                  className="text-xs mt-2" style={{ color: "var(--text-faint)" }}>
                  ← Back to options
                </button>
              </div>
            )}

            {/* Item list — hidden while editing URL */}
            {!linkPrompt && (
              <>
                <div className="px-2.5 pt-1.5 pb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                  Add to your message
                </div>
                {ITEMS.map(item => {
                  const allowed = isAllowed(item.type, plan);
                  return (
                    <button key={item.label}
                      onClick={() => handleItemClick(item)}
                      className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors"
                      onMouseEnter={e => { e.currentTarget.style.background = allowed ? "rgba(37,99,235,0.12)" : "var(--surface)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: allowed ? "rgba(37,99,235,0.15)" : "var(--surface)",
                          color: allowed ? "var(--primary)" : "var(--text-faint)",
                        }}>
                        <item.icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold" style={{ color: allowed ? "var(--text-primary)" : "var(--text-faint)" }}>
                            {item.label}
                          </span>
                          {!allowed && (
                            <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: "rgba(245,158,11,0.18)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }}>
                              <Lock size={9} /> Pro
                            </span>
                          )}
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{item.subtitle}</div>
                      </div>
                    </button>
                  );
                })}
                {plan === "free" && (
                  <button onClick={() => router.push("/pricing")}
                    className="mx-2 mt-1.5 mb-1 rounded-xl py-2 text-xs font-bold text-center w-[calc(100%-1rem)]"
                    style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)", color: "#fff" }}>
                    Unlock files & links ↗
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <button onClick={() => { setOpen(o => !o); setLinkPrompt(false); }} disabled={uploading}
          className="flex items-center justify-center rounded-xl p-2 transition-all"
          style={{
            background: open ? "rgba(37,99,235,0.2)" : "var(--surface)",
            border: `1px solid ${open ? "var(--input-border-focus)" : "var(--border)"}`,
            color: uploading ? "var(--text-faint)" : "var(--primary)",
          }}>
          {uploading ? <span className="text-xs px-1">…</span> : <Plus size={16} />}
        </button>
      </div>
    </div>
  );
}
