"use client";

import { ThemeProvider } from "next-themes";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";

/**
 * Wrap providers Client phải đặt trong RootLayout (Server Component không
 * thể trực tiếp dùng next-themes vì cần useEffect set class trên <html>).
 *
 * - NextIntlClientProvider: cấp messages + locale cho Client Components.
 *   Server Components dùng `getTranslations()` independent provider.
 * - ThemeProvider next-themes: quản lý attribute `data-theme` + class
 *   `.dark` trên <html>. `defaultTheme` đến từ cookie, đẩy xuống qua prop.
 */
type Props = {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
  initial_theme: "light" | "dark" | "system";
};

export function Providers({ children, locale, messages, initial_theme }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
      <ThemeProvider
        attribute="data-theme"
        defaultTheme={initial_theme}
        enableSystem
        // Tránh layout flash trong khi script next-themes set theme;
        // RootLayout đã render html với data-theme từ cookie SSR-side,
        // nên disableTransitionOnChange chỉ cho transition khi user toggle.
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
