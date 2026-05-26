import { z } from "zod";

/**
 * Schema UC6 — đặt mục tiêu sau khi tạo tài khoản.
 *
 * Mỗi user chọn 1..N mục tiêu, đánh dấu 1 mục là chính. DB có unique
 * partial index đảm bảo chỉ 1 mục tiêu chính per user — schema chỉ check
 * tối thiểu 1 mục được chọn để form không submit rỗng.
 */
export const LOAI_MUC_TIEU_VALUES = [
  "ielts",
  "toeic",
  "giao_tiep",
  "cong_viec",
  "du_lich",
  "phim_anh",
  "hoc_thuat",
  "khac",
] as const;

export const LoaiMucTieuSchema = z.enum(LOAI_MUC_TIEU_VALUES);
export type LoaiMucTieuValue = (typeof LOAI_MUC_TIEU_VALUES)[number];

export const DatMucTieuSchema = z.object({
  muc_tieu: z
    .array(LoaiMucTieuSchema)
    .min(1, "Chọn ít nhất 1 mục tiêu")
    .max(LOAI_MUC_TIEU_VALUES.length),
  /** Phải nằm trong `muc_tieu`. Kiểm bằng refine. */
  muc_tieu_chinh: LoaiMucTieuSchema,
  /** Điểm mục tiêu IELTS / TOEIC; bỏ trống nếu không liên quan. */
  diem_muc_tieu: z.coerce
    .number()
    .min(0)
    .max(990)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  /** ISO date YYYY-MM-DD. */
  han_chot: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Định dạng ngày YYYY-MM-DD")
    .optional()
    .or(z.literal("").transform(() => undefined)),
}).refine((d) => d.muc_tieu.includes(d.muc_tieu_chinh), {
  path: ["muc_tieu_chinh"],
  message: "Mục tiêu chính phải nằm trong danh sách đã chọn",
});

export type DatMucTieuInput = z.infer<typeof DatMucTieuSchema>;

/**
 * Nhãn hiển thị cho từng loại mục tiêu — gom 1 chỗ để UI và admin
 * tham chiếu cùng nguồn. Khi thêm enum value mới ở DB, thêm cả ở đây.
 */
export const NHAN_MUC_TIEU: Record<(typeof LOAI_MUC_TIEU_VALUES)[number], string> = {
  ielts: "Luyện thi IELTS",
  toeic: "Luyện thi TOEIC",
  giao_tiep: "Giao tiếp hằng ngày",
  cong_viec: "Tiếng Anh công việc",
  du_lich: "Du lịch",
  phim_anh: "Xem phim / nghe nhạc",
  hoc_thuat: "Học thuật / nghiên cứu",
  khac: "Mục tiêu khác",
};
