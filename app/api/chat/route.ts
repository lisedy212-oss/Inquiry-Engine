import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { buildSystemPrompt } from "@/lib/systemPrompt";
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

  let system = buildSystemPrompt(settings);
  if (pdfContent) {
    system +=
      `\n\n<student_document>\n` +
      `The student has uploaded a PDF. The content is reproduced below with page markers.\n` +
      `When referencing this document, always cite the specific [PAGE N] marker.\n\n` +
      pdfContent +
      `\n</student_document>`;
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
