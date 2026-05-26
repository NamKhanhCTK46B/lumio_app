import type { CauHoiPlacement } from "@/lib/ai/prompts/placement-test";

/**
 * Logic adaptive cho UC5 (placement test) — thuần function, dễ unit test.
 *
 * Quy tắc:
 *  - Bắt đầu ở B1 (mức trung bình phổ biến của user Việt Nam).
 *  - Đúng → tăng 1 level (max C2). Sai → giảm 1 level (min A1).
 *  - Dừng khi: (a) đã đủ >= 8 câu VÀ 3 câu cuối cùng level, hoặc
 *              (b) đã đủ 12 câu (hard cap).
 *  - Kết quả CEFR = mode của 3 câu cuối khi dừng. Confidence = tỉ lệ
 *    đúng ở mức đó.
 */

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const LEVEL_BAT_DAU: CefrLevel = "B1";
export const SO_CAU_TOI_THIEU = 8;
export const SO_CAU_TOI_DA = 12;

export function levelTiepTheo(hien_tai: CefrLevel, dung: boolean): CefrLevel {
  const idx = CEFR_LEVELS.indexOf(hien_tai);
  const next = dung ? Math.min(idx + 1, CEFR_LEVELS.length - 1) : Math.max(idx - 1, 0);
  return CEFR_LEVELS[next]!;
}

type LichSuCau = {
  level: CefrLevel;
  dung: boolean;
};

/** Quyết định có dừng test sau câu vừa trả lời hay không. */
export function nenDung(lich_su: LichSuCau[]): boolean {
  if (lich_su.length >= SO_CAU_TOI_DA) return true;
  if (lich_su.length < SO_CAU_TOI_THIEU) return false;
  const ba_cau_cuoi = lich_su.slice(-3);
  if (ba_cau_cuoi.length < 3) return false;
  return ba_cau_cuoi.every((c) => c.level === ba_cau_cuoi[0]!.level);
}

/** Tính kết quả cuối: CEFR + confidence + điểm thô (%). */
export function tinhKetQua(lich_su: LichSuCau[]): {
  trinh_do: CefrLevel;
  do_tin: number;
  diem_tho: number;
} {
  // Mode level của 3 câu cuối — phản ánh mức ổn định nhất.
  const cuoi = lich_su.slice(-3);
  const dem: Record<string, number> = {};
  cuoi.forEach((c) => {
    dem[c.level] = (dem[c.level] ?? 0) + 1;
  });
  const trinh_do = (Object.entries(dem).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    LEVEL_BAT_DAU) as CefrLevel;

  const o_muc_do = lich_su.filter((c) => c.level === trinh_do);
  const do_tin = o_muc_do.length > 0
    ? o_muc_do.filter((c) => c.dung).length / o_muc_do.length
    : 0.5;

  const so_dung = lich_su.filter((c) => c.dung).length;
  const diem_tho = Math.round((so_dung / lich_su.length) * 100);

  return { trinh_do, do_tin: Math.round(do_tin * 100) / 100, diem_tho };
}

/**
 * Parse JSON cau_hoi từ DB (đã stringify khi insert) thành object.
 * Trả null nếu format hỏng — caller phải xử lý (skip / re-fetch).
 */
export function parseCauHoi(cau_hoi_text: string): CauHoiPlacement | null {
  try {
    const obj = JSON.parse(cau_hoi_text) as CauHoiPlacement;
    return obj;
  } catch {
    return null;
  }
}
