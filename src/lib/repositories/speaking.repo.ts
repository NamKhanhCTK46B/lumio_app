/**
 * Repository cho speaking — quản lý phiên nói và lượt nói.
 *
 * Bảng: phien_noi, luot_noi, nhan_vat.
 */

import { SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NhanVatRow = {
  id: string;
  slug: string;
  ten: string;
  url_avatar: string | null;
  giong: string | null;
  prompt_nhan_vat: string;
  cefr_toi_thieu: string | null;
  nhan: string[] | null;
  la_hoat_dong: boolean;
  tao_luc: string;
  cap_nhat_luc: string;
};

export type PhienNoiRow = {
  id: string;
  nguoi_dung_id: string;
  nhan_vat_id: string;
  boi_canh: string | null;
  bat_dau_luc: string;
  ket_thuc_luc: string | null;
  tong_luot: number;
  diem_phat_am_tb: number | null;
  tom_tat: string | null;
  tao_luc: string;
  cap_nhat_luc: string;
};

export type LuotNoiRow = {
  id: string;
  phien_id: string;
  thu_tu_luot: number;
  vai: "nguoi_dung" | "ai";
  noi_dung: string;
  url_audio: string | null;
  diem_phat_am: number | null;
  sua_loi: unknown | null;
  tao_luc: string;
};

// ---------------------------------------------------------------------------
// Nhân vật
// ---------------------------------------------------------------------------

export const speakingRepo = {
  /**
   * Liệt kê nhân vật khả dụng.
   */
  async danhSachNhanVat(supabase: SupabaseClient): Promise<NhanVatRow[]> {
    const { data, error } = await supabase
      .from("nhan_vat")
      .select("*")
      .eq("la_hoat_dong", true)
      .order("ten");

    if (error) throw error;
    return data as NhanVatRow[];
  },

  /**
   * Lấy nhân vật theo ID.
   */
  async layNhanVat(supabase: SupabaseClient, nhanVatId: string): Promise<NhanVatRow | null> {
    const { data, error } = await supabase
      .from("nhan_vat")
      .select("*")
      .eq("id", nhanVatId)
      .maybeSingle();

    if (error) throw error;
    return data as NhanVatRow | null;
  },

  // ---------------------------------------------------------------------------
  // Phiên nói
  // ---------------------------------------------------------------------------

  /**
   * Tạo phiên nói mới.
   */
  async taoPhienNoi(
    supabase: SupabaseClient,
    nhanVatId: string,
    boiCanh: string | null = null,
  ): Promise<PhienNoiRow> {
    const { data, error } = await supabase
      .from("phien_noi")
      .insert({
        nhan_vat_id: nhanVatId,
        boi_canh: boiCanh,
        bat_dau_luc: new Date().toISOString(),
        tong_luot: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data as PhienNoiRow;
  },

  /**
   * Lấy phiên nói theo ID.
   */
  async layPhienNoi(supabase: SupabaseClient, phienId: string): Promise<PhienNoiRow | null> {
    const { data, error } = await supabase
      .from("phien_noi")
      .select("*")
      .eq("id", phienId)
      .maybeSingle();

    if (error) throw error;
    return data as PhienNoiRow | null;
  },

  /**
   * Lấy lịch sử lượt nói của một phiên.
   */
  async layLichSuPhien(
    supabase: SupabaseClient,
    phienId: string,
  ): Promise<LuotNoiRow[]> {
    const { data, error } = await supabase
      .from("luot_noi")
      .select("*")
      .eq("phien_id", phienId)
      .order("thu_tu_luot", { ascending: true });

    if (error) throw error;
    return data as LuotNoiRow[];
  },

  /**
   * Lấy danh sách phiên gần đây của user.
   */
  async danhSachPhienGanDay(
    supabase: SupabaseClient,
    limit = 10,
  ): Promise<(PhienNoiRow & { nhan_vat: NhanVatRow })[]> {
    const { data, error } = await supabase
      .from("phien_noi")
      .select("*, nhan_vat(*)")
      .order("bat_dau_luc", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as (PhienNoiRow & { nhan_vat: NhanVatRow })[];
  },

  /**
   * Kết thúc phiên nói.
   */
  async ketThucPhien(
    supabase: SupabaseClient,
    phienId: string,
    tongLuot: number,
    diemPhatAmTb: number | null,
    tomTat: string | null,
  ): Promise<PhienNoiRow> {
    const { data, error } = await supabase
      .from("phien_noi")
      .update({
        ket_thuc_luc: new Date().toISOString(),
        tong_luot: tongLuot,
        diem_phat_am_tb: diemPhatAmTb,
        tom_tat: tomTat,
      })
      .eq("id", phienId)
      .select()
      .single();

    if (error) throw error;
    return data as PhienNoiRow;
  },

  // ---------------------------------------------------------------------------
  // Lượt nói
  // ---------------------------------------------------------------------------

  /**
   * Thêm lượt nói của AI hoặc user.
   */
  async themLuotNoi(
    supabase: SupabaseClient,
    phienId: string,
    vai: "nguoi_dung" | "ai",
    noiDung: string,
    urlAudio: string | null = null,
    diemPhatAm: number | null = null,
    suaLoi: unknown | null = null,
  ): Promise<LuotNoiRow> {
    // Lấy thứ tự lượt tiếp theo
    const { data: lastTurn } = await supabase
      .from("luot_noi")
      .select("thu_tu_luot")
      .eq("phien_id", phienId)
      .order("thu_tu_luot", { ascending: false })
      .limit(1)
      .maybeSingle();

    const thuTu = (lastTurn?.thu_tu_luot ?? 0) + 1;

    const { data, error } = await supabase
      .from("luot_noi")
      .insert({
        phien_id: phienId,
        thu_tu_luot: thuTu,
        vai,
        noi_dung: noiDung,
        url_audio: urlAudio,
        diem_phat_am: diemPhatAm,
        sua_loi: suaLoi,
      })
      .select()
      .single();

    if (error) throw error;

    // Tăng tong_luot trên phien_noi
    await supabase
      .from("phien_noi")
      .update({ tong_luot: thuTu })
      .eq("id", phienId);

    return data as LuotNoiRow;
  },

  // ---------------------------------------------------------------------------
  // Thống kê
  // ---------------------------------------------------------------------------

  /**
   * Thống kê speaking của user.
   */
  async thongKe(supabase: SupabaseClient): Promise<{
    tong_phien: number;
    phien_gan_nhat: string | null;
    diem_tb: number | null;
  }> {
    const { data, error } = await supabase
      .from("phien_noi")
      .select("bat_dau_luc, diem_phat_am_tb");

    if (error) throw error;

    const rows = data as Array<{ bat_dau_luc: string; diem_phat_am_tb: number | null }>;
    const scores = rows
      .map((r) => r.diem_phat_am_tb)
      .filter((s): s is number => s !== null);

    return {
      tong_phien: rows.length,
      phien_gan_nhat: rows[0]?.bat_dau_luc ?? null,
      diem_tb:
        scores.length > 0
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
          : null,
    };
  },
};
