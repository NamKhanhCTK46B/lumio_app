import { GoogleGenAI } from "@google/genai";

/**
 * Single entrypoint cho mọi LLM call. Feature code KHÔNG được import
 * `@google/genai` trực tiếp — phải qua `llm()` (AGENTS.md quy tắc #4).
 *
 * Lý do: cô lập provider để (a) đổi sang OpenRouter / Anthropic / ... mà
 * không touch feature, (b) tập trung error handling + JSON parsing, (c)
 * fallback deterministic khi thiếu API key cho local dev không có quota.
 */

const MODEL_MAC_DINH = "gemini-3-flash";
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
 * Gọi LLM. Trả về `{ text, json }`. Nếu thiếu GEMINI_API_KEY, throw lỗi
 * rõ ràng — đừng silent fallback gây nhầm lẫn lúc debug.
 */
export async function llm(input: LLMInput): Promise<LLMOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Throw thay vì mock để dev nhận ra ngay khi quên cấu hình .env.local.
    // Local có thể chạy AI Studio free tier — không có lý do skip.
    throw new Error(
      "GEMINI_API_KEY chưa cấu hình trong .env.local — không gọi LLM được",
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: MODEL_MAC_DINH,
    contents: input.nguoi_dung,
    config: {
      systemInstruction: input.he_thong,
      temperature: input.nhiet_do ?? NHIET_DO_MAC_DINH,
      ...(input.yeu_cau_json ? { responseMimeType: "application/json" } : {}),
    },
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
