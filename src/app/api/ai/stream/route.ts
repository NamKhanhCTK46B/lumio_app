import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { llm } from "@/lib/ai/provider";
import { roleplaySystemPrompt, roleplayUserPrompt } from "@/lib/ai/prompts/speaking";

export const runtime = "edge";

/**
 * POST /api/ai/stream
 *
 * Stream LLM response cho:
 * - roleplay: hội thoại AI roleplay
 *
 * Request body:
 * {
 *   type: "roleplay",
 *   sessionId: string,
 *   characterPrompt: string,
 *   characterName: string,
 *   history: Array<{ vai, noi_dung }>,
 *   userTranscript: string,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type } = body;

    if (type === "roleplay") {
      return handleRoleplay(body);
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch (err) {
    console.error("[ai/stream] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleRoleplay(body: {
  sessionId: string;
  characterPrompt: string;
  characterName: string;
  history: Array<{ vai: string; noi_dung: string }>;
  userTranscript: string;
}) {
  const { characterPrompt, characterName, history, userTranscript } = body;

  const systemPrompt = roleplaySystemPrompt({
    characterName,
    characterPrompt,
    cefrToiThieu: null,
  });

  // Build messages
  const messages: Array<{ role: "user" | "model"; text: string }> = [];

  // Add history
  for (const turn of history) {
    messages.push({
      role: turn.vai === "nguoi_dung" ? "user" : "model",
      text: turn.noi_dung,
    });
  }

  // Add current user turn
  messages.push({ role: "user", text: roleplayUserPrompt(userTranscript) });

  try {
    // Convert to OpenAI-compatible format for llm()
    const stream = await llm({
      he_thong: systemPrompt,
      nguoi_dung: messages.map((m) => `[${m.role === "user" ? "User" : "Assistant"}]: ${m.text}`).join("\n"),
    });

    // Since llm() doesn't stream natively, we'll implement a chunked response
    // For production, use the streaming API properly with the provider
    const text = typeof stream === "string" ? stream : (stream as { text?: string }).text ?? "";

    return new NextResponse(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("[ai/stream] LLM error:", err);
    return NextResponse.json({ error: "LLM error" }, { status: 502 });
  }
}
