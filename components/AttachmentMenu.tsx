"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, FileText, Image, Paperclip, Link2, Lock, X, ArrowRight, Camera, RotateCcw } from "lucide-react";
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

type ItemType = "pdf" | "photo" | "camera" | "file" | "link";

// Free tier: PDF + Photo upload only. Camera/File/URL require a paid plan.
const isAllowed = (type: ItemType, plan: string) =>
  type === "pdf" || type === "photo" || plan !== "free";

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

export default function AttachmentMenu({ plan, attachments, onChange, onPDFParsed }: Props) {
  const [open, setOpen] = useState(false);
  const [linkPrompt, setLinkPrompt] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pressedType, setPressedType] = useState<ItemType | null>(null);

  // Camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [canFlip, setCanFlip] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

  // ─── File handlers ──────────────────────────────────────────────
  async function handlePDF(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setOpen(false);
    const form = new FormData(); form.append("file", file);
    const res = await fetch("/api/parse-pdf", { method: "POST", body: form });
    const json = await res.json();
    if (!json.error) onPDFParsed(json.text, file.name, json.numPages);
    setUploading(false); e.target.value = "";
  }

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
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
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    onChange([...attachments, { id: crypto.randomUUID(), type: "link", name: url, data: url }]);
    setLinkValue(""); setLinkPrompt(false); setOpen(false);
  }

  // ─── Camera ──────────────────────────────────────────────────────
  async function openCamera() {
    setOpen(false);
    setCameraOpen(true);
    setCaptured(null);
    setCameraError(null);
    // Default to rear on mobile, front on desktop
    const initial: "environment" | "user" = isMobile() ? "environment" : "user";
    setFacingMode(initial);
    await startCameraStream(initial);
    // Check if device has multiple cameras for the flip button
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(d => d.kind === "videoinput");
      setCanFlip(cams.length > 1);
    } catch { setCanFlip(false); }
  }

  async function startCameraStream(mode: "environment" | "user") {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Your browser doesn't support camera access. Try Chrome, Safari, or Edge.");
      return;
    }
    streamRef.current?.getTracks().forEach(t => t.stop());

    // Try the requested facingMode first; if it fails, fall back to any camera
    const attempts: MediaStreamConstraints[] = [
      { video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
      { video: { facingMode: mode === "environment" ? "user" : "environment" }, audio: false },
      { video: true, audio: false }, // any camera
    ];

    for (const constraints of attempts) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        return; // success
      } catch (err: unknown) {
        const e = err as { name?: string };
        // Permission denied — don't keep trying with other constraints
        if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
          setCameraError("Camera permission denied. Click the camera icon in your browser's address bar to allow it, then try again.");
          return;
        }
        // Else: keep falling back
      }
    }
    setCameraError("Couldn't access any camera on this device.");
  }

  function flipCamera() {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCameraStream(next);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCaptured(dataUrl);
  }

  function usePhoto() {
    if (!captured) return;
    const base64 = captured.split(",")[1];
    onChange([...attachments, {
      id: crypto.randomUUID(), type: "photo",
      name: `camera-${Date.now()}.jpg`, data: base64, mediaType: "image/jpeg",
    }]);
    closeCamera();
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOpen(false); setCaptured(null); setCameraError(null);
  }

  useEffect(() => { return () => { streamRef.current?.getTracks().forEach(t => t.stop()); }; }, []);

  // ─── Items ──────────────────────────────────────────────────────
  interface Item {
    icon: typeof FileText;
    label: string;
    subtitle: string;
    type: ItemType;
    onSelect: () => void;
    keepOpen?: boolean;
    iconColor: string;
  }

  const ITEMS: Item[] = [
    { icon: FileText,  label: "Upload a PDF",      subtitle: "Textbook, worksheet, notes",   type: "pdf",    iconColor: "#ef4444", onSelect: () => pdfRef.current?.click() },
    { icon: Image,     label: "Upload a Photo",    subtitle: "From your photo library",      type: "photo",  iconColor: "#10b981", onSelect: () => photoRef.current?.click() },
    { icon: Camera,    label: "Take a Photo",      subtitle: "Use your device camera",       type: "camera", iconColor: "#f59e0b", onSelect: openCamera },
    { icon: Paperclip, label: "Document File",     subtitle: "Code, .txt, .md, .csv, .json", type: "file",   iconColor: "#6366f1", onSelect: () => fileRef.current?.click() },
    { icon: Link2,     label: "Paste a URL",       subtitle: "Reference a website",          type: "link",   iconColor: "#0ea5e9", onSelect: () => setLinkPrompt(true), keepOpen: true },
  ];

  function handleItemClick(item: Item) {
    const allowed = isAllowed(item.type, plan);
    setPressedType(item.type);
    setTimeout(() => setPressedType(null), 350);
    if (!allowed) {
      setTimeout(() => { setOpen(false); router.push("/pricing"); }, 200);
      return;
    }
    setTimeout(() => {
      item.onSelect();
      if (!item.keepOpen) setOpen(false);
    }, 100);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input ref={pdfRef}   type="file" accept=".pdf,application/pdf" className="hidden" onChange={handlePDF} />
      <input ref={photoRef} type="file" accept="image/*"              className="hidden" onChange={handleImage} />
      <input ref={fileRef}  type="file" accept=".txt,.md,.csv,.json,.xml,.html,.js,.ts,.py,.java,.css,.tsx" className="hidden" onChange={handleFile} />

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
        {attachments.length > 0 && !open && (
          <div className="absolute -top-1.5 -right-1.5 z-10 w-4 h-4 rounded-full flex items-center justify-center font-bold"
            style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)", color: "#fff", fontSize: "0.6rem" }}>
            {attachments.length}
          </div>
        )}

        {open && (
          <div className="absolute bottom-11 left-0 z-20 rounded-2xl p-1.5 min-w-[300px] max-h-[70vh] overflow-y-auto"
            style={{ background: "var(--settings-bg)", border: "1px solid var(--settings-border)", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}>

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

            {!linkPrompt && (
              <>
                <div className="px-2.5 pt-1.5 pb-1 text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                  Add to your message
                </div>
                {ITEMS.map(item => {
                  const allowed = isAllowed(item.type, plan);
                  const isPressed = pressedType === item.type;
                  const ic = item.iconColor;
                  return (
                    <button key={item.label}
                      onClick={() => handleItemClick(item)}
                      className="w-full text-left flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all"
                      style={{
                        background: isPressed ? `${ic}26` : "transparent",
                        transform: isPressed ? "scale(0.98)" : "scale(1)",
                      }}
                      onMouseEnter={e => { if (!isPressed) e.currentTarget.style.background = allowed ? "rgba(37,99,235,0.10)" : "var(--surface)"; }}
                      onMouseLeave={e => { if (!isPressed) e.currentTarget.style.background = "transparent"; }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                        style={{
                          background: isPressed ? ic : (allowed ? `${ic}22` : "var(--surface)"),
                          color: isPressed ? "#fff" : (allowed ? ic : "var(--text-faint)"),
                          transform: isPressed ? "scale(1.15)" : "scale(1)",
                          boxShadow: isPressed ? `0 4px 16px ${ic}66` : "none",
                        }}>
                        <item.icon size={15} />
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
                    Unlock camera, files & URLs ↗
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

      {/* ─── Camera Modal ──────────────────────────────────────── */}
      {cameraOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
          <div className="rounded-3xl max-w-xl w-full overflow-hidden flex flex-col"
            style={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}>

            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(245,158,11,0.18)", color: "#fbbf24" }}>
                  <Camera size={16} />
                </div>
                <h2 className="font-extrabold" style={{ color: "#fff" }}>Take a Photo</h2>
              </div>
              <button onClick={closeCamera} style={{ color: "#9ca3af" }}><X size={18} /></button>
            </div>

            <div className="relative bg-black flex items-center justify-center" style={{ aspectRatio: "4/3" }}>
              {cameraError ? (
                <div className="text-center p-6">
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-sm" style={{ color: "#fca5a5" }}>{cameraError}</p>
                </div>
              ) : captured ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={captured} alt="Captured" className="max-w-full max-h-full object-contain" />
              ) : (
                <video ref={videoRef} autoPlay playsInline muted className="max-w-full max-h-full object-contain" />
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="px-5 py-4 flex items-center gap-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {cameraError ? (
                <button onClick={closeCamera}
                  className="flex-1 rounded-xl py-2.5 text-sm font-bold"
                  style={{ background: "rgba(255,255,255,0.08)", color: "#d1d5db" }}>
                  Close
                </button>
              ) : captured ? (
                <>
                  <button onClick={() => setCaptured(null)}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
                    style={{ background: "rgba(255,255,255,0.08)", color: "#d1d5db" }}>
                    <RotateCcw size={14} /> Retake
                  </button>
                  <button onClick={usePhoto}
                    className="flex-1 rounded-xl py-2.5 text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#1d4ed8,#2563eb)" }}>
                    Use This Photo
                  </button>
                </>
              ) : (
                <>
                  {canFlip && (
                    <button onClick={flipCamera}
                      className="flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold"
                      style={{ background: "rgba(255,255,255,0.08)", color: "#d1d5db" }}
                      title="Switch camera">
                      <RotateCcw size={14} />
                    </button>
                  )}
                  <button onClick={capturePhoto}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                    <Camera size={14} /> Capture
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
