"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DangKySchema } from "@/lib/schemas/auth";

/**
 * Đăng ký tài khoản mới qua Supabase Auth.
 *
 * Flow:
 *  1. Zod validate (email format + password complexity + confirm match).
 *  2. Gọi supabase.auth.signUp — Supabase tự bcrypt password (cost 10).
 *  3. Trigger `on_auth_user_created` (migration 02) tự insert hàng `ho_so`
 *     lấy ten_hien_thi từ raw_user_meta_data.full_name.
 *  4. Supabase gửi email xác minh (Mailpit local tại :54324 cho dev).
 *  5. Redirect /signup/cho-xac-minh.
 *
 * Lưu ý chống user enumeration: Supabase tự ẩn lỗi "email đã tồn tại"
 * mặc định — chỉ trả error khi mật khẩu sai format. Vẫn parse message
 * để hiển thị hint thân thiện nếu detect được.
 */
export async function dangKyAction(formData: FormData): Promise<void> {
  const parsed = DangKySchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    password_confirm: formData.get("password_confirm"),
    ten_hien_thi: formData.get("ten_hien_thi"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    redirect(`/signup?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const hdrs = await headers();
  const origin = hdrs.get("origin") ?? "http://localhost:3000";

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Sau khi click link verify, redirect về callback rồi tới /onboarding.
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
      data: { full_name: parsed.data.ten_hien_thi },
    },
  });

  if (error) {
    const friendlyMessage = error.message.toLowerCase().includes("registered")
      ? "Email này đã được đăng ký. Vui lòng đăng nhập."
      : error.message;
    redirect(`/signup?error=${encodeURIComponent(friendlyMessage)}`);
  }

  // Encode email để hiển thị ở trang xác minh ("đã gửi đến <email>").
  redirect(`/signup/cho-xac-minh?email=${encodeURIComponent(parsed.data.email)}`);
}
