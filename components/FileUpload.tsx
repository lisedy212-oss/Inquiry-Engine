"use client";

import { useRef, useState } from "react";
import { Paperclip, X, FileText } from "lucide-react";
import type { PDFData, ParsePDFResponse } from "@/types";

interface Props {
  pdfData: PDFData | null;
  onPDFLoaded: (data: PDFData) => void;
  onPDFRemoved: () => void;
}

export default function FileUpload({ pdfData, onPDFLoaded, onPDFRemoved }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!inputRef.current) inputRef.current!.value = "";
    if (!file) return;

    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      const json: ParsePDFResponse = await res.json();

      if (!res.ok || json.error) {
        setError(json.error ?? "Failed to parse PDF.");
        return;
      }

      onPDFLoaded({ text: json.text, numPages: json.numPages, filename: file.name });
    } catch {
      setError("Network error while uploading PDF.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (pdfData) {
    return (
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs"
        style={{
          background: "rgba(139,92,246,0.12)",
          border: "1px solid rgba(139,92,246,0.3)",
          color: "#c4b5fd",
        }}
      >
        <FileText size={13} className="shrink-0" />
        <span className="truncate max-w-[160px]" title={pdfData.filename}>
          {pdfData.filename}
        </span>
        <span style={{ color: "#6b7280" }}>· {pdfData.numPages}p</span>
        <button
          onClick={onPDFRemoved}
          className="ml-1 shrink-0 rounded-full p-0.5 transition-colors"
          style={{ color: "#6b7280" }}
          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
          aria-label="Remove PDF"
        >
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload PDF"
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs transition-all"
        style={{
          background: "rgba(139,92,246,0.08)",
          border: "1px solid rgba(139,92,246,0.2)",
          color: loading ? "#6b7280" : "#a78bfa",
          cursor: loading ? "not-allowed" : "pointer",
        }}
        onMouseEnter={e => {
          if (!loading) e.currentTarget.style.background = "rgba(139,92,246,0.16)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = "rgba(139,92,246,0.08)";
        }}
      >
        <Paperclip size={13} />
        {loading ? "Parsing…" : "Attach PDF"}
      </button>
      {error && (
        <span className="text-xs" style={{ color: "#f87171" }}>
          {error}
        </span>
      )}
    </div>
  );
}
