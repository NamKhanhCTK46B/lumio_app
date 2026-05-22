-- Migration 10: Materialized view tăng tốc dashboard streak
-- Tối ưu #7: aggregate phien_hoc → 1 row/user, refresh nightly qua pg_cron.

create materialized view public.mv_thong_ke_nguoi_dung as
select
  nguoi_dung_id,
  count(*) filter (where bat_dau_luc >= now() - interval '7 days')
    as so_phien_7_ngay,
  coalesce(sum(thoi_luong_giay) filter (where bat_dau_luc >= now() - interval '7 days'), 0) / 60
    as phut_7_ngay,
  max(bat_dau_luc) as hoc_gan_nhat_luc
from public.phien_hoc
group by nguoi_dung_id;

-- Unique index trên nguoi_dung_id để refresh CONCURRENTLY được.
create unique index idx_mv_thong_ke_user on public.mv_thong_ke_nguoi_dung (nguoi_dung_id);

comment on materialized view public.mv_thong_ke_nguoi_dung is
  'Aggregate streak + tổng phút 7 ngày gần nhất cho mỗi user. Refresh hằng đêm 03:30 ICT.';
