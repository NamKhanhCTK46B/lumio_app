-- Grant CRUD privileges cho tất cả bảng public chưa có GRANT.
-- Chỉ ho_so đã có grant ở migration trước (20260530030500).
-- Không grant delete cho bảng hệ thống (nhan_vat, de_bai_viet).

-- Mục tiêu & kiểm tra (migration 03)
grant select, insert, update, delete on table public.muc_tieu_nd to authenticated;
grant select, insert, update, delete on table public.bai_kiem_tra_trinh_do to authenticated;
grant select, insert, update, delete on table public.cau_hoi_kiem_tra to authenticated;

-- Speaking (migration 04)
grant select on table public.nhan_vat to authenticated;
grant select, insert, update, delete on table public.phien_noi to authenticated;
grant select, insert, update, delete on table public.luot_noi to authenticated;

-- Nội dung (migration 05)
grant select on table public.nguon_noi_dung to authenticated;
grant select, insert, update, delete on table public.doan_noi_dung to authenticated;

-- Từ vựng (migration 06)
grant select, insert, update, delete on table public.bo_tu to authenticated;
grant select, insert, update, delete on table public.tu_da_luu to authenticated;
grant select, insert, update, delete on table public.lich_on_tap to authenticated;
grant select, insert, update, delete on table public.cau_hoi_tu_vung to authenticated;

-- Viết (migration 07)
grant select on table public.de_bai_viet to authenticated;
grant select, insert, update, delete on table public.bai_viet to authenticated;
grant select, insert, update, delete on table public.chu_thich_bai_viet to authenticated;

-- Thông báo & phiên học (migration 08)
grant select, insert, update, delete on table public.thong_bao to authenticated;
grant select, insert, update, delete on table public.phien_hoc to authenticated;
