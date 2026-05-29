/**
 * Repository cho nguồn nội dung (YouTube, article, podcast).
 */

import { SupabaseClient } from "@supabase/supabase-js";

export type NguonNoiDungRow = {
  id: string;
  nguoi_dung_id: string;
  loai: "youtube" | "bai_bao" | "podcast" | "thu_cong";
  url: string;
  ma_bam_url: string;
  tieu_de: string | null;
  tac_gia: string | null;
  url_anh_bia: string | null;
  thoi_luong_giay: number | null;
  ngon_ngu: string;
  ban_ghi_loi: string | null;
  embedding: unknown | null;
  tao_luc: string;
  cap_nhat_luc: string;
};

export type DoanNoiDungRow = {
  id: string;
  nguon_id: string;
  thu_tu_doan: number;
  giay_bat_dau: number | null;
  giay_ket_thuc: number | null;
  noi_dung: string;
};

export const contentRepo = {
  /**
   * Lấy nguồn nội dung theo ID.
   */
  async layNguon(supabase: SupabaseClient, nguonId: string): Promise<NguonNoiDungRow | null> {
    const { data, error } = await supabase
      .from("nguon_noi_dung")
      .select("*")
      .eq("id", nguonId)
      .maybeSingle();

    if (error) throw error;
    return data as NguonNoiDungRow | null;
  },

  /**
   * Lưu nguồn nội dung mới.
   */
  async taoNguon(
    supabase: SupabaseClient,
    input: {
      nguoi_dung_id: string;
      loai: NguonNoiDungRow["loai"];
      url: string;
      ma_bam_url: string;
      tieu_de?: string;
      tac_gia?: string;
      url_anh_bia?: string;
      thoi_luong_giay?: number;
      ngon_ngu?: string;
      ban_ghi_loi?: string;
    },
  ): Promise<NguonNoiDungRow> {
    const { data, error } = await supabase
      .from("nguon_noi_dung")
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data as NguonNoiDungRow;
  },

  /**
   * Lấy đoạn nội dung của một nguồn.
   */
  async layDoan(supabase: SupabaseClient, nguonId: string): Promise<DoanNoiDungRow[]> {
    const { data, error } = await supabase
      .from("doan_noi_dung")
      .select("*")
      .eq("nguon_id", nguonId)
      .order("thu_tu_doan");

    if (error) throw error;
    return data as DoanNoiDungRow[];
  },

  /**
   * Lưu đoạn transcript.
   */
  async luuDoan(
    supabase: SupabaseClient,
    nguonId: string,
    doans: Array<{
      thu_tu_doan: number;
      giay_bat_dau?: number;
      giay_ket_thuc?: number;
      noi_dung: string;
    }>,
  ): Promise<void> {
    const { error } = await supabase
      .from("doan_noi_dung")
      .insert(doans.map((d) => ({ nguon_id: nguonId, ...d })));

    if (error) throw error;
  },

  /**
   * Liệt kê nguồn nội dung gần đây của user hiện tại.
   */
  async danhSachNguon(supabase: SupabaseClient): Promise<NguonNoiDungRow[]> {
    const { data, error } = await supabase
      .from("nguon_noi_dung")
      .select("*")
      .order("tao_luc", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data as NguonNoiDungRow[];
  },

  /**
   * Tìm nguồn theo URL hash (dedup).
   */
  async timTheoUrl(
    supabase: SupabaseClient,
    nguoiDungId: string,
    maBamUrl: string,
  ): Promise<NguonNoiDungRow | null> {
    const { data, error } = await supabase
      .from("nguon_noi_dung")
      .select("*")
      .eq("nguoi_dung_id", nguoiDungId)
      .eq("ma_bam_url", maBamUrl)
      .maybeSingle();

    if (error) throw error;
    return data as NguonNoiDungRow | null;
  },
};
