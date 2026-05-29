/**
 * POST /api/speech/tts — Text-to-Speech.
 *
 * Nhận text → audio mp3 (base64).
 * Yêu cầu đăng nhập (RLS). Chạy trên Node.js runtime.
 */

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const TtsRequestSchema = z.object({
  text: z.string().min(1, "Nội dung trống").max(5000, "Nội dung quá dài (tối đa 5000 ký tự)"),
  lang: z.string().default("en-US"),
  ssml: z.boolean().default(false),
  speakingRate: z.number().min(0.25).max(4).default(1),
  pitch: z.number().min(-20).max(20).default(0),
  voiceName: z.string().optional(),
});

export async function POST(request: Request) {
  // Xác thực user
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  // Parse & validate input
  let input: z.infer<typeof TtsRequestSchema>;
  try {
    const body = await request.json();
    input = TtsRequestSchema.parse(body);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Input không hợp lệ" },
      { status: 400 },
    );
  }

  // Kiểm tra Google Cloud TTS
  if (process.env.GOOGLE_CLOUD_TTS_ENABLED !== "true") {
    return NextResponse.json(
      { error: "Google Cloud TTS chưa bật. Dùng Web Speech API thay thế." },
      { status: 503 },
    );
  }

  try {
    // Dynamic import để tránh bundle vào client
    const { chuyenThanhAudio } = await import("@/lib/speech/google-tts");
    const result = await chuyenThanhAudio({
      text: input.text,
      lang: input.lang,
      ssml: input.ssml,
      speakingRate: input.speakingRate,
      pitch: input.pitch,
      voiceName: input.voiceName,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[TTS] Lỗi tổng hợp:", err);
    return NextResponse.json(
      { error: "Lỗi tổng hợp giọng nói. Vui lòng thử lại." },
      { status: 500 },
    );
  }
}