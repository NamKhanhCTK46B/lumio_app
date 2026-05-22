---
name: prompt
description: Tạo / sửa prompt LLM trong lib/ai/prompts/ — có Zod schema response + delimiter chống injection
model: claude-opus-4-7
thinking: medium
---

# /prompt <feature>

Tạo hoặc cập nhật một prompt template cho LLM trong `src/lib/ai/prompts/<feature>.ts`.

## Cấu trúc bắt buộc

```ts
// src/lib/ai/prompts/writing-score.ts
import { z } from 'zod';
import type { Message } from '@/lib/ai/provider';

// 1. Schema response — KHÔNG TIN LLM, parse mọi output qua Zod
export const WritingScoreResponseSchema = z.object({
  overallBand: z.number().min(0).max(9),
  scores: z.object({
    taskAchievement: z.number().min(0).max(9),
    coherence:       z.number().min(0).max(9),
    lexical:         z.number().min(0).max(9),
    grammar:         z.number().min(0).max(9),
  }),
  annotations: z.array(z.object({
    startOffset: z.number().int(),
    endOffset:   z.number().int(),
    category:    z.enum(['grammar','lexical','coherence','task','spelling']),
    severity:    z.enum(['minor','major']),
    suggestion:  z.string(),
    explanation: z.string(),
  })),
  summary: z.string(),
});
export type WritingScoreResponse = z.infer<typeof WritingScoreResponseSchema>;

// 2. Prompt builder — function pure, không side effect
export function writingScorePrompt(
  essay: string,
  taskType: 'task1' | 'task2',
): Message[] {
  const rubric = taskType === 'task2' ? IELTS_TASK2_RUBRIC : IELTS_TASK1_RUBRIC;

  return [
    {
      role: 'system',
      content: [
        'Bạn là examiner IELTS có kinh nghiệm.',
        'Chấm bài theo 4 tiêu chí, mỗi tiêu chí 0.0–9.0, bước 0.5.',
        'Trả về JSON đúng schema. Không thêm text ngoài JSON.',
        '',
        'Rubric:',
        rubric,
      ].join('\n'),
    },
    {
      role: 'user',
      content: [
        '<essay>',
        essay,
        '</essay>',
        '',
        'Trả về JSON theo schema này:',
        '{ overallBand, scores: {...}, annotations: [...], summary }',
      ].join('\n'),
    },
  ];
}
```

## Quy tắc thiết kế prompt

### Chống injection
- **Luôn** wrap user input trong delimiter (`<essay>...</essay>`, `<transcript>...</transcript>`).
- **Không bao giờ** trộn user input vào `role: 'system'`.
- Nếu user input có thể chứa `</essay>` → escape hoặc đổi delimiter unique.

### JSON output
- Yêu cầu rõ: "Trả về JSON đúng schema. Không thêm text ngoài JSON."
- Parse qua Zod, **không** `JSON.parse(...) as MyType`.
- Nếu Zod fail → log + retry 1 lần với prompt strict hơn, sau đó fallback OpenRouter.

### Tiếng Việt cho phản hồi user
- LLM trả `explanation` / `summary` bằng tiếng Việt nếu user `ui_language='vi'`.
- Truyền `locale` vào prompt builder làm tham số.

### Đo cost
- Comment trong file ước tính token: `// ~1800 input + 400 output, gemini-3.1-pro-preview`.
- Test với 3-5 essay mẫu trước khi merge.

## File liên quan

- Schema response **xuất** từ `prompts/<feature>.ts`, **import** trong action.
- Mọi action AI:
  ```ts
  const raw = await llm().chat(writingScorePrompt(essay, 'task2'));
  const parsed = WritingScoreResponseSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) { ... }
  ```

## Checklist

- [ ] Schema Zod cho response (export type)
- [ ] System role không chứa user input
- [ ] User input có delimiter
- [ ] Yêu cầu JSON output rõ ràng
- [ ] Comment ước tính token + model dùng
- [ ] 3 unit test với fixture (`*.test.ts`) — input → expected schema valid

## Anti-pattern

- ❌ `JSON.parse(raw) as MyType` — không validate
- ❌ `system: \`You are... Essay: ${essay}\`` — injection
- ❌ Prompt không yêu cầu JSON → LLM trả markdown → parse fail
- ❌ Không có fallback khi Zod fail
