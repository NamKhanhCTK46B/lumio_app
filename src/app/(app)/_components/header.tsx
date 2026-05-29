"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";
import { PreferencesMenu } from "./preferences-menu";
import { NotificationBell } from "./notification-bell";
import type { Locale, Theme } from "@/i18n/config";

/**
 * Header chung cho mọi page trong (app). Server Component — nhận
 * thông tin user + preferences qua prop từ (app)/layout (đã fetch sẵn).
 */
type Props = {
  email: string;
  ten_hien_thi: string | null;
  url_avatar: string | null;
  current_theme: Theme;
  current_locale: Locale;
};

export function Header({
  email,
  ten_hien_thi,
  url_avatar,
  current_theme,
  current_locale,
}: Props) {
  const pathname = usePathname();
  const meta = layMeta(pathname);

  return (
    <header className="border-b border-lm-border bg-lm-bg">
      <div className="flex items-center gap-4 px-4 py-3 sm:px-6 lg:px-7">
        <div className="flex flex-col gap-0.5">
          {meta.breadcrumb && (
            <div className="text-2xs font-semibold uppercase tracking-[0.08em] text-lm-fg-subtle">
              {meta.breadcrumb}
            </div>
          )}
          <h1 className="text-lg font-semibold text-lm-fg">{meta.title}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/notifications" className="inline-flex">
            <NotificationBell />
          </Link>
          <PreferencesMenu
            current_theme={current_theme}
            current_locale={current_locale}
          />
          <UserMenu
            email={email}
            ten_hien_thi={ten_hien_thi}
            url_avatar={url_avatar}
          />
        </div>
      </div>
    </header>
  );
}

const NAV_META = [
  { prefix: "/dashboard", title: "Tổng quan", breadcrumb: "HOME" },
  { prefix: "/read", title: "Đọc & học từ", breadcrumb: "CONTENT" },
  { prefix: "/speak", title: "Luyện nói với AI", breadcrumb: "PRACTICE" },
  { prefix: "/vocab", title: "Sổ từ của bạn", breadcrumb: "VOCABULARY" },
  { prefix: "/write", title: "Luyện viết", breadcrumb: "WRITING" },
  { prefix: "/settings", title: "Cài đặt", breadcrumb: "SETTINGS" },
];

function layMeta(pathname: string) {
  const found = NAV_META.find(
    (item) =>
      pathname === item.prefix || pathname.startsWith(`${item.prefix}/`),
  );
  return found ?? { title: "Lumio", breadcrumb: "HOME" };
}
