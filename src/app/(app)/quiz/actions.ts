"use server";

import { createClient } from "@/lib/supabase/server";
import { llm } from "@/lib/ai/provider";
import { vocabRepo } from "@/lib/repositories/vocab.repo";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const SinhQuizSchema = z.object({
  nguon_id: z.string().uuid().optional(),
  loai: z.enum(["grammar", "vocab"]).default("vocab"),
  so_cau: z.number().int().min(3).max(20).default(5),
});

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

/**
 * UC11 — Sinh quiz bằng AI từ từ vựng đã lưu của user.
 *
 * Luồng:
 * 1. Lấy từ vựng từ nguồn (hoặc tất cả từ gần đây)
 * 2. Gọi LLM sinh câu hỏi
 * 3. Lưu vào cau_hoi_tu_vung
 * 4. Trả về câu hỏi cho client
 */
export async function sinhQuizAction(
  raw: unknown,
): Promise<
  | { ok: true; data: { cau_hoi: QuizQuestion[]; quiz_id: string } }
  | { ok: false; error: string }
> {
  const parsed = SinhQuizSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { nguon_id, loai, so_cau } = parsed.data;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Chưa đăng nhập" };
    }

    let tuVungs: string[] = [];

    if (nguon_id) {
      const tuList = await vocabRepo.layTuTheoNguon(supabase, user.id, nguon_id);
      tuVungs = tuList.map((t) => t.tu_goc);
    }

    if (tuVungs.length === 0) {
      const tuList = await vocabRepo.layTuGanNhat(supabase, user.id, 20);
      tuVungs = tuList.map((t) => t.tu_goc);
    }

    if (tuVungs.length < 3) {
      return { ok: false, error: "Cần ít nhất 3 từ vựng để sinh quiz" };
    }

    const vocabList = tuVungs.slice(0, 20).join(", ");

    const heThong =
      loai === "vocab"
        ? `Bạn là giáo viên IELTS/TOEFL. Sinh câu hỏi trắc nghiệm từ danh sách từ vựng.
Mỗi câu hỏi: 1 câu context + chọn nghĩa đúng trong 4 lựa chọn.
Đảm bảo 4 lựa chọn khác nhau và có nghĩa gần nhau (confusers).
Trả JSON array: [{ "question": "...", "options": ["A","B","C","D"], "correctIndex": 0-3, "explanation": "..." }]
Luôn đúng 1 đáp án.`
        : `Bạn là giáo viên ngữ pháp tiếng Anh. Sinh câu hỏi trắc nghiệm ngữ pháp.
Trả JSON array: [{ "question": "...", "options": ["A","B","C","D"], "correctIndex": 0-3, "explanation": "..." }]
Luôn đúng 1 đáp án.`;

    const { json } = await llm({
      he_thong: heThong,
      nguoi_dung: `Sinh ${so_cau} câu hỏi từ từ vựng: ${vocabList}`,
      nhiet_do: 0.7,
      yeu_cau_json: true,
    });

    const cauHoiRaw = json as Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
    }> | null;

    if (!Array.isArray(cauHoiRaw) || cauHoiRaw.length === 0) {
      return { ok: false, error: "AI không sinh được câu hỏi. Thử lại." };
    }

    let quizId = "";

    if (nguon_id) {
      const { data } = await supabase
        .from("cau_hoi_tu_vung")
        .insert({
          nguoi_dung_id: user.id,
          nguon_id: nguon_id,
          loai_cau_hoi: loai,
          cau_hoi: cauHoiRaw[0]?.question ?? "",
          dap_an_dung: cauHoiRaw[0]?.options[cauHoiRaw[0]?.correctIndex ?? 0] ?? "",
        })
        .select("id")
        .single();

      quizId = data?.id ?? "";
    }

    const cauHoi: QuizQuestion[] = cauHoiRaw.map((q, i) => ({
      id: i + 1,
      question: q.question,
      options: q.options.slice(0, 4),
      correctIndex: q.correctIndex,
      explanation: q.explanation,
    }));

    revalidateTag(`vocab:nguoi_dung:${user.id}`, "default");

    return { ok: true, data: { cau_hoi: cauHoi, quiz_id: quizId } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi sinh quiz";
    return { ok: false, error: msg };
  }
}
