"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { baiVietRepo } from "@/lib/repositories/bai_viet.repo";
import {
  BatDauBaiVietSchema,
  LuuNhapBaiVietSchema,
  NopBaiVietSchema,
} from "@/lib/schemas/bai_viet";
import { chamEssay } from "@/lib/ai/prompts/essay-feedback";

/**
 * UC13 + UC14 actions: chọn đề → tạo nháp → autosave → nộp → chấm điểm.
 *
 * Tách 3 action thay vì 1 monolithic để mỗi action có Zod schema riêng,
 * dễ debug + dễ thay đổi rate-limit policy riêng cho từng bước (chấm
 * điểm tốn LLM hơn autosave nên cần rate-limit chặt hơn — sẽ thêm sau).
 */

/** Tạo bản nháp từ đề chọn (catalog) hoặc đề tự do. Redirect tới editor. */
export async function taoNhapAction(formData: FormData): Promise<void> {
  const parsed = BatDauBaiVietSchema.safeParse({
    de_bai_id: formData.get("de_bai_id") || undefined,
    de_bai_tu_do: formData.get("de_bai_tu_do") || undefined,
    loai_de: formData.get("loai_de"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    redirect(`/write?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Chưa đăng nhập");

  let de_bai_snapshot = parsed.data.de_bai_tu_do ?? "";
  if (parsed.data.de_bai_id) {
    const de = await baiVietRepo.layDe(supabase, parsed.data.de_bai_id);
    if (!de) {
      redirect("/write?error=Đề không tồn tại");
    } else {
      de_bai_snapshot = de.de_bai;
    }
  }

  const id = await baiVietRepo.taoNhap(supabase, {
    userId: user.id,
    de_bai_id: parsed.data.de_bai_id ?? null,
    loai_de: parsed.data.loai_de,
    de_bai_snapshot,
  });

  redirect(`/write/${id}`);
}

/**
 * Autosave nội dung bản nháp. Gọi từ client mỗi ~10s khi user gõ.
 * Không redirect — trả Promise<void> để client xử lý lỗi qua try/catch
 * trên formAction wrapper (hoặc bỏ qua, autosave fail không critical).
 */
export async function autoSaveAction(formData: FormData): Promise<void> {
  const parsed = LuuNhapBaiVietSchema.safeParse({
    bai_viet_id: formData.get("bai_viet_id"),
    noi_dung: formData.get("noi_dung"),
    thoi_gian_lam_giay: formData.get("thoi_gian_lam_giay"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await baiVietRepo.luuNhap(
    supabase,
    parsed.data.bai_viet_id,
    parsed.data.noi_dung,
    parsed.data.thoi_gian_lam_giay,
  );
  revalidatePath(`/write/${parsed.data.bai_viet_id}`);
}

/**
 * Submit bài viết để LLM chấm. Đồng bộ — user thấy spinner 5-15s.
 * Thay vì stream (UC13 sequence mô tả), MVP gọi blocking + redirect
 * tới /result hiển thị điểm. Stream là tối ưu UX, không phải feature
 * core — bổ sung sau bằng API route + SSE nếu cần.
 */
export async function nopBaiAction(formData: FormData): Promise<void> {
  const parsed = NopBaiVietSchema.safeParse({
    bai_viet_id: formData.get("bai_viet_id"),
    noi_dung: formData.get("noi_dung"),
    thoi_gian_lam_giay: formData.get("thoi_gian_lam_giay"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    const id = String(formData.get("bai_viet_id") ?? "");
    redirect(`/write/${id}?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const bai = await baiVietRepo.layBai(supabase, parsed.data.bai_viet_id);
  if (!bai) {
    redirect("/write?error=Bài viết không tồn tại");
  }

  // Lưu nội dung trước khi gọi LLM — nếu LLM lỗi, user không mất bài.
  await baiVietRepo.luuNhap(
    supabase,
    parsed.data.bai_viet_id,
    parsed.data.noi_dung,
    parsed.data.thoi_gian_lam_giay,
  );

  try {
    const ketQua = await chamEssay({
      loai_de: bai.loai_de,
      de_bai: bai.de_bai_snapshot,
      noi_dung: parsed.data.noi_dung,
    });
    await baiVietRepo.luuKetQuaCham(
      supabase,
      parsed.data.bai_viet_id,
      parsed.data.noi_dung,
      ketQua,
    );
  } catch (err) {
    console.error("[essay] LLM chấm lỗi:", err);
    redirect(
      `/write/${parsed.data.bai_viet_id}?error=${encodeURIComponent("Không chấm được, vui lòng thử lại")}`,
    );
  }

  redirect(`/write/${parsed.data.bai_viet_id}/result`);
}
