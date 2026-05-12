import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { buildSystemPrompt } from "@/lib/systemPrompt";
import { supabaseServer } from "@/lib/supabase-server";
import { DEFAULT_SETTINGS } from "@/types";
import type { ChatRequest, AIModel } from "@/types";

const client = new Anthropic();

const MODEL_MAP: Record<AIModel, string> = {
  default:  "claude-sonnet-4-6",
  fast:     "claude-haiku-4-5-20251001",
  thinking: "claude-sonnet-4-6",
};

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, pdfContent, settings = DEFAULT_SETTINGS, model = "default" } = body;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignmentId = (body as any).assignmentId as string | undefined;

  let system = buildSystemPrompt(settings);
  if (pdfContent) {
    system +=
      `\n\n<student_document>\n` +
      `The student has uploaded a PDF. The content is reproduced below with page markers.\n` +
      `When referencing this document, always cite the specific [PAGE N] marker.\n\n` +
      pdfContent +
      `\n</student_document>`;
  }

  // ─── Assignment-aware tutoring ──────────────────────────────────
  if (assignmentId) {
    const { userId } = await auth();
    if (userId) {
      try {
        const sb = supabaseServer();
        const { data: a } = await sb.from("assignments").select("title, content, class_id").eq("id", assignmentId).maybeSingle();
        if (a) {
          // Permission check: student or teacher of that class
          const [{ data: t }, { data: s }] = await Promise.all([
            sb.from("class_teachers").select("teacher_id").eq("class_id", a.class_id).eq("teacher_id", userId).maybeSingle(),
            sb.from("class_students").select("student_id").eq("class_id", a.class_id).eq("student_id", userId).maybeSingle(),
          ]);
          if (t || s) {
            system +=
              `\n\n<active_assignment title="${escapeForXml(a.title)}">\n` +
              `The student is working on this specific assignment from their teacher. Tutor them on this assignment only. ` +
              `Reference exact problem numbers when relevant. Stay focused on what this assignment actually asks — don't go off-topic or invent problems not in the assignment.\n\n` +
              `--- ASSIGNMENT CONTENT ---\n` +
              a.content +
              `\n--- END ASSIGNMENT ---\n` +
              `</active_assignment>`;
          }
        }
      } catch { /* ignore — assignment context is optional */ }
    }
  }

  const isThinking = model === "thinking";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const streamParams: any = {
    model: MODEL_MAP[model],
    max_tokens: isThinking ? 4096 : 2048,
    system: [
      {
        type: "text",
        text: system,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  };

  if (isThinking) {
    streamParams.thinking = { type: "adaptive" };
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream(streamParams);
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[chat route error]", msg);
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}

function escapeForXml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[c]!);
}
