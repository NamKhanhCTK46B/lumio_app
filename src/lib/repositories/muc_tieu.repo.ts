import type { SupabaseClient } from "@supabase/supabase-js";
import type { LoaiMucTieuValue } from "@/lib/schemas/muc_tieu";

/**
 * Repository cho bảng public.muc_tieu_nd (UC6). RLS filter theo
 * `nguoi_dung_id = auth.uid()` — repository không nhận userId trừ khi
 * bắt buộc cho insert.
 */

export type MucTieuRow = {
  id: string;
  nguoi_dung_id: string;
  muc_tieu: LoaiMucTieuValue;
  diem_muc_tieu: number | null;
  han_chot: string | null;
  la_muc_tieu_chinh: boolean;
};

type LuuMucTieuInput = {
  userId: string;
  muc_tieu: LoaiMucTieuValue[];
  muc_tieu_chinh: LoaiMucTieuValue;
  diem_muc_tieu?: number;
  han_chot?: string;
};

export const mucTieuRepo = {
  /** Liệt kê mục tiêu user hiện tại. */
  async layDanhSach(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("muc_tieu_nd")
      .select("id, nguoi_dung_id, muc_tieu, diem_muc_tieu, han_chot, la_muc_tieu_chinh")
      .order("la_muc_tieu_chinh", { ascending: false })
      .returns<MucTieuRow[]>();
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Lưu danh sách mục tiêu cho user. Replace toàn bộ (delete-then-insert)
   * trong cùng request — đơn giản, an toàn. Bảng nhỏ (< 8 row per user)
   * nên không cần upsert phức tạp.
   *
   * Lý do phải nhận `userId` (vi phạm rule chung): cột `nguoi_dung_id` là
   * required NOT NULL, RLS lo check nhưng INSERT vẫn cần value.
   *
   * `diem_muc_tieu` + `han_chot` chỉ gắn vào mục tiêu chính — các mục
   * còn lại để null (đỡ ambiguous "deadline thuộc về mục nào").
   */
  async luu(supabase: SupabaseClient, input: LuuMucTieuInput) {
    const { userId, muc_tieu, muc_tieu_chinh, diem_muc_tieu, han_chot } = input;

    const { error: errDel } = await supabase
      .from("muc_tieu_nd")
      .delete()
      .eq("nguoi_dung_id", userId);
    if (errDel) throw errDel;

    const rows = muc_tieu.map((mt) => ({
      nguoi_dung_id: userId,
      muc_tieu: mt,
      la_muc_tieu_chinh: mt === muc_tieu_chinh,
      diem_muc_tieu: mt === muc_tieu_chinh ? diem_muc_tieu ?? null : null,
      han_chot: mt === muc_tieu_chinh ? han_chot ?? null : null,
    }));

    const { error: errIns } = await supabase.from("muc_tieu_nd").insert(rows);
    if (errIns) throw errIns;
  },
};
