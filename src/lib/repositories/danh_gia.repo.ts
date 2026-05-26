import type { SupabaseClient } from "@supabase/supabase-js";
import type { CauHoiPlacement } from "@/lib/ai/prompts/placement-test";

/**
 * Repository UC5 — bai_kiem_tra_trinh_do + cau_hoi_kiem_tra.
 *
 * Mỗi user có thể có nhiều bài kiểm tra (làm lại sau 60 ngày). Repo trả
 * bài đang dang dở (hoan_thanh_luc IS NULL) hoặc cho phép tạo mới.
 */

export type BaiKiemTraRow = {
  id: string;
  nguoi_dung_id: string;
  bat_dau_luc: string;
  hoan_thanh_luc: string | null;
  trinh_do_ket_qua: "A1" | "A2" | "B1" | "B2" | "C1" | "C2" | null;
  do_tin_ket_qua: number | null;
  diem_tho: number | null;
};

export type CauHoiRow = {
  id: string;
  bai_kiem_tra_id: string;
  thu_tu: number;
  cau_hoi: string;
  trinh_do_du_kien: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  cau_tra_loi: string | null;
  la_dap_an_dung: boolean | null;
  phan_hoi_ai: string | null;
};

export const danhGiaRepo = {
  /** Tạo bản ghi bài kiểm tra mới (chưa có câu nào). */
  async taoBaiMoi(supabase: SupabaseClient, userId: string) {
    const { data, error } = await supabase
      .from("bai_kiem_tra_trinh_do")
      .insert({ nguoi_dung_id: userId })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  },

  /** Lấy bài đang làm gần nhất (chưa hoàn tất). Trả null nếu không có. */
  async layBaiDangLam(supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("bai_kiem_tra_trinh_do")
      .select("id, nguoi_dung_id, bat_dau_luc, hoan_thanh_luc, trinh_do_ket_qua, do_tin_ket_qua, diem_tho")
      .is("hoan_thanh_luc", null)
      .order("bat_dau_luc", { ascending: false })
      .limit(1)
      .maybeSingle<BaiKiemTraRow>();
    if (error) throw error;
    return data;
  },

  /** Lấy toàn bộ câu hỏi của 1 bài, sort theo thu_tu. */
  async layCauHoi(supabase: SupabaseClient, baiKiemTraId: string) {
    const { data, error } = await supabase
      .from("cau_hoi_kiem_tra")
      .select("id, bai_kiem_tra_id, thu_tu, cau_hoi, trinh_do_du_kien, cau_tra_loi, la_dap_an_dung, phan_hoi_ai")
      .eq("bai_kiem_tra_id", baiKiemTraId)
      .order("thu_tu", { ascending: true })
      .returns<CauHoiRow[]>();
    if (error) throw error;
    return data ?? [];
  },

  /**
   * Insert 1 câu hỏi mới (LLM vừa sinh). Lưu `dap_an` + 4 lựa chọn vào
   * cột `cau_hoi` dạng JSON-string đơn giản — schema DB hiện chỉ có
   * `cau_hoi text`, không có cột riêng cho options. Tránh migration phụ
   * cho UC5, parse lại khi render.
   */
  async themCauHoi(
    supabase: SupabaseClient,
    baiKiemTraId: string,
    thuTu: number,
    cauHoi: CauHoiPlacement,
  ) {
    const payload = {
      bai_kiem_tra_id: baiKiemTraId,
      thu_tu: thuTu,
      cau_hoi: JSON.stringify(cauHoi),
      trinh_do_du_kien: cauHoi.trinh_do,
    };
    const { data, error } = await supabase
      .from("cau_hoi_kiem_tra")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  },

  /** Cập nhật câu trả lời + chấm đúng/sai cho 1 câu hỏi. */
  async chamCauHoi(
    supabase: SupabaseClient,
    cauHoiId: string,
    cauTraLoi: string,
    laDapAnDung: boolean,
    phanHoi: string,
  ) {
    const { error } = await supabase
      .from("cau_hoi_kiem_tra")
      .update({
        cau_tra_loi: cauTraLoi,
        la_dap_an_dung: laDapAnDung,
        phan_hoi_ai: phanHoi,
      })
      .eq("id", cauHoiId);
    if (error) throw error;
  },

  /** Đóng bài kiểm tra: set hoan_thanh_luc + kết quả CEFR + confidence. */
  async hoanTat(
    supabase: SupabaseClient,
    baiKiemTraId: string,
    ketQua: {
      trinh_do: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
      do_tin: number;
      diem_tho: number;
    },
  ) {
    const { error } = await supabase
      .from("bai_kiem_tra_trinh_do")
      .update({
        hoan_thanh_luc: new Date().toISOString(),
        trinh_do_ket_qua: ketQua.trinh_do,
        do_tin_ket_qua: ketQua.do_tin,
        diem_tho: ketQua.diem_tho,
      })
      .eq("id", baiKiemTraId);
    if (error) throw error;
  },
};
