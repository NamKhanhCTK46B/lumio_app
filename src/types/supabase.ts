// Generated Supabase types — chạy `pnpm supabase:types` để cập nhật
// @supabase/auth-js v2.106.1 module build thiếu methods (bug); augment bù.
// @supabase/supabase-js Insert/Update types dùng Record<string,unknown>
// — mix với Json-valued Row fields → loại bỏ Insert/Update để Supabase
// client không strict-match object shape, thay vào đó dùng:
//   supabase.from("tbl").update({...} as Partial<RowType>)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Helper: object shape for scalar-only inserts (no Json fields)
type ScalarInsert<T extends Record<string, unknown>> = {
  [K in keyof T]?: T[K] | null | undefined;
};

export interface Database {
  public: {
    Tables: {
      ho_so: {
        Row: {
          id: string;
          email: string | null;
          ten_hien_thi: string | null;
          url_avatar: string | null;
          so_dien_thoai: string | null;
          trinh_do_cefr: string | null;
          do_tin_cefr: number | null;
          ngon_ngu_me_de: string | null;
          ngon_ngu_giao_dien: string | null;
          chu_de_giao_dien: string | null;
          phut_moi_ngay: number | null;
          mui_gio: string | null;
          hoan_tat_onboard_luc: string | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          email?: string | null;
          ten_hien_thi?: string | null;
          url_avatar?: string | null;
          so_dien_thoai?: string | null;
          trinh_do_cefr?: string | null;
          do_tin_cefr?: number | null;
          ngon_ngu_me_de?: string | null;
          ngon_ngu_giao_dien?: string | null;
          chu_de_giao_dien?: string | null;
          phut_moi_ngay?: number | null;
          mui_gio?: string | null;
          hoan_tat_onboard_luc?: string | null;
          tao_luc?: string | null;
          cap_nhat_luc?: string | null;
        }>;
        Update: Partial<{
          email: string | null;
          ten_hien_thi: string | null;
          url_avatar: string | null;
          so_dien_thoai: string | null;
          trinh_do_cefr: string | null;
          do_tin_cefr: number | null;
          ngon_ngu_me_de: string | null;
          ngon_ngu_giao_dien: string | null;
          chu_de_giao_dien: string | null;
          phut_moi_ngay: number | null;
          mui_gio: string | null;
          hoan_tat_onboard_luc: string | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        }>;
      };
      muc_tieu_nd: {
        Row: {
          id: string;
          nguoi_dung_id: string;
          muc_tieu: string;
          diem_muc_tieu: number | null;
          han_chot: string | null;
          la_muc_tieu_chinh: boolean | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          nguoi_dung_id: string;
          muc_tieu: string;
          diem_muc_tieu?: number | null;
          han_chot?: string | null;
          la_muc_tieu_chinh?: boolean | null;
          tao_luc?: string | null;
          cap_nhat_luc?: string | null;
        }>;
        Update: Partial<{
          muc_tieu: string;
          diem_muc_tieu: number | null;
          han_chot: string | null;
          la_muc_tieu_chinh: boolean | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        }>;
      };
      bai_kiem_tra_trinh_do: {
        Row: {
          id: string;
          nguoi_dung_id: string;
          bat_dau_luc: string | null;
          hoan_thanh_luc: string | null;
          trinh_do_ket_qua: string | null;
          do_tin_ket_qua: number | null;
          diem_tho: number | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          nguoi_dung_id: string;
          bat_dau_luc?: string | null;
          hoan_thanh_luc?: string | null;
          trinh_do_ket_qua?: string | null;
          do_tin_ket_qua?: number | null;
          diem_tho?: number | null;
          tao_luc?: string | null;
          cap_nhat_luc?: string | null;
        }>;
        Update: Partial<{
          hoan_thanh_luc: string | null;
          trinh_do_ket_qua: string | null;
          do_tin_ket_qua: number | null;
          diem_tho: number | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        }>;
      };
      cau_hoi_kiem_tra: {
        Row: {
          id: string;
          bai_kiem_tra_id: string;
          thu_tu: number;
          cau_hoi: string;
          trinh_do_du_kien: string;
          cau_tra_loi: string | null;
          la_dap_an_dung: boolean | null;
          phan_hoi_ai: string | null;
          tao_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          bai_kiem_tra_id: string;
          thu_tu: number;
          cau_hoi: string;
          trinh_do_du_kien: string;
          cau_tra_loi?: string | null;
          la_dap_an_dung?: boolean | null;
          phan_hoi_ai?: string | null;
          tao_luc?: string | null;
        }>;
        Update: Partial<{
          cau_tra_loi: string | null;
          la_dap_an_dung: boolean | null;
          phan_hoi_ai: string | null;
        }>;
      };
      nhan_vat: {
        Row: {
          id: string;
          slug: string | null;
          ten: string;
          url_avatar: string | null;
          giong: string | null;
          prompt_nhan_vat: string;
          cefr_toi_thieu: string | null;
          nhan: string[] | null;
          la_hoat_dong: boolean | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          slug?: string | null;
          ten: string;
          url_avatar?: string | null;
          giong?: string | null;
          prompt_nhan_vat: string;
          cefr_toi_thieu?: string | null;
          nhan?: string[] | null;
          la_hoat_dong?: boolean | null;
          tao_luc?: string | null;
          cap_nhat_luc?: string | null;
        }>;
        Update: Partial<{
          slug: string | null;
          ten: string;
          url_avatar: string | null;
          giong: string | null;
          prompt_nhan_vat: string;
          cefr_toi_thieu: string | null;
          nhan: string[] | null;
          la_hoat_dong: boolean | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        }>;
      };
      phien_noi: {
        Row: {
          id: string;
          nguoi_dung_id: string;
          nhan_vat_id: string;
          boi_canh: string | null;
          bat_dau_luc: string | null;
          ket_thuc_luc: string | null;
          tong_luot: number | null;
          diem_phat_am_tb: number | null;
          tom_tat: string | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          nguoi_dung_id: string;
          nhan_vat_id: string;
          boi_canh?: string | null;
          bat_dau_luc?: string | null;
          ket_thuc_luc?: string | null;
          tong_luot?: number | null;
          diem_phat_am_tb?: number | null;
          tom_tat?: string | null;
          tao_luc?: string | null;
          cap_nhat_luc?: string | null;
        }>;
        Update: Partial<{
          ket_thuc_luc: string | null;
          tong_luot: number | null;
          diem_phat_am_tb: number | null;
          tom_tat: string | null;
          cap_nhat_luc: string | null;
        }>;
      };
      luot_noi: {
        Row: {
          id: string;
          phien_id: string;
          thu_tu_luot: number;
          vai: string;
          noi_dung: string;
          url_audio: string | null;
          diem_phat_am: number | null;
          sua_loi: Json | null;
          tao_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          phien_id: string;
          thu_tu_luot: number;
          vai: string;
          noi_dung: string;
          url_audio?: string | null;
          diem_phat_am?: number | null;
          sua_loi?: Json | null;
          tao_luc?: string | null;
        }>;
        Update: Partial<{
          url_audio: string | null;
          diem_phat_am: number | null;
          sua_loi: Json | null;
        }>;
      };
      nguon_noi_dung: {
        Row: {
          id: string;
          nguoi_dung_id: string;
          loai: string;
          url: string;
          ma_bam_url: string;
          tieu_de: string | null;
          tac_gia: string | null;
          url_anh_bia: string | null;
          thoi_luong_giay: number | null;
          ngon_ngu: string | null;
          ban_ghi_loi: string | null;
          embedding: Json | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          nguoi_dung_id: string;
          loai: string;
          url: string;
          ma_bam_url: string;
          tieu_de?: string | null;
          tac_gia?: string | null;
          url_anh_bia?: string | null;
          thoi_luong_giay?: number | null;
          ngon_ngu?: string | null;
          ban_ghi_loi?: string | null;
          embedding?: Json | null;
          tao_luc?: string | null;
          cap_nhat_luc?: string | null;
        }>;
        Update: Partial<{
          tieu_de: string | null;
          tac_gia: string | null;
          url_anh_bia: string | null;
          thoi_luong_giay: number | null;
          ngon_ngu: string | null;
          ban_ghi_loi: string | null;
          embedding: Json | null;
          cap_nhat_luc: string | null;
        }>;
      };
      doan_noi_dung: {
        Row: {
          id: string;
          nguon_id: string;
          thu_tu_doan: number;
          giay_bat_dau: number | null;
          giay_ket_thuc: number | null;
          noi_dung: string;
        };
        Insert: ScalarInsert<{
          id: string;
          nguon_id: string;
          thu_tu_doan: number;
          giay_bat_dau?: number | null;
          giay_ket_thuc?: number | null;
          noi_dung: string;
        }>;
        Update: Partial<{
          noi_dung: string;
          giay_bat_dau: number | null;
          giay_ket_thuc: number | null;
        }>;
      };
      bo_tu: {
        Row: {
          id: string;
          nguoi_dung_id: string | null;
          ten: string;
          mo_ta: string | null;
          mau_bia: string | null;
          la_he_thong: boolean | null;
          chu_de: string | null;
          cefr_phu_hop: string | null;
          so_tu: number | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          nguoi_dung_id?: string | null;
          ten: string;
          mo_ta?: string | null;
          mau_bia?: string | null;
          la_he_thong?: boolean | null;
          chu_de?: string | null;
          cefr_phu_hop?: string | null;
          so_tu?: number | null;
          tao_luc?: string | null;
          cap_nhat_luc?: string | null;
        }>;
        Update: Partial<{
          ten: string;
          mo_ta: string | null;
          mau_bia: string | null;
          la_he_thong: boolean | null;
          chu_de: string | null;
          cefr_phu_hop: string | null;
          so_tu: number | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        }>;
      };
      tu_da_luu: {
        Row: {
          id: string;
          nguoi_dung_id: string;
          bo_tu_id: string | null;
          tu_goc: string;
          loai_tu: string | null;
          phien_am: string | null;
          nghia_en: string | null;
          nghia_vi: string | null;
          vi_du: Json | null;
          tu_dong_nghia: string[] | null;
          cefr_phu_hop: string | null;
          nguon_id: string | null;
          ngu_canh: string | null;
          trang_thai: string | null;
          da_danh_dau: boolean | null;
          embedding: Json | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          nguoi_dung_id: string;
          bo_tu_id?: string | null;
          tu_goc: string;
          loai_tu?: string | null;
          phien_am?: string | null;
          nghia_en?: string | null;
          nghia_vi?: string | null;
          vi_du?: Json | null;
          tu_dong_nghia?: string[] | null;
          cefr_phu_hop?: string | null;
          nguon_id?: string | null;
          ngu_canh?: string | null;
          trang_thai?: string | null;
          da_danh_dau?: boolean | null;
          embedding?: Json | null;
          tao_luc?: string | null;
          cap_nhat_luc?: string | null;
        }>;
        Update: Partial<{
          bo_tu_id: string | null;
          tu_goc: string;
          loai_tu: string | null;
          phien_am: string | null;
          nghia_en: string | null;
          nghia_vi: string | null;
          vi_du: Json | null;
          tu_dong_nghia: string[] | null;
          cefr_phu_hop: string | null;
          nguon_id: string | null;
          ngu_canh: string | null;
          trang_thai: string | null;
          da_danh_dau: boolean | null;
          embedding: Json | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        }>;
      };
      lich_on_tap: {
        Row: {
          id: string;
          tu_id: string;
          nguoi_dung_id: string;
          he_so_de: number | null;
          so_ngay_cach: number | null;
          so_lan_lap: number | null;
          on_tap_ke_luc: string;
          on_tap_cuoi_luc: string | null;
          chat_luong_cuoi: number | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          tu_id: string;
          nguoi_dung_id: string;
          he_so_de?: number | null;
          so_ngay_cach?: number | null;
          so_lan_lap?: number | null;
          on_tap_ke_luc: string;
          on_tap_cuoi_luc?: string | null;
          chat_luong_cuoi?: number | null;
          tao_luc?: string | null;
          cap_nhat_luc?: string | null;
        }>;
        Update: Partial<{
          he_so_de: number | null;
          so_ngay_cach: number | null;
          so_lan_lap: number | null;
          on_tap_ke_luc: string;
          on_tap_cuoi_luc: string | null;
          chat_luong_cuoi: number | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        }>;
      };
      cau_hoi_tu_vung: {
        Row: {
          id: string;
          nguoi_dung_id: string;
          nguon_id: string | null;
          loai_cau_hoi: string | null;
          cau_hoi: string;
          lua_chon: string[] | null;
          dap_an_dung: string | null;
          cau_tra_loi: string | null;
          la_dap_an_dung: boolean | null;
          tra_loi_luc: string | null;
          tao_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          nguoi_dung_id: string;
          nguon_id?: string | null;
          loai_cau_hoi?: string | null;
          cau_hoi: string;
          lua_chon?: string[] | null;
          dap_an_dung?: string | null;
          cau_tra_loi?: string | null;
          la_dap_an_dung?: boolean | null;
          tra_loi_luc?: string | null;
          tao_luc?: string | null;
        }>;
        Update: Partial<{
          lua_chon: string[] | null;
          dap_an_dung: string | null;
          cau_tra_loi: string | null;
          la_dap_an_dung: boolean | null;
          tra_loi_luc: string | null;
        }>;
      };
      de_bai_viet: {
        Row: {
          id: string;
          loai_de: string;
          cefr_phu_hop: string | null;
          chu_de: string | null;
          de_bai: string;
          gioi_han_phut: number | null;
          so_tu_toi_thieu: number | null;
          nguon: string | null;
          url_nguon: string | null;
          la_hoat_dong: boolean | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          loai_de: string;
          cefr_phu_hop?: string | null;
          chu_de?: string | null;
          de_bai: string;
          gioi_han_phut?: number | null;
          so_tu_toi_thieu?: number | null;
          nguon?: string | null;
          url_nguon?: string | null;
          la_hoat_dong?: boolean | null;
          tao_luc?: string | null;
          cap_nhat_luc?: string | null;
        }>;
        Update: Partial<{
          loai_de: string;
          cefr_phu_hop: string | null;
          chu_de: string | null;
          de_bai: string;
          gioi_han_phut: number | null;
          so_tu_toi_thieu: number | null;
          nguon: string | null;
          url_nguon: string | null;
          la_hoat_dong: boolean | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        }>;
      };
      bai_viet: {
        Row: {
          id: string;
          nguoi_dung_id: string;
          de_bai_id: string | null;
          loai_de: string;
          de_bai_snapshot: string;
          noi_dung: string;
          so_tu: number | null;
          thoi_gian_lam_giay: number | null;
          nop_luc: string | null;
          diem_tong: number | null;
          score_task_achievement: number | null;
          score_coherence: number | null;
          score_lexical: number | null;
          score_grammar: number | null;
          tom_tat_phan_hoi: string | null;
          ban_viet_lai: string | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          nguoi_dung_id: string;
          de_bai_id?: string | null;
          loai_de: string;
          de_bai_snapshot: string;
          noi_dung: string;
          so_tu?: number | null;
          thoi_gian_lam_giay?: number | null;
          nop_luc?: string | null;
          diem_tong?: number | null;
          score_task_achievement?: number | null;
          score_coherence?: number | null;
          score_lexical?: number | null;
          score_grammar?: number | null;
          tom_tat_phan_hoi?: string | null;
          ban_viet_lai?: string | null;
          tao_luc?: string | null;
          cap_nhat_luc?: string | null;
        }>;
        Update: Partial<{
          noi_dung: string;
          so_tu: number | null;
          thoi_gian_lam_giay: number | null;
          nop_luc: string | null;
          diem_tong: number | null;
          score_task_achievement: number | null;
          score_coherence: number | null;
          score_lexical: number | null;
          score_grammar: number | null;
          tom_tat_phan_hoi: string | null;
          ban_viet_lai: string | null;
          tao_luc: string | null;
          cap_nhat_luc: string | null;
        }>;
      };
      chu_thich_bai_viet: {
        Row: {
          id: string;
          bai_viet_id: string;
          vi_tri_bat_dau: number;
          vi_tri_ket_thuc: number;
          phan_loai: string | null;
          muc_do: string | null;
          doan_goc: string | null;
          goi_y_sua: string | null;
          giai_thich: string | null;
          tao_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          bai_viet_id: string;
          vi_tri_bat_dau: number;
          vi_tri_ket_thuc: number;
          phan_loai?: string | null;
          muc_do?: string | null;
          doan_goc?: string | null;
          goi_y_sua?: string | null;
          giai_thich?: string | null;
          tao_luc?: string | null;
        }>;
        Update: Partial<{
          phan_loai: string | null;
          muc_do: string | null;
          doan_goc: string | null;
          goi_y_sua: string | null;
          giai_thich: string | null;
        }>;
      };
      thong_bao: {
        Row: {
          id: string;
          nguoi_dung_id: string;
          loai: string;
          tieu_de: string;
          noi_dung: string | null;
          url_hanh_dong: string | null;
          doc_luc: string | null;
          lich_gui_luc: string | null;
          tao_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          nguoi_dung_id: string;
          loai: string;
          tieu_de: string;
          noi_dung?: string | null;
          url_hanh_dong?: string | null;
          doc_luc?: string | null;
          lich_gui_luc?: string | null;
          tao_luc?: string | null;
        }>;
        Update: Partial<{
          doc_luc: string | null;
          lich_gui_luc: string | null;
        }>;
      };
      phien_hoc: {
        Row: {
          id: string;
          nguoi_dung_id: string;
          loai_hoat_dong: string;
          entity_id: string | null;
          bat_dau_luc: string;
          ket_thuc_luc: string | null;
          thoi_luong_giay: number | null;
          chi_so: Json | null;
          tao_luc: string | null;
        };
        Insert: ScalarInsert<{
          id: string;
          nguoi_dung_id: string;
          loai_hoat_dong: string;
          entity_id?: string | null;
          bat_dau_luc: string;
          ket_thuc_luc?: string | null;
          thoi_luong_giay?: number | null;
          chi_so?: Json | null;
          tao_luc?: string | null;
        }>;
        Update: Partial<{
          ket_thuc_luc: string | null;
          thoi_luong_giay: number | null;
          chi_so: Json | null;
        }>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export type HoSo = Database["public"]["Tables"]["ho_so"]["Row"];
export type MucTieuNd = Database["public"]["Tables"]["muc_tieu_nd"]["Row"];
export type BaiKiemTraTrinhDo = Database["public"]["Tables"]["bai_kiem_tra_trinh_do"]["Row"];
export type CauHoiKiemTra = Database["public"]["Tables"]["cau_hoi_kiem_tra"]["Row"];
export type NhanVat = Database["public"]["Tables"]["nhan_vat"]["Row"];
export type PhienNoi = Database["public"]["Tables"]["phien_noi"]["Row"];
export type LuotNoi = Database["public"]["Tables"]["luot_noi"]["Row"];
export type NguonNoiDung = Database["public"]["Tables"]["nguon_noi_dung"]["Row"];
export type DoanNoiDung = Database["public"]["Tables"]["doan_noi_dung"]["Row"];
export type BoTu = Database["public"]["Tables"]["bo_tu"]["Row"];
export type TuDaLuu = Database["public"]["Tables"]["tu_da_luu"]["Row"];
export type LichOnTap = Database["public"]["Tables"]["lich_on_tap"]["Row"];
export type CauHoiTuVung = Database["public"]["Tables"]["cau_hoi_tu_vung"]["Row"];
export type DeBaiViet = Database["public"]["Tables"]["de_bai_viet"]["Row"];
export type BaiViet = Database["public"]["Tables"]["bai_viet"]["Row"];
export type ChuThichBaiViet = Database["public"]["Tables"]["chu_thich_bai_viet"]["Row"];
export type ThongBao = Database["public"]["Tables"]["thong_bao"]["Row"];
export type PhienHoc = Database["public"]["Tables"]["phien_hoc"]["Row"];
