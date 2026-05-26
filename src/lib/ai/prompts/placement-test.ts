import { z } from "zod";
import { llm } from "@/lib/ai/provider";

/**
 * Prompt builder cho UC5 — Placement test sinh câu hỏi adaptive.
 *
 * Quyết định thiết kế:
 *  - 1 câu hỏi 1 lần gọi (không batch) → adaptive: câu kế phụ thuộc kết
 *    quả câu trước. Đơn giản hơn parser batch + dễ resume nếu user rớt mạng.
 *  - Yêu cầu JSON để parse chắc chắn — tránh regex fragile.
 *  - Câu hỏi luôn dạng 4 lựa chọn (A/B/C/D) → grading deterministic
 *    bằng so sánh chuỗi, không cần LLM chấm.
 */

export const CauHoiPlacementSchema = z.object({
  cau_hoi: z.string().min(1),
  lua_chon: z.array(z.string().min(1)).length(4),
  /** Index 0–3 trong lua_chon. */
  dap_an: z.number().int().min(0).max(3),
  /** CEFR mục tiêu mà câu này đo. */
  trinh_do: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
  /** Giải thích ngắn vì sao đáp án đúng — hiện cho user sau khi trả lời. */
  giai_thich: z.string().min(1),
});

export type CauHoiPlacement = z.infer<typeof CauHoiPlacementSchema>;

type SinhCauHoiInput = {
  trinh_do_du_kien: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  /** Đề các câu đã hỏi — tránh LLM lặp lại. */
  cau_da_hoi: string[];
};

/**
 * Sinh 1 câu hỏi trắc nghiệm tiếng Anh ở trình độ cho trước.
 * Throw nếu LLM trả format không hợp lệ — caller log + retry hoặc fallback.
 */
export async function sinhCauHoiPlacement(
  input: SinhCauHoiInput,
): Promise<CauHoiPlacement> {
  const heThong = `Bạn là chuyên gia đánh giá tiếng Anh theo CEFR.
Sinh CHÍNH XÁC 1 câu hỏi trắc nghiệm tiếng Anh ở trình độ ${input.trinh_do_du_kien}.

Loại câu hỏi xoay vòng giữa: ngữ pháp (chia thì, giới từ), từ vựng (chọn từ
phù hợp ngữ cảnh), reading comprehension (đoạn ngắn 1–3 câu + câu hỏi).

Tránh trùng nội dung các câu đã hỏi (liệt kê bên dưới). Trả JSON đúng schema:
{
  "cau_hoi": "string — đề bài bằng tiếng Anh, có thể có đoạn context",
  "lua_chon": ["A...", "B...", "C...", "D..."],
  "dap_an": 0|1|2|3,
  "trinh_do": "${input.trinh_do_du_kien}",
  "giai_thich": "1-2 câu tiếng Việt giải thích tại sao đáp án đúng"
}`;

  const nguoiDung =
    input.cau_da_hoi.length === 0
      ? "Sinh câu hỏi đầu tiên."
      : `Các câu đã hỏi (đừng lặp):\n${input.cau_da_hoi.map((c, i) => `${i + 1}. ${c}`).join("\n")}`;

  const { json } = await llm({
    he_thong: heThong,
    nguoi_dung: nguoiDung,
    nhiet_do: 0.8,
    yeu_cau_json: true,
  });

  const parsed = CauHoiPlacementSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      `LLM trả format không hợp lệ: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  return parsed.data;
}
