import { z } from "zod";

export const GrammarFeedbackSchema = z.object({
  corrected: z.string().min(1),
  explanation: z.string().min(1),
});

export type GrammarFeedback = z.infer<typeof GrammarFeedbackSchema>;

export function grammarSystemPrompt(): string {
  return `Bạn là giáo viên ngữ pháp tiếng Anh cho người Việt.
Nhiệm vụ: kiểm tra một câu tiếng Anh, sửa lỗi ngữ pháp nếu có, và giải thích ngắn gọn bằng tiếng Việt.
Nếu câu đã đúng tự nhiên, trả corrected = "OK".
Trả lời ĐÚNG JSON theo schema: { "corrected": string, "explanation": string }.
Không thêm text ngoài JSON.`;
}

export function grammarUserPrompt(sentence: string): string {
  return `<sentence>${sentence}</sentence>\n\nTrả về JSON theo schema.`;
}
