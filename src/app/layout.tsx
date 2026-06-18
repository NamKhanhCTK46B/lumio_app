import type { Metadata } from "next";
import { cookies } from "next/headers";
import { getMessages } from "next-intl/server";
import Script from "next/script";
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

const INIT_THEME_SCRIPT = `
(function () {
  try {
    var cookieTheme = document.cookie
      .split("; ")
      .find(function (row) { return row.indexOf("${COOKIE_THEME}=") === 0; })
      ?.split("=")[1];
    var savedTheme = cookieTheme ? decodeURIComponent(cookieTheme) : "system";
    var theme = savedTheme === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : savedTheme;
    if (theme !== "light" && theme !== "dark") theme = "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
})();
`;

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
  // chọn "system", script init sẽ gán theo prefers-color-scheme trước hydrate.
  const themeAttr = theme === "system" ? undefined : theme;

  return (
    <html
      lang={locale}
      data-theme={themeAttr}
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <Script
        id="lumio-init-theme"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: INIT_THEME_SCRIPT }}
      />
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
