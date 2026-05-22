---
description: Tạo / cập nhật LLM prompt trong src/lib/ai/prompts/ với Zod response schema + XML delimiter chống injection.
argument-hint: [feature-slug]
allowed-tools: Read Grep Edit Write Bash(pnpm exec *)
model: claude-opus-4-7
effort: medium
---

# /prompt `$ARGUMENTS`

Tạo / cập nhật prompt LLM trong `src/lib/ai/prompts/$ARGUMENTS.ts`. Trọng tâm Lumio: **luyện đọc / phát âm / giao tiếp**.

## Cấu trúc chuẩn (canonical example: `pronunciation-feedback`)

```ts
// src/lib/ai/prompts/pronunciation-feedback.ts
import { z } from "zod";
import type { Message } from "@/lib/ai/provider";

// ──────────────────────────────────────────────────────────────
// 1. Response schema — KHÔNG TIN LLM. Parse mọi output qua Zod.
// ──────────────────────────────────────────────────────────────
export const PronunciationFeedbackResponseSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  intonationScore: z.number().int().min(0).max(100),
  stressScore: z.number().int().min(0).max(100),
  wordScores: z.array(
    z.object({
      word: z.string(),
      ipa: z.string(),         // IPA chuẩn
      userIpa: z.string(),      // IPA ước lượng từ STT
      score: z.number().int().min(0).max(100),
      issue: z.enum([
        "ok",
        "missing-ending",
        "stress",
        "vowel",
        "consonant",
        "intonation",
      ]),
      tip: z.string(),          // tiếng Việt, ngắn, hành động cụ thể
    }),
  ),
  encouragement: z.string(),    // tiếng Việt, ấm áp, 1-2 câu
});
export type PronunciationFeedbackResponse = z.infer<
  typeof PronunciationFeedbackResponseSchema
>;

// ──────────────────────────────────────────────────────────────
// 2. Prompt builder — function pure, không side-effect.
//    ~600 input + 400 output tokens với gemini-3.1-pro-preview.
// ──────────────────────────────────────────────────────────────
export function pronunciationFeedbackPrompt(args: {
  targetText: string;
  targetIpa?: string;
  userTranscript: string;
  userLevel: "A2" | "B1" | "B2" | "C1";
}): Message[] {
  return [
    {
      role: "system",
      content: [
        "Bạn là giáo viên IELTS Speaking 10 năm kinh nghiệm dạy người Việt.",
        "Bạn nhận diện được lỗi phát âm phổ biến của người Việt:",
        "- Thiếu âm cuối /s/ /z/ /t/ /d/ (vd. 'wants' → 'want').",
        "- Nhầm /θ/ ↔ /t/ /s/ (vd. 'think' → 'tink' / 'sink').",
        "- Nhầm /ð/ ↔ /d/ /z/ (vd. 'this' → 'dis' / 'zis').",
        "- Sai trọng âm từ 2+ âm tiết (vd. 'comFORTable' đúng, 'COMfortable' sai).",
        "- Intonation flat — không lên xuống tự nhiên.",
        "",
        "Quy tắc chấm:",
        "- Cụ thể về kỹ thuật (IPA + tên lỗi).",
        "- Ấm áp về cảm xúc — luôn ghi nhận 1 điểm tốt trước khi chỉ lỗi lớn nhất.",
        "- KHÔNG dùng từ 'tệ', 'kém'. Dùng 'có thể tốt hơn', 'thử lại'.",
        "",
        "Trả về JSON đúng schema. KHÔNG thêm text ngoài JSON.",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        "<target>",
        args.targetText,
        "</target>",
        args.targetIpa ? `<target-ipa>${args.targetIpa}</target-ipa>` : "",
        "<user-transcript>",
        args.userTranscript,
        "</user-transcript>",
        `<level>${args.userLevel}</level>`,
        "",
        "Chấm phát âm theo schema. Output JSON.",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];
}
```

## Cấu trúc bắt buộc cho mọi prompt Lumio

1. **Schema Zod** export — response.
2. **Prompt builder** function pure → `Message[]`.
3. **System role** = persona giáo viên / examiner / partner roleplay. **KHÔNG** chứa user input.
4. **XML delimiter** wrap user input:
   - `<target>...</target>` — câu mục tiêu (Speaking, Reader).
   - `<user-transcript>...</user-transcript>` — STT output.
   - `<conversation-history>...</conversation-history>` — Roleplay (UC14).
   - `<essay>...</essay>` — Writing (UC13).
   - `<level>A2|B1|B2|C1</level>` — trình độ user.
5. **Output language**: `feedback`/`tip`/`encouragement` **tiếng Việt** (user là người Việt). `ipa` + `issue` + tên kỹ thuật **tiếng Anh**.
6. **JSON yêu cầu** rõ ràng: "Trả về JSON đúng schema. KHÔNG thêm text ngoài JSON."
7. **Comment ước tính token**: `// ~600 input + 400 output, gemini-3.1-pro-preview`.

## Runtime rules (Server Action gọi prompt)

```ts
const raw = await llm().chat(pronunciationFeedbackPrompt({ ... }));
const parsed = PronunciationFeedbackResponseSchema.safeParse(JSON.parse(raw));

if (!parsed.success) {
  // Retry 1 lần: prefill assistant message bằng "{" để buộc JSON.
  const retry = await llm().chat([
    ...prompt,
    { role: "assistant", content: "{" },
  ]);
  const retryParsed = PronunciationFeedbackResponseSchema.safeParse(
    JSON.parse("{" + retry),
  );
  if (!retryParsed.success) {
    // Fallback OpenRouter (deepseek/deepseek-chat-v3).
    return llm("openrouter").chat(prompt);
  }
}
```

## Chọn model theo task

| Task | Model | Lý do |
|---|---|---|
| Pronunciation feedback (phonetic chi tiết) | `gemini-3.1-pro-preview` | Cần accuracy IPA + nhận diện lỗi nhỏ |
| Conversation roleplay turn | `gemini-3-flash` | Cần tốc độ < 1s + cost thấp |
| Tooltip nghĩa từ / IPA single word | `gemini-3.1-flash-lite` | Cost-efficient, low latency |
| Essay scoring IELTS (UC13) | `gemini-3.1-pro-preview` | Rubric phức tạp, reasoning đa chiều |
| Embedding vocab/content | `gemini-embedding-2-preview` (1536-d) | Mới nhất, multimodal |

## Unit test bắt buộc (`*.test.ts`)

3 fixture tối thiểu:

1. **Happy path** — user nói đúng hoàn toàn → score > 90, không có `issue: 'missing-ending'`.
2. **Trọng âm sai** — "comFORTable" target, user nói "COMfortable" → có `issue: 'stress'`.
3. **Thiếu âm cuối** — "She wants coffee" target, user nói "She want coffee" → có `issue: 'missing-ending'` cho từ "wants".

Mỗi test assert:
- `parsed.success === true` (Zod valid).
- `encouragement.length > 0` (luôn có khuyến khích).
- `wordScores.length > 0`.

## Anti-pattern

- ❌ `JSON.parse(raw) as MyType` — không validate, crash runtime khi LLM trả format lạ.
- ❌ `system: \`You are... Essay: ${essay}\`` — prompt injection. Luôn wrap user input ở `user` role với XML.
- ❌ Prompt không yêu cầu JSON → LLM trả markdown code fence → parse fail.
- ❌ Không có fallback khi Zod fail → user thấy lỗi 500.
- ❌ Chấm khắt khe gây nản (score < 50 với câu chỉ sai 1 âm) → vi phạm voice Lumio "ấm áp, khuyến khích".
- ❌ `encouragement` để rỗng hoặc generic ("Cố lên!") → phải reference vào điểm cụ thể user vừa làm tốt.
