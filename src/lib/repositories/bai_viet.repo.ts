import type { SupabaseClient } from "@supabase/supabase-js";
import type { PhanHoiEssay } from "@/lib/ai/prompts/essay-feedback";

/**
 * Repository UC13–15 — bai_viet + chu_thich_bai_viet + de_bai_viet.
 *
 * `de_bai_viet` là catalog public (RLS read-all). `bai_viet` là bản nháp
 * + bài đã nộp của user. `chu_thich_bai_viet` lưu annotations LLM sinh.
 */

export type DeBaiRow = {
  id: string;
  loai_de: "ielts_task1" | "ielts_task2" | "email" | "tu_do";
  cefr_phu_hop: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
  chu_de: string | null;
  de_bai: string;
  gioi_han_phut: number | null;
  so_tu_toi_thieu: number | null;
};

export type BaiVietRow = {
  id: string;
  nguoi_dung_id: string;
  de_bai_id: string | null;
  loai_de: "ielts_task1" | "ielts_task2" | "email" | "tu_do";
  de_bai_snapshot: string;
  noi_dung: string;
  so_tu: number;
  thoi_gian_lam_giay: number | null;
  nop_luc: string | null;
  diem_tong: number | null;
  score_task_achievement: number | null;
  score_coherence: number | null;
  score_lexical: number | null;
  score_grammar: number | null;
  tom_tat_phan_hoi: string | null;
  ban_viet_lai: string | null;
  tao_luc: string;
  cap_nhat_luc: string;
};

export type ChuThichRow = {
  id: string;
  bai_viet_id: string;
  vi_tri_bat_dau: number;
  vi_tri_ket_thuc: number;
  phan_loai: "grammar" | "lexical" | "coherence" | "task" | "spelling";
  muc_do: "nhe" | "nang";
  doan_goc: string | null;
  goi_y_sua: string | null;
  giai_thich: string | null;
};

export const baiVietRepo = {
  /** Catalog đề bài public. RLS cho phép select khi la_hoat_dong. */
  async layDanhSachDe(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("de_bai_viet")
      .select("id, loai_de, cefr_phu_hop, chu_de, de_bai, gioi_han_phut, so_tu_toi_thieu")
      .eq("la_hoat_dong", true)
      .order("loai_de", { ascending: true })
      .returns<DeBaiRow[]>();
    if (error) throw error;
    return data ?? [];
  },

  /** Lấy 1 đề. */
  async layDe(supabase: SupabaseClient, deBaiId: string) {
    const { data, error } = await supabase
      .from("de_bai_viet")
      .select("id, loai_de, cefr_phu_hop, chu_de, de_bai, gioi_han_phut, so_tu_toi_thieu")
      .eq("id", deBaiId)
      .maybeSingle<DeBaiRow>();
    if (error) throw error;
    return data;
  },

  /**
   * Tạo bản nháp bài viết. snapshot `de_bai` ngay lúc tạo để nếu admin
   * sửa catalog sau này, bài cũ vẫn giữ đề gốc.
   */
  async taoNhap(
    supabase: SupabaseClient,
    input: {
      userId: string;
      de_bai_id: string | null;
      loai_de: "ielts_task1" | "ielts_task2" | "email" | "tu_do";
      de_bai_snapshot: string;
    },
  ) {
    const { data, error } = await supabase
      .from("bai_viet")
      .insert({
        nguoi_dung_id: input.userId,
        de_bai_id: input.de_bai_id,
        loai_de: input.loai_de,
        de_bai_snapshot: input.de_bai_snapshot,
        noi_dung: "",
      })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  },

  /** Lấy 1 bài viết kèm thông tin chấm điểm. */
  async layBai(supabase: SupabaseClient, baiVietId: string) {
    const { data, error } = await supabase
      .from("bai_viet")
      .select("id, nguoi_dung_id, de_bai_id, loai_de, de_bai_snapshot, noi_dung, so_tu, thoi_gian_lam_giay, nop_luc, diem_tong, score_task_achievement, score_coherence, score_lexical, score_grammar, tom_tat_phan_hoi, ban_viet_lai, tao_luc, cap_nhat_luc")
      .eq("id", baiVietId)
      .maybeSingle<BaiVietRow>();
    if (error) throw error;
    return data;
  },

  /** Autosave nội dung — không touch nop_luc / điểm. */
  async luuNhap(
    supabase: SupabaseClient,
    baiVietId: string,
    noi_dung: string,
    thoi_gian_lam_giay?: number,
  ) {
    const payload: Record<string, unknown> = { noi_dung };
    if (typeof thoi_gian_lam_giay === "number") {
      payload.thoi_gian_lam_giay = thoi_gian_lam_giay;
    }
    const { error } = await supabase
      .from("bai_viet")
      .update(payload)
      .eq("id", baiVietId);
    if (error) throw error;
  },

  /**
   * Lưu kết quả chấm LLM: update bai_viet + replace chu_thich_bai_viet.
   * Replace thay vì merge — mỗi lần nộp lại là 1 đợt chấm mới hoàn toàn.
   */
  async luuKetQuaCham(
    supabase: SupabaseClient,
    baiVietId: string,
    noi_dung_final: string,
    ket_qua: PhanHoiEssay,
  ) {
    const { error: errUpdate } = await supabase
      .from("bai_viet")
      .update({
        noi_dung: noi_dung_final,
        nop_luc: new Date().toISOString(),
        diem_tong: ket_qua.diem_tong,
        score_task_achievement: ket_qua.score_task_achievement,
        score_coherence: ket_qua.score_coherence,
        score_lexical: ket_qua.score_lexical,
        score_grammar: ket_qua.score_grammar,
        tom_tat_phan_hoi: ket_qua.tom_tat,
        ban_viet_lai: ket_qua.ban_viet_lai,
      })
      .eq("id", baiVietId);
    if (errUpdate) throw errUpdate;

    const { error: errDel } = await supabase
      .from("chu_thich_bai_viet")
      .delete()
      .eq("bai_viet_id", baiVietId);
    if (errDel) throw errDel;

    if (ket_qua.chu_thich.length === 0) return;

    const rows = ket_qua.chu_thich.map((c) => ({
      bai_viet_id: baiVietId,
      vi_tri_bat_dau: c.vi_tri_bat_dau,
      vi_tri_ket_thuc: c.vi_tri_ket_thuc,
      phan_loai: c.phan_loai,
      muc_do: c.muc_do,
      doan_goc: c.doan_goc,
      goi_y_sua: c.goi_y_sua,
      giai_thich: c.giai_thich,
    }));
    const { error: errIns } = await supabase
      .from("chu_thich_bai_viet")
      .insert(rows);
    if (errIns) throw errIns;
  },

  /** Lấy annotations của 1 bài, sort theo vị trí. */
  async layChuThich(supabase: SupabaseClient, baiVietId: string) {
    const { data, error } = await supabase
      .from("chu_thich_bai_viet")
      .select("id, bai_viet_id, vi_tri_bat_dau, vi_tri_ket_thuc, phan_loai, muc_do, doan_goc, goi_y_sua, giai_thich")
      .eq("bai_viet_id", baiVietId)
      .order("vi_tri_bat_dau", { ascending: true })
      .returns<ChuThichRow[]>();
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Liệt kê bài đã nộp của user (UC15 progress chart). Chỉ lấy điểm +
   * timestamp để bare minimum cho biểu đồ — không kéo nội dung.
   */
  async layLichSuChamDiem(supabase: SupabaseClient, limit = 30) {
    const { data, error } = await supabase
      .from("bai_viet")
      .select("id, loai_de, nop_luc, diem_tong, score_task_achievement, score_coherence, score_lexical, score_grammar")
      .not("nop_luc", "is", null)
      .order("nop_luc", { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },

  /** Liệt kê bản nháp + bài đã nộp gần đây để hiển thị ở /write index. */
  async layGanDay(supabase: SupabaseClient, limit = 10) {
    const { data, error } = await supabase
      .from("bai_viet")
      .select("id, loai_de, de_bai_snapshot, so_tu, nop_luc, diem_tong, tao_luc, cap_nhat_luc")
      .order("cap_nhat_luc", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  },
};
