"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DangNhapEmailSchema } from "@/lib/schemas/auth";
import { getSiteUrl } from "@/lib/utils";

/**
 * Bắt đầu OAuth flow với provider (Google hoặc Facebook).
 * Supabase trả về URL redirect, server-side gọi `redirect()` đẩy browser sang.
 *
 * @param provider — 'google' | 'facebook' (literal, không nhận giá trị khác)
 */
export async function dangNhapOAuthAction(provider: "google" | "facebook") {
  const supabase = await createClient();
  const siteUrl = getSiteUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      // PKCE flow đã được @supabase/ssr xử lý, không cần code_challenge thủ công.
    },
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (data?.url) {
    redirect(data.url);
  }

  return { ok: false as const, error: "Không nhận được URL redirect từ provider." };
}

/**
 * Đăng nhập email/password qua Supabase Auth (GoTrue).
 * Supabase tự verify bcrypt hash + set session cookie qua @supabase/ssr.
 *
 * Sau khi login:
 *  - hoan_tat_onboard_luc != NULL → /dashboard
 *  - chưa onboard → /onboarding
 */
export async function dangNhapEmailAction(formData: FormData): Promise<void> {
  const parsed = DangNhapEmailSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    redirect(`/login?error=${encodeURIComponent(firstError)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Email hoặc mật khẩu không đúng")}`);
  }

  const { data: hoSo } = await supabase
    .from("ho_so")
    .select("hoan_tat_onboard_luc")
    .maybeSingle();

  redirect(hoSo?.hoan_tat_onboard_luc ? "/dashboard" : "/onboarding");
}
