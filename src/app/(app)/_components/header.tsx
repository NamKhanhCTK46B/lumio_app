import Link from "next/link";
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
  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        >
          Lumio
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/notifications">
            <NotificationBell />
          </Link>
          <PreferencesMenu current_theme={current_theme} current_locale={current_locale} />
          <UserMenu email={email} ten_hien_thi={ten_hien_thi} url_avatar={url_avatar} />
        </div>
      </div>
    </header>
  );
}
