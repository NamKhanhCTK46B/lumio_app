import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { COOKIE_LOCALE, laLocaleHopLe } from "./config";

/**
 * Cấu hình next-intl request — chạy mỗi request, đọc cookie locale,
 * load file messages tương ứng. Nếu cookie thiếu/sai, fallback `vi`.
 *
 * Vì lưu locale trong cookie thay vì URL, không cần `[locale]` segment.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = laLocaleHopLe(cookieStore.get(COOKIE_LOCALE)?.value);
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return { locale, messages };
});
