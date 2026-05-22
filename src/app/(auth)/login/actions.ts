"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/**
 * Bắt đầu OAuth flow với provider (Google hoặc Facebook).
 * Supabase trả về URL redirect, server-side gọi `redirect()` đẩy browser sang.
 *
 * @param provider — 'google' | 'facebook' (literal, không nhận giá trị khác)
 */
export async function dangNhapOAuthAction(provider: "google" | "facebook") {
  const supabase = await createClient();
  const hdrs = await headers();
  const origin = hdrs.get("origin") ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
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
