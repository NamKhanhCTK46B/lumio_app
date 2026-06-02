"use client";

import { useTransition } from "react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Languages, Monitor, Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { doiNgonNguAction, doiThemeAction } from "../preferences-actions";
import { LOCALES, NHAN_LOCALE, type Locale, type Theme } from "@/i18n/config";

/**
 * UC17 — Dropdown menu cho phép user toggle theme (3 lựa chọn) + locale
 * (2 lựa chọn). Mỗi nút submit form với Server Action tương ứng.
 *
 * Trạng thái mở/đóng được quản lý client-side; click-outside để đóng.
 * Vì là Client Component nhưng action vẫn Server Action — form-action
 * pattern không cần fetch / state quản lý phức tạp.
 */

type Props = {
  current_theme: Theme;
  current_locale: Locale;
};

const THEME_OPTIONS: Array<{
  value: Theme;
  Icon: typeof Sun;
  key: "theme_light" | "theme_dark" | "theme_system";
}> = [
  { value: "light", Icon: Sun, key: "theme_light" },
  { value: "dark", Icon: Moon, key: "theme_dark" },
  { value: "system", Icon: Monitor, key: "theme_system" },
];

export function ThemeToggle({ current_theme }: { current_theme: Theme }) {
  const t = useTranslations("settings");
  const { setTheme } = useTheme();
  const [activeTheme, setActiveTheme] = useState(current_theme);
  const [pending, startTransition] = useTransition();

  function doiThemeNhanh(value: Theme) {
    setActiveTheme(value);
    setTheme(value);
    const formData = new FormData();
    formData.set("theme", value);
    startTransition(() => {
      void doiThemeAction(formData);
    });
  }

  return (
    <div className="hidden rounded-lg border border-lm-border bg-lm-bg-elev-1 p-0.5 sm:flex">
      {THEME_OPTIONS.map(({ value, Icon, key }) => (
        <button
          key={value}
          type="button"
          aria-label={t(key)}
          title={t(key)}
          disabled={pending}
          onClick={() => doiThemeNhanh(value)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition disabled:opacity-60 ${
            activeTheme === value
              ? "bg-lm-primary-soft text-lm-primary-ink"
              : "text-lm-fg-muted hover:bg-lm-bg-muted hover:text-lm-fg"
          }`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

export function PreferencesMenu({ current_theme, current_locale }: Props) {
  const t = useTranslations("settings");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click-outside: đóng menu khi click ra ngoài. Tiết kiệm hơn là dùng
  // Radix Popover (chưa cần animations / collision detection cho menu nhỏ).
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Tuỳ chọn giao diện"
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-lm-fg-muted transition hover:bg-lm-bg-muted hover:text-lm-fg"
      >
        <Languages className="h-4 w-4" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-md border border-lm-border bg-lm-bg-elev-1 p-2 shadow-(--lm-shadow-pop)"
        >
          <p className="px-2 pt-1 text-xs font-medium text-lm-fg-subtle">
            {t("theme")}
          </p>
          <div className="mt-1 grid grid-cols-3 gap-1">
            {THEME_OPTIONS.map(({ value, Icon, key }) => (
              <form key={value} action={doiThemeAction}>
                <input type="hidden" name="theme" value={value} />
                <button
                  type="submit"
                  className={`flex w-full flex-col items-center gap-1 rounded-md px-2 py-2 text-xs transition ${
                    current_theme === value
                      ? "bg-lm-primary-soft text-lm-primary-ink"
                      : "text-lm-fg-muted hover:bg-lm-bg-muted hover:text-lm-fg"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t(key)}
                </button>
              </form>
            ))}
          </div>

          <p className="mt-3 px-2 text-xs font-medium text-lm-fg-subtle">
            {t("ngon_ngu")}
          </p>
          <div className="mt-1 grid grid-cols-2 gap-1">
            {LOCALES.map((loc) => (
              <form key={loc} action={doiNgonNguAction}>
                <input type="hidden" name="locale" value={loc} />
                <button
                  type="submit"
                  className={`w-full rounded-md px-2 py-2 text-xs transition ${
                    current_locale === loc
                      ? "bg-lm-primary-soft text-lm-primary-ink"
                      : "text-lm-fg-muted hover:bg-lm-bg-muted hover:text-lm-fg"
                  }`}
                >
                  {NHAN_LOCALE[loc]}
                </button>
              </form>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
