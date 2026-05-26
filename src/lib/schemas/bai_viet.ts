import { z } from "zod";

/**
 * Schema UC13 — viết essay.
 *
 * Tách 2 schema: (a) `BatDauBaiVietSchema` chọn đề + tạo bản nháp,
 * (b) `LuuNhapBaiVietSchema` autosave nội dung định kỳ, (c) `NopBaiVietSchema`
 * submit để chấm. Tách giúp validate mỗi action với constraint riêng:
 * autosave cho phép noi_dung rỗng, submit thì bắt min 20 từ để tránh
 * tốn quota LLM chấm bài 1 dòng.
 */

export const BatDauBaiVietSchema = z.object({
  de_bai_id: z.string().uuid().optional(),
  /** Khi user gõ đề tự do (loai_de = tu_do). */
  de_bai_tu_do: z.string().trim().min(10).max(500).optional(),
  loai_de: z.enum(["ielts_task1", "ielts_task2", "email", "tu_do"]),
}).refine((d) => d.de_bai_id || d.de_bai_tu_do, {
  message: "Phải chọn đề từ danh sách hoặc nhập đề tự do",
  path: ["de_bai_id"],
});

export const LuuNhapBaiVietSchema = z.object({
  bai_viet_id: z.string().uuid(),
  noi_dung: z.string().max(20_000),
  thoi_gian_lam_giay: z.coerce.number().int().min(0).optional(),
});

export const NopBaiVietSchema = z.object({
  bai_viet_id: z.string().uuid(),
  noi_dung: z
    .string()
    .trim()
    .refine((s) => s.split(/\s+/).filter(Boolean).length >= 20, {
      message: "Bài viết phải có ít nhất 20 từ để chấm",
    }),
  thoi_gian_lam_giay: z.coerce.number().int().min(0).optional(),
});

export type BatDauBaiVietInput = z.infer<typeof BatDauBaiVietSchema>;
export type LuuNhapBaiVietInput = z.infer<typeof LuuNhapBaiVietSchema>;
export type NopBaiVietInput = z.infer<typeof NopBaiVietSchema>;
