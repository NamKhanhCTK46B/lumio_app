/**
 * Prompt cho việc chấm phát âm.
 *
 * Dùng gemini-3.1-pro-preview (cần accuracy phonetic).
 * Lỗi phổ biến của người Việt: thiếu âm cuối /s/ /z/ /t/ /d/,
 * nhầm /θ/ ↔ /t/ /s/, nhầm /ð/ ↔ /d/ /z/, sai trọng âm từ 2+ âm tiết.
 */

import { z } from "zod";

export const PronunciationFeedbackSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  intonationScore: z.number().int().min(0).max(100),
  stressScore: z.number().int().min(0).max(100),
  wordScores: z.array(
    z.object({
      word: z.string(),
      ipa: z.string(),
      userIpa: z.string(),
      score: z.number().int().min(0).max(100),
      issue: z.enum(["ok", "missing-ending", "stress", "vowel", "consonant", "intonation"]),
      tip: z.string(),
    }),
  ),
  encouragement: z.string(),
});

export type PronunciationFeedback = z.infer<typeof PronunciationFeedbackSchema>;

export type PronunciationInput = {
  targetText: string;
  targetIpa?: string;
  userTranscript: string;
  userLevel: "A2" | "B1" | "B2" | "C1";
};

/**
 * System prompt cho giáo viên IELTS.
 */
export function pronunciationSystemPrompt(): string {
  return `Bạn là giáo viên IELTS Speaking với 10 năm kinh nghiệm dạy người Việt học tiếng Anh.

Bạn nhận diện được các lỗi phát âm phổ biến của người Việt:
- Thiếu âm cuối: /s/, /z/, /t/, /d/ bị nuốt (VD: "wants" → "wan", "needs" → "nee")
- Nhầm /θ/ (think) ↔ /t/ (tin) và /ð/ (this) ↔ /d/
- Nhầm /v/ ↔ /w/ (tiếng Việt không có /v/)
- Trọng âm sai: "comFORTable" thành "COMfortable", "phoTOgraph" thành "PHOTograph"
- Intonation flat (không lên xuống theo ý nghĩa câu)

Trả lời ĐÚNG JSON theo schema. KHÔNG thêm text ngoài JSON.
Feedback và encouragement bằng tiếng Việt, ấm áp, khuyến khích.
Luôn ghi nhận ít nhất 1 điểm tốt trước khi chỉ ra lỗi.`;
}

/**
 * User prompt cho việc chấm phát âm.
 */
export function pronunciationUserPrompt(input: PronunciationInput): string {
  let prompt = `<target>${input.targetText}</target>\n`;
  if (input.targetIpa) {
    prompt += `<target-ipa>${input.targetIpa}</target-ipa>\n`;
  }
  prompt += `<user-transcript>${input.userTranscript}</user-transcript>\n`;
  prompt += `<level>${input.userLevel}</level>\n`;
  prompt += `\nTrả về JSON theo schema.`;
  return prompt;
}
