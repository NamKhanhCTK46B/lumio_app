/**
 * Google Cloud Speech-to-Text client — server-side only.
 *
 * Dùng @google-cloud/speech để nhận dạng giọng nói từ audio gửi lên server.
 * Phải chạy trong Node.js runtime (không phải edge).
 */

import { SpeechClient, protos } from "@google-cloud/speech";

type AudioEncoding = protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding;

const GOOGLE_CLOUD_ENABLED =
  process.env.GOOGLE_CLOUD_STT_ENABLED === "true" &&
  process.env.GOOGLE_CLOUD_PROJECT_ID &&
  process.env.GOOGLE_CLOUD_CREDENTIALS_JSON;

let client: SpeechClient | null = null;

/**
 * Lazy-init Google Speech client từ service account JSON.
 * Đọc credentials từ env variable (không đọc file trong repo).
 */
function getClient(): SpeechClient {
  if (client) return client;

  if (!GOOGLE_CLOUD_ENABLED) {
    throw new Error(
      "Google Cloud STT chưa bật. Đặt GOOGLE_CLOUD_STT_ENABLED=true trong .env.local",
    );
  }

  const credentials = JSON.parse(
    process.env.GOOGLE_CLOUD_CREDENTIALS_JSON ?? "{}",
  );

  client = new SpeechClient({
    projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    credentials,
  });

  return client;
}

const MIME_TO_ENCODING: Record<string, AudioEncoding | undefined> = {
  "audio/linear16": 1,    // LINEAR16
  "audio/flac": 2,        // FLAC
  "audio/mp3": 8,         // MP3
  "audio/wav": 1,         // LINEAR16
  "audio/webm": 9,         // WEBM_OPUS
  "audio/ogg": 6,         // OGG_OPUS
};

export type SttServerInput = {
  /** Audio content as base64 string. */
  audioBase64: string;
  /** Mime type: 'audio/linear16', 'audio/flac', 'audio/mp3', ... */
  mimeType: string;
  /** Ngôn ngữ (BCP-47, mặc định en-US). */
  lang?: string;
  /** Tần số mẫu (mặc định 16000 Hz). */
  sampleRateHertz?: number;
  /** Bật tự động đánh dấu từ (word time offset). */
  enableWordTimeOffsets?: boolean;
};

export type SttServerOutput = {
  transcript: string;
  confidence: number;
  words?: Array<{ word: string; startMs: number; endMs: number }>;
};

/**
 * Nhận dạng giọng nói từ audio base64.
 * Throw nếu Google Cloud STT chưa enable.
 */
export async function nhanDangGiongNoi(
  input: SttServerInput,
): Promise<SttServerOutput> {
  const { audioBase64, mimeType, lang = "en-US", sampleRateHertz = 16000, enableWordTimeOffsets = false } = input;

  const clientSTT = getClient();
  const encoding = MIME_TO_ENCODING[mimeType] ?? 0; // ENCODING_UNSPECIFIED

  const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
    config: {
      encoding: encoding as AudioEncoding,
      languageCode: lang,
      sampleRateHertz,
      enableWordTimeOffsets,
      model: "latest_long",
      useEnhanced: true,
    },
    audio: {
      content: audioBase64,
    },
  };

  const [response] = await clientSTT.recognize(request);

  const transcription =
    response.results
      ?.map((r) => r.alternatives?.[0]?.transcript ?? "")
      .join(" ") ?? "";

  const confidence =
    response.results?.[0]?.alternatives?.[0]?.confidence ?? 0;

  let words: SttServerOutput["words"] | undefined;
  const firstWords = response.results?.[0]?.alternatives?.[0]?.words;
  if (enableWordTimeOffsets && firstWords) {
    words = firstWords.map((w) => ({
      word: w.word ?? "",
      startMs: Number(w.startTime?.seconds ?? 0) * 1000 + (w.startTime?.nanos ?? 0) / 1_000_000,
      endMs: Number(w.endTime?.seconds ?? 0) * 1000 + (w.endTime?.nanos ?? 0) / 1_000_000,
    }));
  }

  return { transcript: transcription.trim(), confidence, words };
}

/**
 * Kiểm tra Google Cloud STT có được bật và credentials hợp lệ không.
 */
export async function kiemTraGoogleStt(): Promise<{
  enabled: boolean;
  projectId: string | null;
  error?: string;
}> {
  if (process.env.GOOGLE_CLOUD_STT_ENABLED !== "true") {
    return { enabled: false, projectId: null };
  }

  if (!process.env.GOOGLE_CLOUD_PROJECT_ID || !process.env.GOOGLE_CLOUD_CREDENTIALS_JSON) {
    return { enabled: false, projectId: null, error: "Thiếu GOOGLE_CLOUD_PROJECT_ID hoặc GOOGLE_CLOUD_CREDENTIALS_JSON" };
  }

  try {
    getClient();
    return { enabled: true, projectId: process.env.GOOGLE_CLOUD_PROJECT_ID };
  } catch (err) {
    return {
      enabled: true,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      error: err instanceof Error ? err.message : "Lỗi không xác định",
    };
  }
}