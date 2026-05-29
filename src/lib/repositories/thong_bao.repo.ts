/**
 * Repository cho thông báo (thong_bao).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ThongBao } from "@/types/supabase";

export const thongBaoRepo = {
  /**
   * Lấy danh sách thông báo của user, mới nhất trước.
   */
  async layDanhSach(
    supabase: SupabaseClient,
    limit = 30,
  ): Promise<ThongBao[]> {
    const { data, error } = await supabase
      .from("thong_bao")
      .select("*")
      .order("tao_luc", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as ThongBao[];
  },

  /**
   * Đếm số thông báo chưa đọc.
   */
  async demChuaDoc(supabase: SupabaseClient): Promise<number> {
    const { count, error } = await supabase
      .from("thong_bao")
      .select("*", { count: "exact", head: true })
      .is("doc_luc", null);

    if (error) throw error;
    return count ?? 0;
  },

  /**
   * Đánh dấu đã đọc 1 thông báo.
   */
  async danhDauDaDoc(
    supabase: SupabaseClient,
    thongBaoId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("thong_bao")
      .update({ doc_luc: new Date().toISOString() })
      .eq("id", thongBaoId);

    if (error) throw error;
  },

  /**
   * Đánh dấu tất cả đã đọc.
   */
  async danhDauTatCaDaDoc(supabase: SupabaseClient): Promise<void> {
    const { error } = await supabase
      .from("thong_bao")
      .update({ doc_luc: new Date().toISOString() })
      .is("doc_luc", null);

    if (error) throw error;
  },
};