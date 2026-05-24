"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DatLaiMatKhauSchema } from "@/lib/schemas/auth";

/**
 * Đặt lại mật khẩu sau khi user click link reset từ email.
 *
 * Tiền điều kiện: session "recovery" đã được set bởi /auth/callback
 * (Supabase exchange code → cookie). Nếu chưa có session, updateUser sẽ fail.
 *
 * Sau khi đổi mật khẩu thành công, force signOut để user phải login
 * lại với password mới — đảm bảo session cũ (nếu có) bị thu hồi.
 */
export async function datLaiMatKhauAction(formData: FormData): Promise<void> {
  const parsed = DatLaiMatKhauSchema.safeParse({
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Mật khẩu không hợp lệ";
    redirect(`/reset-password?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);
  }

  // Buộc đăng nhập lại để session cũ bị thu hồi (best-practice reset flow).
  await supabase.auth.signOut();
  redirect("/login?info=" + encodeURIComponent("Đặt lại mật khẩu thành công. Vui lòng đăng nhập."));
}
