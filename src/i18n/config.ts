/**
 * Cấu hình i18n trung tâm — single source of truth cho locale + theme
 * preference.
 *
 * Approach: KHÔNG dùng URL prefix (`/vi/...`, `/en/...`). Locale lưu
 * trong cookie `lumio_locale` + đồng bộ với `ho_so.ngon_ngu_giao_dien`
 * khi user đã login. Cookie cho phép user chưa login cũng đổi ngôn ngữ.
 *
 * Lý do bỏ URL prefix: ứng dụng có ít route public; URL prefix tăng
 * complexity (matcher proxy, sitemap, canonical) mà không có lợi SEO
 * thực tế cho app sau login.
 */

export const LOCALES = ["vi", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_MAC_DINH: Locale = "vi";

export const THEMES = ["light", "dark", "system"] as const;
export type Theme = (typeof THEMES)[number];
export const THEME_MAC_DINH: Theme = "system";

/** Tên cookie — gom 1 chỗ để Server Action + i18n config dùng cùng key. */
export const COOKIE_LOCALE = "lumio_locale";
export const COOKIE_THEME = "lumio_theme";

/** Nhãn hiển thị cho language switcher (UI fallback nếu thiếu translation). */
export const NHAN_LOCALE: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

export function laLocaleHopLe(value: string | undefined | null): Locale {
  if (value && (LOCALES as readonly string[]).includes(value)) {
    return value as Locale;
  }
  return LOCALE_MAC_DINH;
}

export function laThemeHopLe(value: string | undefined | null): Theme {
  if (value && (THEMES as readonly string[]).includes(value)) {
    return value as Theme;
  }
  return THEME_MAC_DINH;
}
