import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { llmStream } from "@/lib/ai/provider";
import { roleplaySystemPrompt, roleplayUserPrompt } from "@/lib/ai/prompts/speaking";
import { speakingRepo } from "@/lib/repositories/speaking.repo";

export const runtime = "nodejs";

const RoleplaySchema = z.object({
  type: z.literal("roleplay"),
  sessionId: z.string().uuid(),
  userTranscript: z.string().trim().min(1).max(2000),
});

/**
 * Stream LLM response cho roleplay và lưu lượt nói vào DB.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = RoleplaySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    return handleRoleplay(parsed.data);
  } catch (err) {
    console.error("[ai/stream] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function handleRoleplay(input: z.infer<typeof RoleplaySchema>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const phien = await speakingRepo.layPhienNoi(supabase, input.sessionId);
  if (!phien || phien.nguoi_dung_id !== user.id) {
    return NextResponse.json({ error: "Phiên không hợp lệ" }, { status: 403 });
  }

  const nhanVat = await speakingRepo.layNhanVat(supabase, phien.nhan_vat_id);
  if (!nhanVat) {
    return NextResponse.json({ error: "Nhân vật không tồn tại" }, { status: 404 });
  }

  const history = await speakingRepo.layLichSuPhien(supabase, input.sessionId);
  const historyText = history
    .map((turn) => `[${turn.vai === "nguoi_dung" ? "User" : "Assistant"}]: ${turn.noi_dung}`)
    .join("\n");

  await speakingRepo.themLuotNoi(
    supabase,
    input.sessionId,
    "nguoi_dung",
    input.userTranscript,
  );

  try {
    const stream = await llmStream({
      he_thong: roleplaySystemPrompt({
        characterName: nhanVat.ten,
        characterPrompt: nhanVat.prompt_nhan_vat,
        cefrToiThieu: nhanVat.cefr_toi_thieu,
      }),
      nguoi_dung: `${historyText}\n\n${roleplayUserPrompt(input.userTranscript)}`,
    });

    const { stream: responseStream, fullText } = teeTextStream(stream);
    void fullText
      .then((text) => speakingRepo.themLuotNoi(supabase, input.sessionId, "ai", text))
      .catch((err) => console.error("[ai/stream] Save AI turn error:", err));

    return new Response(responseStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[ai/stream] LLM error:", err);
    return NextResponse.json({ error: "LLM error" }, { status: 502 });
  }
}

function teeTextStream(source: ReadableStream<Uint8Array>) {
  const [clientStream, saveStream] = source.tee();
  const fullText = streamToString(saveStream);
  return { stream: clientStream, fullText };
}

async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  result += decoder.decode();
  return result;
}
