"use client";

import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { ThemeProvider } from "@/lib/theme/provider";

/**
 * Wrap providers Client phải đặt trong RootLayout để các component con dùng
 * i18n và theme context mà không kéo logic browser vào Server Component.
 *
 * - NextIntlClientProvider: cấp messages + locale cho Client Components.
 *   Server Components dùng `getTranslations()` independent provider.
 * - ThemeProvider nội bộ: quản lý `data-theme` sau hydration; script init
 *   trong RootLayout đã set theme trước khi React hydrate.
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
      <ThemeProvider initialTheme={initial_theme}>
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
}
