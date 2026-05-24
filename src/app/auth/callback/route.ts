import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Callback xử lý ?code= từ OAuth, magic-link, email verify, password reset.
 *
 * Flow:
 *   1. Exchange code lấy session (Supabase tự set cookie HTTP-only).
 *   2. Quyết định redirect đích:
 *      - `next` whitelist (vd. /reset-password) → đi thẳng, bỏ qua onboarding.
 *      - Chưa onboard → /onboarding.
 *      - Đã onboard → next param hoặc /dashboard.
 */

// Các route bypass onboarding check — flow đặc biệt cần đến ngay
// không cần check trạng thái onboard (vd. user đang reset password
// vẫn vào được trang reset dù chưa onboard).
const SKIP_ONBOARDING_PATHS = new Set(["/reset-password"]);

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin),
    );
  }

  // Flow đặc biệt (reset password) đi thẳng, không cần check onboard.
  if (SKIP_ONBOARDING_PATHS.has(next)) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  const { data: hoSo } = await supabase
    .from("ho_so")
    .select("hoan_tat_onboard_luc")
    .maybeSingle();

  const target = hoSo?.hoan_tat_onboard_luc ? next : "/onboarding";
  return NextResponse.redirect(new URL(target, url.origin));
}
