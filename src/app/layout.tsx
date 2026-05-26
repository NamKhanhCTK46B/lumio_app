import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getMessages } from "next-intl/server";
import { Providers } from "./providers";
import {
  COOKIE_LOCALE,
  COOKIE_THEME,
  laLocaleHopLe,
  laThemeHopLe,
} from "@/i18n/config";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lumio",
  description: "Học tiếng Anh cá nhân hoá với AI",
};

/**
 * Root layout đọc cookie locale + theme ngay SSR để tránh flash:
 *  - `<html lang>` và `data-theme` set đúng từ server render đầu tiên.
 *  - Messages load qua `getMessages()` (next-intl đọc cookie cùng cách).
 *
 * Nếu cookie thiếu, fallback `vi` + `system` — sẽ flicker 1 frame nếu
 * OS dark mode, chấp nhận được cho user chưa cấu hình lần đầu.
 */
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const locale = laLocaleHopLe(cookieStore.get(COOKIE_LOCALE)?.value);
  const theme = laThemeHopLe(cookieStore.get(COOKIE_THEME)?.value);
  const messages = await getMessages();

  // `data-theme` set trước hydration để CSS vars apply ngay. Nếu user
  // chọn "system", để rỗng và next-themes tự gán từ prefers-color-scheme.
  const themeAttr = theme === "system" ? undefined : theme;

  return (
    <html
      lang={locale}
      data-theme={themeAttr}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        <Providers
          locale={locale}
          messages={messages as Record<string, unknown>}
          initial_theme={theme}
        >
          {children}
        </Providers>
      </body>
    </html>
  );
}
