"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mucTieuRepo } from "@/lib/repositories/muc_tieu.repo";
import { DatMucTieuSchema, LOAI_MUC_TIEU_VALUES, type LoaiMucTieuValue } from "@/lib/schemas/muc_tieu";

/**
 * UC6 — lưu mục tiêu user chọn, sang bước tiếp theo (/onboarding/preferences).
 *
 * Form gửi `muc_tieu` dưới dạng nhiều input checkbox cùng tên — đọc bằng
 * `formData.getAll("muc_tieu")` rồi filter giá trị hợp lệ (defense-in-depth
 * dù client đã restrict — Server Action có thể bị gọi trực tiếp).
 */
export async function luuMucTieuAction(formData: FormData): Promise<void> {
  const muc_tieu_raw = formData.getAll("muc_tieu").map(String);
  const muc_tieu = muc_tieu_raw.filter((v): v is LoaiMucTieuValue =>
    (LOAI_MUC_TIEU_VALUES as readonly string[]).includes(v),
  );

  const parsed = DatMucTieuSchema.safeParse({
    muc_tieu,
    muc_tieu_chinh: formData.get("muc_tieu_chinh"),
    diem_muc_tieu: formData.get("diem_muc_tieu"),
    han_chot: formData.get("han_chot"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    redirect(`/onboarding/goals?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Chưa đăng nhập");

  await mucTieuRepo.luu(supabase, {
    userId: user.id,
    muc_tieu: parsed.data.muc_tieu,
    muc_tieu_chinh: parsed.data.muc_tieu_chinh,
    diem_muc_tieu: parsed.data.diem_muc_tieu,
    han_chot: parsed.data.han_chot,
  });

  redirect("/onboarding/preferences");
}
