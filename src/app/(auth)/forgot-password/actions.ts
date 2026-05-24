"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { QuenMatKhauSchema } from "@/lib/schemas/auth";

/**
 * Gửi email reset password.
 *
 * Bảo mật: KHÔNG báo email có tồn tại hay không — luôn redirect "đã gửi"
 * dù email có trong DB hay không. Chống user enumeration attack.
 *
 * Supabase tự rate-limit (mặc định 3 request/giờ/email).
 */
export async function quenMatKhauAction(formData: FormData): Promise<void> {
  const parsed = QuenMatKhauSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Email không hợp lệ";
    redirect(`/forgot-password?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const hdrs = await headers();
  const origin = hdrs.get("origin") ?? "http://localhost:3000";

  // Không await error: dù email không tồn tại, ta vẫn redirect "đã gửi"
  // để không leak thông tin email nào có trong DB.
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });

  redirect("/forgot-password/da-gui");
}
