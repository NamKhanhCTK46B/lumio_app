-- Migration 11: pg_cron scheduled jobs
-- 4 job: nhắc ôn hằng đêm, refresh MV, tổng kết tuần, partman maintenance.

-- Job 1: 03:00 ICT (= 20:00 UTC) — enqueue nhắc ôn từ cho user có từ đến hạn.
select cron.schedule(
  'nhac_on_hang_dem',
  '0 20 * * *',
  $$
  insert into public.thong_bao (nguoi_dung_id, loai, tieu_de, noi_dung, url_hanh_dong, lich_gui_luc)
  select l.nguoi_dung_id,
         'nhac_on'::loai_thong_bao,
         'Bạn có ' || count(*) || ' từ cần ôn',
         'Chỉ vài phút để giữ chuỗi học của bạn.',
         '/vocab/review',
         now()
  from public.lich_on_tap l
  where l.on_tap_ke_luc <= now() + interval '1 day'
  group by l.nguoi_dung_id
  having count(*) >= 1;
  $$
);

-- Job 2: 03:30 ICT — refresh MV streak (CONCURRENTLY để không khoá đọc).
select cron.schedule(
  'refresh_thong_ke',
  '30 20 * * *',
  $$ refresh materialized view concurrently public.mv_thong_ke_nguoi_dung; $$
);

-- Job 3: Chủ nhật 08:00 ICT — tổng kết tuần (placeholder, sẽ chi tiết sau).
select cron.schedule(
  'tong_ket_tuan',
  '0 1 * * 0',
  $$
  insert into public.thong_bao (nguoi_dung_id, loai, tieu_de, noi_dung, url_hanh_dong)
  select mv.nguoi_dung_id,
         'tien_do'::loai_thong_bao,
         'Tổng kết tuần học',
         'Bạn đã học ' || mv.phut_7_ngay || ' phút trong 7 ngày qua.',
         '/dashboard'
  from public.mv_thong_ke_nguoi_dung mv
  where mv.so_phien_7_ngay > 0;
  $$
);

-- Job 4 (đã bỏ): partman_maintenance — không cần khi luot_noi + phien_hoc
-- là bảng thường (không partition). Khi nâng cấp lên partition sau này
-- sẽ thêm lại job này hoặc viết function plpgsql tự tạo partition.
