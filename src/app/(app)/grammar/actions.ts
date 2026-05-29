"use server";

import { createClient } from "@/lib/supabase/server";
import { llm } from "@/lib/ai/provider";
import {
  GrammarFeedbackSchema,
  grammarSystemPrompt,
  grammarUserPrompt,
  type GrammarFeedback,
} from "@/lib/ai/prompts/grammar-feedback";
import { z } from "zod";

const KiemTraGrammarSchema = z.object({
  cau: z.string().trim().min(1, "Câu không được rỗng").max(500),
});

export type GrammarResult = GrammarFeedback;

/**
 * UC ngữ pháp — kiểm tra và sửa lỗi một câu tiếng Anh.
 */
export async function kiemTraGrammarAction(
  raw: unknown,
): Promise<{ ok: true; data: GrammarResult } | { ok: false; error: string }> {
  const parsed = KiemTraGrammarSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" };
  }

  const { cau } = parsed.data;

  try {
    const response = await llm({
      he_thong: grammarSystemPrompt(),
      nguoi_dung: grammarUserPrompt(cau),
      yeu_cau_json: true,
    });

    const data = GrammarFeedbackSchema.safeParse(response.json);
    if (!data.success) {
      return { ok: false, error: "AI trả kết quả không đúng định dạng. Thử lại." };
    }

    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      await supabase.from("phien_hoc").insert({
        nguoi_dung_id: authData.user.id,
        loai_hoat_dong: "quiz",
        bat_dau_luc: new Date().toISOString(),
        ket_thuc_luc: new Date().toISOString(),
        thoi_luong_giay: 0,
        chi_so: { loai: "grammar", cau_ky_tu: cau.length },
      });
    }

    return { ok: true, data: data.data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi gọi AI";
    return { ok: false, error: msg };
  }
}
