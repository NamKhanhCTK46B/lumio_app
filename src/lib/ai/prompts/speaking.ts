/**
 * Prompt cho việc luyện nói — hội thoại roleplay.
 *
 * Dùng cho /api/ai/stream khi user nói một lượt trong roleplay.
 */

export type SpeakingTurn = {
  vai: "nguoi_dung" | "ai";
  noi_dung: string;
};

export type RoleplayInput = {
  characterName: string;
  characterPrompt: string;
  cefrToiThieu: string | null;
  scenario: string | null;
  history: SpeakingTurn[];
  userTranscript: string;
  userLevel: string;
};

/**
 * Build system prompt cho nhân vật.
 */
export function roleplaySystemPrompt(input: Pick<RoleplayInput, "characterName" | "characterPrompt" | "cefrToiThieu" | "scenario">): string {
  let prompt = `Bạn đóng vai "${input.characterName}".`;
  if (input.cefrToiThieu) {
    prompt += ` Nói ở mức ${input.cefrToiThieu} trở lên.`;
  }
  prompt += `\n\n${input.characterPrompt}`;
  if (input.scenario) {
    prompt += `\n\nBối cảnh luyện nói hiện tại:\n<topic>${input.scenario}</topic>`;
  }
  prompt += `\n\nQuy tắc quan trọng:
- Nói tự nhiên như người bản ngữ, không đọc script.
- Phản hồi ngắn gọn (1-3 câu).
- Bám sát bối cảnh trong <topic> và dẫn dắt hội thoại đúng vai nhân vật.
- Không đưa ra đáp án đúng sai — chỉ phản hồi tự nhiên như một người thật.
- KHÔNG bao gồm phần sửa lỗi trong tin nhắn chính.`;

  return prompt;
}

/**
 * Build lịch sử hội thoại cho LLM.
 */
export function roleplayHistoryToMessages(history: SpeakingTurn[]): Array<{ role: "user" | "model"; text: string }> {
  return history.map((turn) => ({
    role: turn.vai === "nguoi_dung" ? "user" : "model",
    text: turn.noi_dung,
  }));
}

/**
 * System prompt phụ — chỉ phản hồi hội thoại, không có feedback.
 */
export function roleplayOnlyPrompt(characterName: string): string {
  return `Bạn đóng vai ${characterName}. Phản hồi tự nhiên, ngắn gọn (1-3 câu). Không sửa lỗi. Không giải thích.`;
}

/**
 * User prompt cho lượt nói.
 */
export function roleplayUserPrompt(userTranscript: string): string {
  return `<user-turn>${userTranscript}</user-turn>`;
}
