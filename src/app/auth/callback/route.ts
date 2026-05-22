import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth + magic-link callback. Provider redirect về đây với ?code=...
 * Đổi code lấy session (set HTTP-only cookie), sau đó:
 *   - nếu chưa onboard → /onboarding
 *   - đã onboard → /dashboard (hoặc `next` param nếu hợp lệ)
 */
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

  // Kiểm tra trạng thái onboard từ ho_so.
  const { data: hoSo } = await supabase
    .from("ho_so")
    .select("hoan_tat_onboard_luc")
    .maybeSingle();

  const target = hoSo?.hoan_tat_onboard_luc ? next : "/onboarding";
  return NextResponse.redirect(new URL(target, url.origin));
}
