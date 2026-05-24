import { z } from "zod";

/**
 * Rule mật khẩu chuẩn OWASP ASVS L1: tối thiểu 8 ký tự, có chữ + số.
 *
 * Cố ý KHÔNG yêu cầu ký tự đặc biệt — nghiên cứu NIST 800-63B chỉ ra
 * yêu cầu phức tạp quá mức không tăng entropy thực tế, chỉ làm user
 * chọn password dễ đoán hơn (vd. "Password1!").
 *
 * Max 72: giới hạn bytes của bcrypt — input dài hơn sẽ bị cắt cụt,
 * gây bug khó debug nếu user dùng emoji multi-byte.
 */
const passwordRule = z
  .string()
  .min(8, "Mật khẩu tối thiểu 8 ký tự")
  .max(72, "Mật khẩu tối đa 72 ký tự")
  .regex(/[A-Za-z]/, "Mật khẩu phải có chữ cái")
  .regex(/[0-9]/, "Mật khẩu phải có số");

/** Đăng nhập email/password — không cần check complexity (đã set ở signup). */
export const DangNhapEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
  password: z.string().min(1, "Mật khẩu không được trống"),
});

/** Đăng ký tài khoản mới. */
export const DangKySchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
    password: passwordRule,
    password_confirm: z.string(),
    ten_hien_thi: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên hiển thị")
      .max(64, "Tên hiển thị tối đa 64 ký tự"),
  })
  .refine((d) => d.password === d.password_confirm, {
    path: ["password_confirm"],
    message: "Mật khẩu nhập lại không khớp",
  });

/** Yêu cầu reset mật khẩu — chỉ cần email. */
export const QuenMatKhauSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email không hợp lệ"),
});

/** Đặt lại mật khẩu (sau khi click link trong email). */
export const DatLaiMatKhauSchema = z
  .object({
    password: passwordRule,
    password_confirm: z.string(),
  })
  .refine((d) => d.password === d.password_confirm, {
    path: ["password_confirm"],
    message: "Mật khẩu nhập lại không khớp",
  });

/** Đổi mật khẩu (user đã đăng nhập, biết current). */
export const DoiMatKhauSchema = z
  .object({
    current_password: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    new_password: passwordRule,
    new_password_confirm: z.string(),
  })
  .refine((d) => d.new_password === d.new_password_confirm, {
    path: ["new_password_confirm"],
    message: "Mật khẩu mới nhập lại không khớp",
  })
  .refine((d) => d.new_password !== d.current_password, {
    path: ["new_password"],
    message: "Mật khẩu mới phải khác mật khẩu hiện tại",
  });

export type DangKyInput = z.infer<typeof DangKySchema>;
export type DatLaiMatKhauInput = z.infer<typeof DatLaiMatKhauSchema>;
export type DoiMatKhauInput = z.infer<typeof DoiMatKhauSchema>;
