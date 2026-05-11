export type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: ImageMediaType; data: string } };

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string | ContentBlock[];
}

export interface PDFData {
  text: string;
  numPages: number;
  filename: string;
}

export type AIModel = "default" | "fast" | "thinking";

export interface AISettings {
  subject: "general" | "math" | "science" | "humanities" | "languages" | "coding";
  level: "elementary" | "middle" | "high" | "university" | "professional";
  hintDepth: "gentle" | "balanced" | "strict";
  responseStyle: "concise" | "balanced" | "detailed";
}

export const DEFAULT_SETTINGS: AISettings = {
  subject: "general",
  level: "high",
  hintDepth: "balanced",
  responseStyle: "balanced",
};

export interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string | ContentBlock[] }[];
  pdfContent: string | null;
  settings: AISettings;
  model: AIModel;
}

export interface ParsePDFResponse {
  text: string;
  numPages: number;
  error?: string;
}
