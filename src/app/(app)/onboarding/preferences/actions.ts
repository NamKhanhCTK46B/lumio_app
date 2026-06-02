"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { COOKIE_OPTS, COOKIE_THEME } from "@/i18n/config";

/**
 * UC6 (cuối onboarding) — lưu sở thích cơ bản + đánh dấu hoàn tất onboard.
 * Tách action riêng (không tái sử dụng capNhatHoSoAction ở settings) vì
 * onboarding chỉ thu hẹp 3 trường + cần set `hoan_tat_onboard_luc`.
 */

const SoThichOnboardSchema = z.object({
  phut_moi_ngay: z.coerce.number().int().min(0).max(240),
  mui_gio: z.string().trim().min(1).max(64),
  chu_de_giao_dien: z.enum(["light", "dark", "system"]),
});

export async function luuSoThichVaHoanTatAction(formData: FormData): Promise<void> {
  const parsed = SoThichOnboardSchema.safeParse({
    phut_moi_ngay: formData.get("phut_moi_ngay"),
    mui_gio: formData.get("mui_gio"),
    chu_de_giao_dien: formData.get("chu_de_giao_dien"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    redirect(`/onboarding/preferences?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Chưa đăng nhập");

  const { error } = await supabase
    .from("ho_so")
    .update({
      ...parsed.data,
      hoan_tat_onboard_luc: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw new Error(`Không cập nhật được hồ sơ: ${error.message}`);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_THEME, parsed.data.chu_de_giao_dien, COOKIE_OPTS);

  redirect("/dashboard");
}
