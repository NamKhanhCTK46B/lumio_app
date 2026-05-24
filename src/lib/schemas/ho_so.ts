import { z } from "zod";

/**
 * Schema cập nhật hồ sơ. Khớp ràng buộc DB ở migration 03:
 *  - ngon_ngu_giao_dien CHECK in ('vi','en')
 *  - chu_de_giao_dien   CHECK in ('light','dark','system')
 *  - phut_moi_ngay      CHECK between 0 and 240
 *
 * `so_dien_thoai` cho phép rỗng (form HTML input để trống = "") — Zod
 * mặc định không chấp nhận string rỗng cho optional → dùng .or(z.literal(""))
 * để pass-through rỗng, sau đó action sẽ convert "" → null trước khi update.
 */
export const CapNhatHoSoSchema = z.object({
  ten_hien_thi: z
    .string()
    .trim()
    .min(1, "Tên hiển thị không được trống")
    .max(64, "Tên hiển thị tối đa 64 ký tự"),
  so_dien_thoai: z
    .string()
    .trim()
    .max(20, "Số điện thoại quá dài")
    .optional()
    .or(z.literal("")),
  ngon_ngu_giao_dien: z.enum(["vi", "en"]),
  chu_de_giao_dien: z.enum(["light", "dark", "system"]),
  phut_moi_ngay: z.coerce
    .number()
    .int("Phải là số nguyên")
    .min(0, "Không thể nhỏ hơn 0")
    .max(240, "Tối đa 240 phút/ngày"),
  mui_gio: z.string().min(1, "Múi giờ không được trống").max(64),
});

export type CapNhatHoSoInput = z.infer<typeof CapNhatHoSoSchema>;
