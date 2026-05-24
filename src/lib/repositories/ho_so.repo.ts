import type { SupabaseClient } from "@supabase/supabase-js";
import type { CapNhatHoSoInput } from "@/lib/schemas/ho_so";

/**
 * Shape của row ho_so (subset cột thường cần). Khai báo tay vì
 * `supabase gen types` chưa chạy — khi chạy `pnpm supabase:types`
 * generated `src/types/supabase.ts`, có thể đổi sang Database['public']['Tables']['ho_so']['Row'].
 */
export type HoSoFull = {
  id: string;
  email: string;
  ten_hien_thi: string | null;
  url_avatar: string | null;
  so_dien_thoai: string | null;
  trinh_do_cefr: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
  ngon_ngu_giao_dien: "vi" | "en" | null;
  chu_de_giao_dien: "light" | "dark" | "system" | null;
  phut_moi_ngay: number | null;
  mui_gio: string | null;
  hoan_tat_onboard_luc: string | null;
};

/**
 * Repository cho bảng public.ho_so.
 *
 * Mọi method nhận `supabase` client (đã mang JWT của user qua cookie SSR).
 * RLS đảm bảo user chỉ đọc/sửa được hàng của chính mình — repository
 * KHÔNG kiểm tra ownership thủ công.
 *
 * Ngoại lệ duy nhất: `capNhat` + `capNhatAvatar` nhận thêm `userId` vì
 * `.eq("id", userId)` cần thiết cho update — `ho_so.id` chính là user id
 * (mirror auth.users.id), không có cột `nguoi_dung_id` riêng như các bảng khác.
 */
export const hoSoRepo = {
  /**
   * Đọc hồ sơ user hiện tại. Trả null nếu chưa login (RLS filter rỗng).
   */
  async layHoSoHienTai(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("ho_so")
      .select("id, email, ten_hien_thi, url_avatar, so_dien_thoai, trinh_do_cefr, ngon_ngu_giao_dien, chu_de_giao_dien, phut_moi_ngay, mui_gio, hoan_tat_onboard_luc")
      .maybeSingle<HoSoFull>();
    if (error) throw error;
    return data;
  },

  /**
   * Cập nhật hồ sơ user. RLS từ chối nếu auth.uid() khác `userId`.
   *
   * Chuyển so_dien_thoai rỗng → null để DB không lưu chuỗi rỗng vô nghĩa.
   */
  async capNhat(
    supabase: SupabaseClient,
    userId: string,
    input: CapNhatHoSoInput,
  ) {
    const payload = {
      ...input,
      so_dien_thoai: input.so_dien_thoai?.trim() || null,
    };
    const { error } = await supabase
      .from("ho_so")
      .update(payload)
      .eq("id", userId);
    if (error) throw error;
  },

  /**
   * Cập nhật `url_avatar` sau khi upload Storage thành công.
   * Tách riêng khỏi `capNhat` để Server Action upload avatar không cần
   * fetch + send lại toàn bộ payload form.
   */
  async capNhatAvatar(
    supabase: SupabaseClient,
    userId: string,
    url: string,
  ) {
    const { error } = await supabase
      .from("ho_so")
      .update({ url_avatar: url })
      .eq("id", userId);
    if (error) throw error;
  },
};
