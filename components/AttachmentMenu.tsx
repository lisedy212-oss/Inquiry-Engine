"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, FileText, Image, Paperclip, Link2, Lock, X } from "lucide-react";
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

const isAllowed = (type: "pdf" | "photo" | "file" | "link", plan: string) =>
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
    const fn = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) { setOpen(false); setLinkPrompt(false); } };
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

  function handleLink() {
    const url = linkValue.trim(); if (!url) return;
    onChange([...attachments, { id: crypto.randomUUID(), type: "link", name: url, data: url }]);
    setLinkValue(""); setLinkPrompt(false); setOpen(false);
  }

  const ITEMS = [
    { icon: FileText,  label: "PDF Search",    type: "pdf"   as const, action: () => pdfRef.current?.click() },
    { icon: Image,     label: "Picture Search", type: "photo" as const, action: () => photoRef.current?.click() },
    { icon: Paperclip, label: "File",           type: "file"  as const, action: () => fileRef.current?.click() },
    { icon: Link2,     label: "Link",           type: "link"  as const, action: () => setLinkPrompt(true) },
  ];

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
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text-muted)")}><X size={11} /></button>
        </div>
      ))}

      <div className="relative" ref={menuRef}>
        {/* Badge */}
        {attachments.length > 0 && !open && (
          <div className="absolute -top-1.5 -right-1.5 z-10 w-4 h-4 rounded-full flex items-center justify-center font-bold"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", fontSize: "0.6rem" }}>
            {attachments.length}
          </div>
        )}

        {open && (
          <div className="absolute bottom-11 left-0 z-20 rounded-2xl p-1.5 flex flex-col gap-0.5 min-w-[165px]"
            style={{ background: "var(--settings-bg)", border: "1px solid var(--settings-border)", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>
            {linkPrompt ? (
              <div className="p-2 flex flex-col gap-2">
                <input autoFocus value={linkValue} onChange={e => setLinkValue(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLink()} placeholder="Paste URL…"
                  className="w-full rounded-lg px-2 py-1.5 text-xs bg-transparent border"
                  style={{ borderColor: "var(--border)", color: "var(--input-text)" }} />
                <button onClick={handleLink} className="rounded-lg py-1 text-xs font-semibold"
                  style={{ background: "rgba(37,99,235,0.2)", color: "var(--pill-active-text)" }}>Add Link</button>
              </div>
            ) : (
              <>
                {plan === "free" && (
                  <div className="px-3 pt-2 pb-0.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Free tier</div>
                )}
                {ITEMS.map(item => {
                  const allowed = isAllowed(item.type, plan);
                  return (
                    <button key={item.label}
                      onClick={() => { if (allowed) { item.action(); setOpen(false); } else router.push("/pricing"); }}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs text-left w-full transition-colors"
                      style={{ color: allowed ? "var(--primary)" : "var(--text-faint)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = allowed ? "rgba(37,99,235,0.15)" : "var(--surface)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                      <item.icon size={13} style={{ flexShrink: 0 }} />
                      <span className="flex-1">{item.label}</span>
                      {!allowed && <span className="flex items-center gap-1" style={{ color: "var(--text-faint)" }}><Lock size={10} /><span style={{ fontSize: "0.65rem" }}>Pro</span></span>}
                    </button>
                  );
                })}
                {plan === "free" && (
                  <button onClick={() => router.push("/pricing")}
                    className="mx-2 mb-1.5 mt-1 rounded-xl py-1.5 text-xs font-semibold text-center"
                    style={{ background: "rgba(37,99,235,0.15)", color: "var(--primary)", border: "1px solid var(--border)" }}>
                    Upgrade for more ↗
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
