/**
 * Repository cho từ vựng và bộ từ.
 *
 * Mọi method nhận `supabase: SupabaseClient` — không nhận `userId`.
 * Tin RLS tự filter theo `auth.uid()`.
 */

import { SupabaseClient } from "@supabase/supabase-js";
import type {
  LuuTuVungInput,
  TaoBoTuInput,
  CapNhatBoTuInput,
} from "@/lib/schemas/vocab";

// ---------------------------------------------------------------------------
// Types (lấy từ Supabase generated types — tạm khai báo ở đây)
// ---------------------------------------------------------------------------

export type BoTuRow = {
  id: string;
  nguoi_dung_id: string;
  ten: string;
  mo_ta: string | null;
  mau_bia: string | null;
  la_he_thong: boolean;
  chu_de: string | null;
  cefr_phu_hop: string | null;
  so_tu: number;
  tao_luc: string;
  cap_nhat_luc: string;
};

export type ViDuItem = {
  en: string;
  vi?: string;
  nguon_id?: string;
  doan_id?: string;
};

export type TuDaLuuRow = {
  id: string;
  nguoi_dung_id: string;
  bo_tu_id: string | null;
  tu_goc: string;
  loai_tu: string | null;
  phien_am: string | null;
  nghia_en: string | null;
  nghia_vi: string | null;
  vi_du: ViDuItem[] | null;
  tu_dong_nghia: string[] | null;
  cefr_phu_hop: string | null;
  nguon_id: string | null;
  ngu_canh: string | null;
  trang_thai: "moi" | "dang_hoc" | "on_tap" | "thuoc";
  da_danh_dau: boolean;
  tao_luc: string;
  cap_nhat_luc: string;
};

export type LichOnTapRow = {
  id: string;
  tu_id: string;
  nguoi_dung_id: string;
  he_so_de: number;
  so_ngay_cach: number;
  so_lan_lap: number;
  on_tap_ke_luc: string;
  on_tap_cuoi_luc: string | null;
  chat_luong_cuoi: number | null;
  tao_luc: string;
  cap_nhat_luc: string;
};

export type ReviewWordRow = TuDaLuuRow & {
  lich_on_tap: LichOnTapRow | null;
};

async function layNguoiDungId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error("Chưa đăng nhập");
  }
  return user.id;
}

// ---------------------------------------------------------------------------
// Bo từ
// ---------------------------------------------------------------------------

export const vocabRepo = {
  /**
   * Liệt kê bộ từ của user (bao gồm bộ hệ thống để browse).
   */
  async danhSachBoTu(supabase: SupabaseClient): Promise<BoTuRow[]> {
    const { data, error } = await supabase
      .from("bo_tu")
      .select("*")
      .order("tao_luc", { ascending: false });

    if (error) throw error;
    return data as BoTuRow[];
  },

  /**
   * Lấy một bộ từ theo ID.
   */
  async layBoTu(
    supabase: SupabaseClient,
    boTuId: string,
  ): Promise<BoTuRow | null> {
    const { data, error } = await supabase
      .from("bo_tu")
      .select("*")
      .eq("id", boTuId)
      .maybeSingle();

    if (error) throw error;
    return data as BoTuRow | null;
  },

  /**
   * Tạo bộ từ mới cho user.
   */
  async taoBoTu(
    supabase: SupabaseClient,
    input: TaoBoTuInput,
  ): Promise<BoTuRow> {
    const nguoiDungId = await layNguoiDungId(supabase);
    const { data, error } = await supabase
      .from("bo_tu")
      .insert({ ...input, la_he_thong: false, nguoi_dung_id: nguoiDungId })
      .select()
      .single();

    if (error) throw error;
    return data as BoTuRow;
  },

  /**
   * Cập nhật bộ từ.
   */
  async capNhatBoTu(
    supabase: SupabaseClient,
    boTuId: string,
    input: CapNhatBoTuInput,
  ): Promise<BoTuRow> {
    const { data, error } = await supabase
      .from("bo_tu")
      .update(input)
      .eq("id", boTuId)
      .select()
      .single();

    if (error) throw error;
    return data as BoTuRow;
  },

  /**
   * Xoá bộ từ (chỉ bộ từ user, không xoá bộ hệ thống).
   */
  async xoaBoTu(supabase: SupabaseClient, boTuId: string): Promise<void> {
    const { error } = await supabase
      .from("bo_tu")
      .delete()
      .eq("id", boTuId)
      .eq("la_he_thong", false);

    if (error) throw error;
  },

  // ---------------------------------------------------------------------------
  // Từ đã lưu
  // ---------------------------------------------------------------------------

  /**
   * Liệt kê từ trong một bộ từ.
   */
  async danhSachTu(
    supabase: SupabaseClient,
    boTuId: string,
    opts: { gioi_han?: number; offset?: number } = {},
  ): Promise<TuDaLuuRow[]> {
    const { data, error } = await supabase
      .from("tu_da_luu")
      .select("*")
      .eq("bo_tu_id", boTuId)
      .order("tao_luc", { ascending: false })
      .range(opts.offset ?? 0, (opts.offset ?? 0) + (opts.gioi_han ?? 20) - 1);

    if (error) throw error;
    return data as TuDaLuuRow[];
  },

  /**
   * Lấy một từ theo ID.
   */
  async layTu(
    supabase: SupabaseClient,
    tuId: string,
  ): Promise<TuDaLuuRow | null> {
    const { data, error } = await supabase
      .from("tu_da_luu")
      .select("*")
      .eq("id", tuId)
      .maybeSingle();

    if (error) throw error;
    return data as TuDaLuuRow | null;
  },

  /**
   * Lưu từ mới (tạo tu_da_luu + lich_on_tap cùng lúc).
   */
  async luuTu(
    supabase: SupabaseClient,
    input: LuuTuVungInput,
  ): Promise<TuDaLuuRow> {
    const nguoiDungId = await layNguoiDungId(supabase);
    // 1. Insert tu_da_luu
    const { data: tu, error: errTu } = await supabase
      .from("tu_da_luu")
      .insert({
        nguoi_dung_id: nguoiDungId,
        tu_goc: input.tu_goc,
        loai_tu: input.loai_tu,
        phien_am: input.phien_am,
        nghia_en: input.nghia_en,
        nghia_vi: input.nghia_vi,
        vi_du: input.vi_du,
        tu_dong_nghia: input.tu_dong_nghia,
        cefr_phu_hop: input.cefr_phu_hop,
        bo_tu_id: input.bo_tu_id,
        nguon_id: input.nguon_id,
        ngu_canh: input.ngu_canh,
      })
      .select()
      .single();

    if (errTu) throw errTu;

    // 2. Insert lich_on_tap (lên lịch ôn lần đầu = now)
    const { error: errLich } = await supabase.from("lich_on_tap").insert({
      tu_id: tu.id,
      nguoi_dung_id: nguoiDungId,
      on_tap_ke_luc: new Date().toISOString(),
    });

    if (errLich) throw errLich;

    return tu as TuDaLuuRow;
  },

  /**
   * Cập nhật trạng thái từ (moi → dang_hoc → on_tap → thuoc).
   */
  async capNhatTrangThaiTu(
    supabase: SupabaseClient,
    tuId: string,
    trangThai: TuDaLuuRow["trang_thai"],
  ): Promise<TuDaLuuRow> {
    const { data, error } = await supabase
      .from("tu_da_luu")
      .update({ trang_thai: trangThai })
      .eq("id", tuId)
      .select()
      .single();

    if (error) throw error;
    return data as TuDaLuuRow;
  },

  /**
   * Toggle đánh dấu sao.
   */
  async toggleDanhDau(
    supabase: SupabaseClient,
    tuId: string,
  ): Promise<boolean> {
    const tu = await this.layTu(supabase, tuId);
    if (!tu) throw new Error("Không tìm thấy từ");

    const { error } = await supabase
      .from("tu_da_luu")
      .update({ da_danh_dau: !tu.da_danh_dau })
      .eq("id", tuId);

    if (error) throw error;
    return !tu.da_danh_dau;
  },

  /**
   * Xoá từ.
   */
  async xoaTu(supabase: SupabaseClient, tuId: string): Promise<void> {
    const { error } = await supabase.from("tu_da_luu").delete().eq("id", tuId);
    if (error) throw error;
  },

  /**
   * Lấy từ theo nguồn (từ một bài YouTube/article đã import).
   */
  async layTuTheoNguon(
    supabase: SupabaseClient,
    nguoiDungId: string,
    nguonId: string,
  ): Promise<TuDaLuuRow[]> {
    const { data, error } = await supabase
      .from("tu_da_luu")
      .select("*")
      .eq("nguoi_dung_id", nguoiDungId)
      .eq("nguon_id", nguonId)
      .order("tao_luc", { ascending: false });

    if (error) throw error;
    return data as TuDaLuuRow[];
  },

  /**
   * Lấy từ gần đây nhất (để sinh quiz khi không chỉ định nguồn).
   */
  async layTuGanNhat(
    supabase: SupabaseClient,
    nguoiDungId: string,
    limit = 20,
  ): Promise<TuDaLuuRow[]> {
    const { data, error } = await supabase
      .from("tu_da_luu")
      .select("*")
      .eq("nguoi_dung_id", nguoiDungId)
      .order("tao_luc", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as TuDaLuuRow[];
  },

  // ---------------------------------------------------------------------------
  // Ôn từ (SRS)
  // ---------------------------------------------------------------------------

  /**
   * Lấy từ cần ôn hôm nay (on_tap_ke_luc <= now).
   */
  async layTuCanOn(
    supabase: SupabaseClient,
    limit = 20,
  ): Promise<ReviewWordRow[]> {
    const { data, error } = await supabase
      .from("tu_da_luu")
      .select(
        "*, lich_on_tap(id, tu_id, he_so_de, so_ngay_cach, so_lan_lap, on_tap_ke_luc, on_tap_cuoi_luc, chat_luong_cuoi)",
      )
      .eq("lich_on_tap.on_tap_ke_luc_lte", new Date().toISOString())
      .order("lich_on_tap.on_tap_ke_luc", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data as ReviewWordRow[];
  },

  /**
   * Lấy lịch ôn của một từ.
   */
  async layLichOn(
    supabase: SupabaseClient,
    tuId: string,
  ): Promise<LichOnTapRow | null> {
    const { data, error } = await supabase
      .from("lich_on_tap")
      .select("*")
      .eq("tu_id", tuId)
      .maybeSingle();

    if (error) throw error;
    return data as LichOnTapRow | null;
  },

  /**
   * Cập nhật lịch ôn sau khi grade.
   */
  async capNhatLichOn(
    supabase: SupabaseClient,
    tuId: string,
    nextOnTap: string,
    heSoDe: number,
    soNgayCach: number,
    soLanLap: number,
    chatLuongCuoi: number,
  ): Promise<LichOnTapRow> {
    const { data, error } = await supabase
      .from("lich_on_tap")
      .update({
        on_tap_ke_luc: nextOnTap,
        on_tap_cuoi_luc: new Date().toISOString(),
        he_so_de: heSoDe,
        so_ngay_cach: soNgayCach,
        so_lan_lap: soLanLap,
        chat_luong_cuoi: chatLuongCuoi,
      })
      .eq("tu_id", tuId)
      .select()
      .single();

    if (error) throw error;
    return data as LichOnTapRow;
  },

  // ---------------------------------------------------------------------------
  // Thống kê
  // ---------------------------------------------------------------------------

  /**
   * Số từ đến hạn ôn hôm nay.
   */
  async demTuCanOn(supabase: SupabaseClient): Promise<number> {
    const { count, error } = await supabase
      .from("lich_on_tap")
      .select("*", { count: "exact", head: true })
      .lte("on_tap_ke_luc", new Date().toISOString());

    if (error) throw error;
    return count ?? 0;
  },

  /**
   * Thống kê tổng hợp từ vựng của user.
   */
  async thongKe(supabase: SupabaseClient): Promise<{
    tong: number;
    moi: number;
    dang_hoc: number;
    on_tap: number;
    thuoc: number;
  }> {
    const { data, error } = await supabase
      .from("tu_da_luu")
      .select("trang_thai");

    if (error) throw error;

    const rows = data as Array<{ trang_thai: string }>;
    return {
      tong: rows.length,
      moi: rows.filter((r) => r.trang_thai === "moi").length,
      dang_hoc: rows.filter((r) => r.trang_thai === "dang_hoc").length,
      on_tap: rows.filter((r) => r.trang_thai === "on_tap").length,
      thuoc: rows.filter((r) => r.trang_thai === "thuoc").length,
    };
  },

  /**
   * Thêm bộ từ hệ thống vào deck của user (clone với lich_on_tap mới).
   */
  async saoChepBoTuHeThong(
    supabase: SupabaseClient,
    boTuHeThongId: string,
  ): Promise<{ so_tu: number }> {
    // Lấy bộ từ hệ thống + từ của nó
    const [boTu, tuHeThong] = await Promise.all([
      this.layBoTu(supabase, boTuHeThongId),
      this.danhSachTu(supabase, boTuHeThongId, { gioi_han: 1000 }),
    ]);

    if (!boTu || !boTu.la_he_thong) {
      throw new Error("Bộ từ không tồn tại hoặc không phải bộ hệ thống");
    }

    // Tạo bộ từ mới cho user (clone)
    const boTuMoi = await this.taoBoTu(supabase, {
      ten: boTu.ten,
      mo_ta: boTu.mo_ta ?? undefined,
      mau_bia: boTu.mau_bia ?? undefined,
      chu_de: boTu.chu_de ?? undefined,
    });

    // Clone từng từ
    const now = new Date().toISOString();
    const tuInserts = tuHeThong.map((tu) => ({
      nguoi_dung_id: (boTuMoi as BoTuRow).nguoi_dung_id,
      bo_tu_id: boTuMoi.id,
      tu_goc: tu.tu_goc,
      loai_tu: tu.loai_tu,
      phien_am: tu.phien_am,
      nghia_en: tu.nghia_en,
      nghia_vi: tu.nghia_vi,
      vi_du: tu.vi_du,
      cefr_phu_hop: tu.cefr_phu_hop,
      trang_thai: "moi",
    }));

    if (tuInserts.length > 0) {
      const { error: errTu } = await supabase
        .from("tu_da_luu")
        .insert(tuInserts);

      if (errTu) throw errTu;
    }

    return { so_tu: tuInserts.length };
  },
};
