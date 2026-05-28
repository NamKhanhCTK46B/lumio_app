import {
  GoogleGenAI,
  type GenerateContentConfig,
} from "@google/genai";

/**
 * Single entrypoint cho mọi LLM call. Feature code KHÔNG được import
 * `@google/genai` trực tiếp — phải qua `llm()` hoặc `llmStream()` (AGENTS.md quy tắc #4).
 *
 * Lý do: cô lập provider để (a) đổi sang OpenRouter / Anthropic / ... mà
 * không touch feature, (b) tập trung error handling + JSON parsing, (c)
 * fallback deterministic khi thiếu API key cho local dev không có quota.
 */

const MODEL_MAC_DINH = "gemini-3-flash";
const MODEL_STREAM = "gemini-3-flash";
const NHIET_DO_MAC_DINH = 0.7;

type LLMInput = {
  /** System instruction (vai trò + format đầu ra). */
  he_thong: string;
  /** User content. Dùng delimiter `<...>` cho input user untrusted. */
  nguoi_dung: string;
  /** 0 = deterministic, 1 = sáng tạo. Default 0.7. */
  nhiet_do?: number;
  /** Bắt buộc trả JSON object. Provider sẽ set responseMimeType. */
  yeu_cau_json?: boolean;
};

type LLMOutput = {
  text: string;
  /** Đã parse nếu yeu_cau_json=true. Trả null nếu parse fail (caller xử lý). */
  json: unknown;
};

/**
 * Build config object — systemInstruction phải nằm trong `config` theo
 * `GenerateContentParameters` của `@google/genai` v2.x.
 */
function taoConfig(input: LLMInput): GenerateContentConfig {
  return {
    systemInstruction: input.he_thong,
    temperature: input.nhiet_do ?? NHIET_DO_MAC_DINH,
    ...(input.yeu_cau_json ? { responseMimeType: "application/json" } : {}),
  };
}

/** Kiểm tra API key, throw rõ ràng nếu thiếu. */
function kiemTraApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY chưa cấu hình trong .env.local — không gọi LLM được",
    );
  }
  return apiKey;
}

/**
 * Gọi LLM. Trả về `{ text, json }`. Nếu thiếu GEMINI_API_KEY, throw lỗi
 * rõ ràng — đừng silent fallback gây nhầm lẫn lúc debug.
 */
export async function llm(input: LLMInput): Promise<LLMOutput> {
  const apiKey = kiemTraApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL_MAC_DINH,
    contents: input.nguoi_dung,
    config: taoConfig(input),
  });

  const text = response.text ?? "";
  let json: unknown = null;

  if (input.yeu_cau_json && text) {
    try {
      json = JSON.parse(text);
    } catch {
      // Một số model trả prose kèm JSON — thử trích JSON object đầu tiên.
      const matched = text.match(/\{[\s\S]*\}/);
      if (matched) {
        try {
          json = JSON.parse(matched[0]);
        } catch {
          json = null;
        }
      }
    }
  }

  return { text, json };
}

/**
 * LLM streaming — trả về Web ReadableStream để server gửi SSE về client.
 *
 * Dùng cho /api/ai/stream để AI reply hiện từng token thay vì đợi
 * toàn bộ response (cải thiện UX đáng kể cho speaking chat).
 *
 * @example
 * const stream = await llmStream({ he_thong, nguoi_dung });
 * return new Response(stream, { headers: { "Content-Type": "text/plain" } });
 */
export async function llmStream(
  input: LLMInput,
): Promise<ReadableStream<Uint8Array>> {
  const apiKey = kiemTraApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContentStream({
    model: MODEL_STREAM,
    contents: input.nguoi_dung,
    config: taoConfig(input),
  });

  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of response) {
          const text = chunk.text ?? "";
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } finally {
        controller.close();
      }
    },
    cancel() {
      // Agent đã hủy — không làm gì thêm.
    },
  });
}
