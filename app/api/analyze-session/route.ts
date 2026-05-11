import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const ANALYZER_PROMPT = `You are an expert learning scientist analyzing a Socratic tutoring conversation between a student and an AI tutor (the "Inquiry Engine") that never gives direct answers but guides students through questions.

Your FIRST job is to gate the analysis. Only sessions with real academic engagement should produce learning data — accidental submissions, greetings, off-topic chatter, or transcripts where no actual academic content was discussed must be marked invalid.

Your SECOND job, only if the session is valid: extract structured learning signals. Be precise, evidence-based, and never invent data — if a signal is not clearly present, mark it null or empty.

You MUST respond with a single valid JSON object, no prose, no markdown fences. Schema:

{
  "valid_for_analytics": true | false,
  "invalid_reason": null | "accidental_submission" | "off_topic" | "greeting_only" | "no_academic_content" | "incomplete_question",
  "detected_subject": "Math" | "Science" | "History" | "Languages" | "Coding" | "Literature" | "Other" | null,
  "concepts": [
    {
      "name": "concept name (concise, e.g. 'quadratic formula', 'chain rule', 'photosynthesis')",
      "subject": "Math" | "Science" | "History" | "Languages" | "Coding" | "Literature" | "Other",
      "mastery": "exposed" | "scaffolded" | "demonstrated" | "transferred",
      "evidence": "one-sentence quote or paraphrase from the transcript justifying the mastery level"
    }
  ],
  "misconceptions": [
    {
      "concept": "what concept the misconception was about",
      "wrong_model": "the incorrect mental model the student revealed, in plain language",
      "addressed": true | false
    }
  ],
  "hint_count": 0,
  "aha_moment": null,
  "question_depth": "surface" | "procedural" | "conceptual",
  "engagement_quality": 1,
  "growth_signals": [
    "specific observation about how the student's thinking improved during this session"
  ],
  "summary": "one sentence summarizing what the student worked on and how it went"
}

If valid_for_analytics is false: still fill in invalid_reason and summary (briefly explain why), but set concepts, misconceptions, growth_signals to empty arrays, hint_count to 0, aha_moment to null, engagement_quality to 0, detected_subject to null, question_depth to "surface".

Validity rules:
- "greeting_only" — entire conversation is hi/hello/test/asdf with no academic content
- "accidental_submission" — student sent one or two empty/broken/non-academic messages
- "off_topic" — student tried to chat about weather, sports, personal life, etc.
- "incomplete_question" — student trailed off, never engaged with any concept
- "no_academic_content" — conversation happened but no learning topic emerged

Default to valid = true if there is any genuine academic exchange, even brief.

Definitions:
- mastery levels:
  - "exposed":     student encountered the concept but did not show understanding
  - "scaffolded":  student followed AI hints to arrive at the idea, with significant prompting
  - "demonstrated": student articulated the concept clearly in their own words at least once
  - "transferred": student applied the concept to a new situation, made a connection, or generalized
- question_depth:
  - "surface":     "what's the answer", "give me the formula", procedural copy-paste
  - "procedural":  "how do I do this step", asks about a method
  - "conceptual":  "why does this work", asks about underlying mechanism
- engagement_quality: 1-10, holistic score of how thoughtfully the student engaged
- hint_count: count of guiding questions the AI gave before the student had a clear breakthrough or end-of-session understanding (0 if none reached)
- aha_moment: short quote/paraphrase of the moment the student "got it", or null if none observed`;

interface AnalyzeRequest {
  messages: { role: "user" | "assistant"; content: string | unknown }[];
}

function flattenContent(content: string | unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((b) => {
        if (typeof b === "object" && b !== null) {
          const block = b as { type?: string; text?: string };
          if (block.type === "text" && typeof block.text === "string") return block.text;
          if (block.type === "image") return "[image]";
        }
        return "";
      })
      .join(" ");
  }
  return "";
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY missing" }), { status: 500 });
  }

  let body: AnalyzeRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
  }

  const transcript = body.messages
    .map((m) => `${m.role === "user" ? "STUDENT" : "TUTOR"}: ${flattenContent(m.content)}`)
    .join("\n\n");

  if (transcript.length < 80) {
    return new Response(JSON.stringify({ error: "Conversation too short to analyze" }), { status: 400 });
  }

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: ANALYZER_PROMPT,
      messages: [
        { role: "user", content: `Analyze this Socratic tutoring session:\n\n<transcript>\n${transcript}\n</transcript>\n\nReturn the JSON analysis now.` },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return new Response(JSON.stringify({ error: "No analysis returned" }), { status: 500 });
    }

    let parsed;
    try {
      const raw = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, "");
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "Analysis returned non-JSON", raw: textBlock.text }), { status: 500 });
    }

    return new Response(JSON.stringify({ analysis: parsed, timestamp: Date.now() }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
