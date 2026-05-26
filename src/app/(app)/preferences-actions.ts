"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  COOKIE_LOCALE,
  COOKIE_THEME,
  laLocaleHopLe,
  laThemeHopLe,
} from "@/i18n/config";

/**
 * Server Actions cho UC17 — đổi theme + ngôn ngữ. Tách khỏi profile
 * actions vì:
 *  - Toggle nhanh từ header phải không-confirm; profile form mới revalidate.
 *  - Toggle phải hoạt động cho cả user chưa login (cookie-only).
 *  - User đã login → đồng bộ luôn vào `ho_so` để các thiết bị khác kế thừa.
 *
 * Pattern dual-storage: cookie ưu tiên (đọc ngay request hiện tại),
 * ho_so là persistent backup. Sync 1 chiều: cookie → ho_so khi login.
 */

const COOKIE_OPTS = {
  // 1 năm — đủ lâu để user không phải đổi lại thường xuyên.
  maxAge: 60 * 60 * 24 * 365,
  // HTTP-only false vì server-side đọc + client (next-themes) cũng cần.
  // KHÔNG chứa thông tin nhạy cảm nên an toàn để JS đọc.
  httpOnly: false,
  sameSite: "lax" as const,
  path: "/",
};

export async function doiNgonNguAction(formData: FormData): Promise<void> {
  const locale = laLocaleHopLe(String(formData.get("locale") ?? ""));
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_LOCALE, locale, COOKIE_OPTS);

  // Best-effort sync sang DB nếu đã login. Không throw nếu fail —
  // toggle UI vẫn quan trọng hơn việc persist.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("ho_so")
      .update({ ngon_ngu_giao_dien: locale })
      .eq("id", user.id);
  }
  revalidatePath("/", "layout");
}

export async function doiThemeAction(formData: FormData): Promise<void> {
  const theme = laThemeHopLe(String(formData.get("theme") ?? ""));
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_THEME, theme, COOKIE_OPTS);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("ho_so")
      .update({ chu_de_giao_dien: theme })
      .eq("id", user.id);
  }
  revalidatePath("/", "layout");
}
