import { z } from "zod";

const POSTGRES_UUID_PATTERN = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

function postgresUuid(message: string) {
  return z.string().trim().regex(POSTGRES_UUID_PATTERN, message);
}

/**
 * Schema cho việc lưu một từ vựng mới.
 * Map 1-1 với cột bảng tu_da_luu trong DATABASE.md.
 */
export const LuuTuVungSchema = z.object({
  tu_goc: z
    .string()
    .trim()
    .min(1, "Từ không được để trống")
    .max(128, "Từ quá dài (tối đa 128 ký tự)"),
  loai_tu: z.string().max(32).optional(),
  phien_am: z.string().max(128).optional(),
  nghia_en: z.string().max(512).optional(),
  nghia_vi: z.string().max(512).optional(),
  vi_du: z
    .array(
      z.object({
        en: z.string(),
        vi: z.string(),
        nguon_id: postgresUuid("ID nguồn không hợp lệ").optional(),
        doan_id: postgresUuid("ID đoạn không hợp lệ").optional(),
      }),
    )
    .optional(),
  tu_dong_nghia: z.array(z.string()).optional(),
  cefr_phu_hop: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]).optional(),
  bo_tu_id: postgresUuid("ID bộ từ không hợp lệ").optional(),
  nguon_id: postgresUuid("ID nguồn không hợp lệ").optional(),
  ngu_canh: z.string().max(512).optional(),
});

export type LuuTuVungInput = z.infer<typeof LuuTuVungSchema>;

/**
 * Schema cho việc tạo bộ từ mới.
 */
export const TaoBoTuSchema = z.object({
  ten: z
    .string()
    .trim()
    .min(1, "Tên bộ từ không được để trống")
    .max(64, "Tên quá dài (tối đa 64 ký tự)"),
  mo_ta: z.string().max(256).optional(),
  mau_bia: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Mã màu hex không hợp lệ").optional(),
  chu_de: z.string().max(64).optional(),
});

export type TaoBoTuInput = z.infer<typeof TaoBoTuSchema>;

/**
 * Schema cho việc cập nhật bộ từ.
 */
export const CapNhatBoTuSchema = TaoBoTuSchema.partial();

export type CapNhatBoTuInput = z.infer<typeof CapNhatBoTuSchema>;

/**
 * Schema cho việc grade một từ trong review.
 * quality: 0=Lại, 1=Khó, 2=Tốt, 3=Dễ
 */
export const GradeReviewSchema = z.object({
  tu_id: postgresUuid("ID từ không hợp lệ"),
  quality: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)], {
    error: "Grade phải là 0 (Lại), 1 (Khó), 2 (Tốt), hoặc 3 (Dễ)",
  }),
});

export type GradeReviewInput = z.infer<typeof GradeReviewSchema>;

/**
 * Schema cho việc thêm từ hệ thống vào deck của user (UC12).
 */
export const ThemBoTuHeThongSchema = z.object({
  bo_tu_id: postgresUuid("ID bộ từ không hợp lệ"),
});

export type ThemBoTuHeThongInput = z.infer<typeof ThemBoTuHeThongSchema>;

/**
 * Schema cho tìm kiếm từ vựng.
 */
export const TimKiemTuVungSchema = z.object({
  tu_khoa: z.string().max(64).optional(),
  bo_tu_id: postgresUuid("ID bộ từ không hợp lệ").optional(),
  trang_thai: z
    .enum(["moi", "dang_hoc", "on_tap", "thuoc"])
    .optional(),
  gioi_han: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type TimKiemTuVungInput = z.infer<typeof TimKiemTuVungSchema>;
