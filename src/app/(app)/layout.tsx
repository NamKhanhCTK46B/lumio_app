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
import { Sidebar } from "./_components/sidebar";

/**
 * Layout chung cho route group (app). Check session, fetch ho_so + đọc
 * cookie preferences cho header.
 *
 * `hoSoRepo.layHoSoHienTai` đã được wrap React.cache → page con gọi lại
 * cùng request sẽ dùng kết quả cached, không gây query lặp.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const [supabase, cookieStore] = await Promise.all([
    createClient(),
    cookies(),
  ]);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let hoSo = null;
  try {
    hoSo = await hoSoRepo.layHoSoHienTai(supabase);
  } catch (error) {
    console.error("Ho so fetch failed in app layout", error);
  }

  // Ưu tiên cookie (server đọc trực tiếp), fallback ho_so (lưu lâu dài).
  // Trường hợp user mới login máy khác chưa có cookie → lấy từ DB.
  const current_locale = laLocaleHopLe(
    cookieStore.get(COOKIE_LOCALE)?.value ?? hoSo?.ngon_ngu_giao_dien ?? null,
  );
  const current_theme = laThemeHopLe(
    cookieStore.get(COOKIE_THEME)?.value ?? hoSo?.chu_de_giao_dien ?? null,
  );

  return (
    <div className="flex min-h-screen bg-lm-bg text-lm-fg">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          email={user.email ?? ""}
          ten_hien_thi={hoSo?.ten_hien_thi ?? null}
          url_avatar={hoSo?.url_avatar ?? null}
          current_theme={current_theme}
          current_locale={current_locale}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 sm:px-6 lg:px-7 lg:py-7 md:pb-10">
          {children}
        </main>
      </div>
    </div>
  );
}
