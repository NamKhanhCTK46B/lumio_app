/**
 * POST /api/speech/stt — Speech-to-Text.
 *
 * Nhận audio base64 → transcript.
 * Yêu cầu đăng nhập (RLS). Chạy trên Node.js runtime.
 */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const SttRequestSchema = z.object({
  audioBase64: z.string().min(1, "Audio base64 trống"),
  mimeType: z.enum([
    "audio/linear16",
    "audio/flac",
    "audio/mp3",
    "audio/ogg",
    "audio/webm",
    "audio/wav",
  ]).default("audio/webm"),
  lang: z.string().default("en-US"),
  sampleRateHertz: z.number().int().min(8000).max(48000).default(48000),
  enableWordTimeOffsets: z.boolean().default(false),
});

export async function POST(request: Request) {
  // Xác thực user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  // Parse & validate input
  let input: z.infer<typeof SttRequestSchema>;
  try {
    const body = await request.json();
    input = SttRequestSchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Input không hợp lệ" },
      { status: 400 },
    );
  }

  // Kiểm tra Google Cloud STT
  if (process.env.GOOGLE_CLOUD_STT_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Google Cloud STT chưa bật. Dùng Web Speech API thay thế." },
      { status: 503 },
    );
  }

  try {
    // Dynamic import để tránh bundle vào client
    const { nhanDangGiongNoi } = await import("@/lib/speech/google-stt");
    const result = await nhanDangGiongNoi({
      audioBase64: input.audioBase64,
      mimeType: input.mimeType,
      lang: input.lang,
      sampleRateHertz: input.sampleRateHertz,
      enableWordTimeOffsets: input.enableWordTimeOffsets,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[STT] Lỗi nhận dạng:", err);
    return NextResponse.json(
      { error: "Lỗi nhận dạng giọng nói. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}