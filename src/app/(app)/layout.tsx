import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hoSoRepo } from "@/lib/repositories/ho_so.repo";
import {
  COOKIE_LOCALE,
  COOKIE_THEME,
  laLocaleHopLe,
  laThemeHopLe,
} from "@/i18n/config";
import { Header } from "./_components/header";

/**
 * Layout chung cho route group (app). Check session, fetch ho_so + đọc
 * cookie preferences cho header.
 *
 * `hoSoRepo.layHoSoHienTai` đã được wrap React.cache → page con gọi lại
 * cùng request sẽ dùng kết quả cached, không gây query lặp.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const [supabase, cookieStore] = await Promise.all([createClient(), cookies()]);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const hoSo = await hoSoRepo.layHoSoHienTai(supabase);

  // Ưu tiên cookie (server đọc trực tiếp), fallback ho_so (lưu lâu dài).
  // Trường hợp user mới login máy khác chưa có cookie → lấy từ DB.
  const current_locale = laLocaleHopLe(
    cookieStore.get(COOKIE_LOCALE)?.value ?? hoSo?.ngon_ngu_giao_dien ?? null,
  );
  const current_theme = laThemeHopLe(
    cookieStore.get(COOKIE_THEME)?.value ?? hoSo?.chu_de_giao_dien ?? null,
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Header
        email={user.email ?? ""}
        ten_hien_thi={hoSo?.ten_hien_thi ?? null}
        url_avatar={hoSo?.url_avatar ?? null}
        current_theme={current_theme}
        current_locale={current_locale}
      />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
