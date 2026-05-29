/**
 * Google Cloud Text-to-Speech client — server-side only.
 *
 * Dùng @google-cloud/text-to-speech để tạo audio từ text.
 * Hỗ trợ SSML markup cho kiểm soát phát âm.
 */

import { TextToSpeechClient } from "@google-cloud/text-to-speech";

const GOOGLE_CLOUD_ENABLED =
  process.env.GOOGLE_CLOUD_TTS_ENABLED === "true" &&
  process.env.GOOGLE_CLOUD_PROJECT_ID &&
  process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;

let client: TextToSpeechClient | null = null;

/**
 * Lazy-init Google TTS client từ service account JSON.
 */
function getClient(): TextToSpeechClient {
  if (client) return client;

  if (!GOOGLE_CLOUD_ENABLED) {
    throw new Error(
      "Google Cloud TTS chưa bật. Đặt GOOGLE_CLOUD_TTS_ENABLED=true trong .env.local",
    );
  }

  const credentials = JSON.parse(
    process.env.GOOGLE_CLOUD_CREDENTIALS_JSON ?? "{}",
  );

  client = new TextToSpeechClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials,
  });

  return client;
}

export type TtsServerInput = {
  /** Nội dung cần đọc. */
  text: string;
  /** Ngôn ngữ (BCP-47, mặc định en-US). */
  lang?: string;
  /** SSML markup thay vì plain text. */
  ssml?: boolean;
  /** Tốc độ 0.25–4.0, mặc định 1. */
  speakingRate?: number;
  /** Cao độ -20.0–20.0 Hz, mặc định 0. */
  pitch?: number;
  /** Giọng đọc name. Nếu bỏ qua tự chọn. */
  voiceName?: string;
};

export type TtsServerOutput = {
  /** Audio content as base64 string. */
  audioBase64: string;
  /** Mime type của audio trả về. */
  mimeType: string;
};

const VOICE_MAC_DINH_EN = "en-US-Studio-O";
const VOICE_MAC_DINH_VI = "vi-VN-Standard-A";

/**
 * Chuyển text thành audio qua Google Cloud TTS.
 * Throw nếu Google Cloud TTS chưa enable.
 */
export async function chuyenThanhAudio(
  input: TtsServerInput,
): Promise<TtsServerOutput> {
  const { text, lang = "en-US", ssml = false, speakingRate = 1, pitch = 0, voiceName } = input;

  const clientTTS = getClient();

  const voiceNameFinal = voiceName ?? (
    lang.startsWith("vi") ? VOICE_MAC_DINH_VI : VOICE_MAC_DINH_EN
  );

  const request = {
    input: ssml
      ? { ssml: text }
      : { text },
    voice: {
      languageCode: lang,
      name: voiceNameFinal,
    },
    audioConfig: {
      audioEncoding: "MP3" as const,
      speakingRate,
      pitch,
    },
  };

  const [response] = await clientTTS.synthesizeSpeech(request);

  const audioBase64 = response.audioContent
    ? Buffer.from(response.audioContent as Uint8Array).toString("base64")
    : "";

  return { audioBase64, mimeType: "audio/mp3" };
}

/**
 * Lấy danh sách voice khả dụng cho ngôn ngữ.
 */
export async function danhSachVoice(
  lang?: string,
): Promise<Array<{ name: string; languageCode: string; ssmlGender: string }>> {
  const clientTTS = getClient();

  const [response] = await clientTTS.listVoices({ languageCode: lang });

  return (
    response.voices?.map((v) => ({
      name: v.name ?? "",
      languageCode: v.languageCodes?.[0] ?? "",
      ssmlGender: String(v.ssmlGender ?? "SSML_VOICE_GENDER_UNSPECIFIED"),
    })) ?? []
  );
}

/**
 * Kiểm tra Google Cloud TTS có được bật và credentials hợp lệ không.
 */
export async function kiemTraGoogleTts(): Promise<{
  enabled: boolean;
  projectId: string | null;
  error?: string;
}> {
  if (process.env.GOOGLE_CLOUD_TTS_ENABLED !== "true") {
    return { enabled: false, projectId: null };
  }

  if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    return { enabled: false, projectId: null, error: "Thiếu GOOGLE_CLOUD_PROJECT_ID hoặc GOOGLE_CLOUD_CREDENTIALS_JSON" };
  }

  try {
    const clientTTS = getClient();
    await clientTTS.listVoices({ languageCode: "en-US" });
    return { enabled: true, projectId: process.env.GOOGLE_CLOUD_PROJECT_ID };
  } catch (err) {
    return {
      enabled: true,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      error: err instanceof Error ? err.message : "Lỗi không xác định",
    };
  }
}