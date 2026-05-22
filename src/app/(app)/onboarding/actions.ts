"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Đánh dấu user đã hoàn tất onboarding. Placeholder cho UC1 thật sau này
 * (UC1 cần khảo sát mục tiêu + placement test trước khi set timestamp).
 *
 * Sau khi update, redirect về /dashboard.
 */
export async function hoanTatOnboardAction(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Trường hợp này không nên xảy ra vì layout (app) đã redirect /login
    // khi chưa auth. Throw để Next hiển thị error boundary thay vì silent.
    throw new Error("Chưa đăng nhập");
  }

  const { error } = await supabase
    .from("ho_so")
    .update({ hoan_tat_onboard_luc: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    throw new Error(`Không cập nhật được hồ sơ: ${error.message}`);
  }

  redirect("/dashboard");
}
