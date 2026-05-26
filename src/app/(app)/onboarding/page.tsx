import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { HoSo } from "@/types/supabase";

/**
 * Hub onboarding — không render UI, chỉ route user đến bước phù hợp:
 *  1. Chưa làm placement test → /onboarding/test
 *  2. Đã làm test, chưa đặt mục tiêu → /onboarding/goals
 *  3. Đã đặt mục tiêu, chưa hoàn tất → /onboarding/preferences
 *  4. Đã hoàn tất → /dashboard (proxy bình thường cho phép vào)
 *
 * Cách này cho phép user reload `/onboarding` mà luôn tới bước hợp lý.
 */
export default async function OnboardingHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: hoSo } = await supabase
    .from("ho_so")
    .select("hoan_tat_onboard_luc, trinh_do_cefr")
    .maybeSingle() as { data: HoSo | null; error: unknown };

  if (hoSo?.hoan_tat_onboard_luc) {
    redirect("/dashboard");
  }

  // trinh_do_cefr được set khi placement test hoàn tất (UC5 action).
  if (!hoSo?.trinh_do_cefr) {
    redirect("/onboarding/test");
  }

  const { count } = await supabase
    .from("muc_tieu_nd")
    .select("id", { count: "exact", head: true });

  if (!count || count === 0) {
    redirect("/onboarding/goals");
  }

  redirect("/onboarding/preferences");
}
