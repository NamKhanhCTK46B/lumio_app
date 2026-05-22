-- Smoke test schema sau khi `supabase db reset` + seed.
-- Chạy bởi .github/workflows/db-verify.yml.

\set ON_ERROR_STOP on

-- 1. 18 bảng public.* xuất hiện đầy đủ
do $$
declare
  v_expected text[] := array[
    'ho_so','muc_tieu_nd','bai_kiem_tra_trinh_do','cau_hoi_kiem_tra',
    'nhan_vat','phien_noi','luot_noi',
    'nguon_noi_dung','doan_noi_dung',
    'bo_tu','tu_da_luu','lich_on_tap','cau_hoi_tu_vung',
    'de_bai_viet','bai_viet','chu_thich_bai_viet',
    'thong_bao','phien_hoc'
  ];
  v_table text;
  v_found int;
begin
  foreach v_table in array v_expected loop
    select count(*) into v_found
    from information_schema.tables
    where table_schema = 'public' and table_name = v_table;
    if v_found = 0 then
      raise exception 'MISSING TABLE: %', v_table;
    end if;
  end loop;
  raise notice 'OK — 18 bảng public.* tồn tại';
end $$;

-- 2. RLS bật trên tất cả bảng user-owned
do $$
declare
  v_table text;
  v_owned text[] := array[
    'ho_so','muc_tieu_nd','bai_kiem_tra_trinh_do','cau_hoi_kiem_tra',
    'phien_noi','luot_noi','nguon_noi_dung','doan_noi_dung',
    'bo_tu','tu_da_luu','lich_on_tap','cau_hoi_tu_vung',
    'bai_viet','chu_thich_bai_viet','thong_bao','phien_hoc'
  ];
  v_rls boolean;
begin
  foreach v_table in array v_owned loop
    select rowsecurity into v_rls from pg_tables
    where schemaname = 'public' and tablename = v_table;
    if not v_rls then
      raise exception 'RLS không bật trên bảng: %', v_table;
    end if;
  end loop;
  raise notice 'OK — RLS bật trên mọi bảng user-owned';
end $$;

-- 3. Seed data — 5 user demo
do $$
declare v_n int;
begin
  select count(*) into v_n from public.ho_so where email like '%@lumio.vn';
  if v_n <> 5 then
    raise exception 'SEED FAIL: ho_so demo count = %, expected 5', v_n;
  end if;
  raise notice 'OK — 5 user demo';
end $$;

-- 4. Catalog đầy đủ
do $$
declare
  v_nhan_vat int;
  v_bo_tu_sys int;
  v_de_bai int;
begin
  select count(*) into v_nhan_vat  from public.nhan_vat;
  select count(*) into v_bo_tu_sys from public.bo_tu where la_he_thong;
  select count(*) into v_de_bai    from public.de_bai_viet;
  if v_nhan_vat < 3  then raise exception 'nhan_vat = %, expected >= 3',  v_nhan_vat; end if;
  if v_bo_tu_sys < 6 then raise exception 'bo_tu system = %, expected >= 6', v_bo_tu_sys; end if;
  if v_de_bai < 10   then raise exception 'de_bai_viet = %, expected >= 10', v_de_bai; end if;
  raise notice 'OK — catalog: nhan_vat=%, bo_tu_sys=%, de_bai=%', v_nhan_vat, v_bo_tu_sys, v_de_bai;
end $$;

-- 5. Partition của luot_noi và phien_hoc
do $$
declare v_n int;
begin
  select count(*) into v_n
  from pg_inherits i
  where inhparent = 'public.luot_noi'::regclass;
  if v_n < 1 then raise exception 'luot_noi partition count = %, expected >= 1', v_n; end if;

  select count(*) into v_n
  from pg_inherits i
  where inhparent = 'public.phien_hoc'::regclass;
  if v_n < 1 then raise exception 'phien_hoc partition count = %, expected >= 1', v_n; end if;

  raise notice 'OK — partition cho luot_noi + phien_hoc';
end $$;

-- 6. MV streak phải có sau seed
do $$
declare v_n int;
begin
  select count(*) into v_n from public.mv_thong_ke_nguoi_dung;
  if v_n = 0 then raise exception 'mv_thong_ke_nguoi_dung empty'; end if;
  raise notice 'OK — mv_thong_ke_nguoi_dung có % row', v_n;
end $$;

-- 7. Storage buckets
do $$
declare v_n int;
begin
  select count(*) into v_n from storage.buckets where id in ('avatars','audio');
  if v_n <> 2 then raise exception 'storage buckets count = %, expected 2', v_n; end if;
  raise notice 'OK — bucket avatars + audio';
end $$;

select 'SMOKE TEST PASS' as result;
