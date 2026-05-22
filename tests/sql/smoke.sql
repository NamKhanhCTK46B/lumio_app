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

-- 3. Seed data — 5 user demo + 1 user owner
do $$
declare v_demo int; v_owner int;
begin
  select count(*) into v_demo  from public.ho_so where email like '%@lumio.vn';
  select count(*) into v_owner from public.ho_so where email = 'khanh51024@gmail.com';
  if v_demo <> 5 then
    raise exception 'SEED FAIL: ho_so demo count = %, expected 5', v_demo;
  end if;
  if v_owner <> 1 then
    raise exception 'SEED FAIL: owner user khanh51024 chưa được seed';
  end if;
  raise notice 'OK — 5 user demo + 1 owner';
end $$;

-- 3.b Verify password hashing standard
do $$
declare v_helper_len int; v_owner_pwd_ok boolean;
begin
  -- Helper bam_mat_khau phải trả về 60 ký tự bcrypt
  select length(public.bam_mat_khau('test123')) into v_helper_len;
  if v_helper_len <> 60 then
    raise exception 'bam_mat_khau helper trả length = %, expected 60', v_helper_len;
  end if;

  -- Hash của owner user phải verify được với plaintext (test compute, không in plaintext)
  select kiem_tra_mat_khau('#NgNamkhanh!1109', encrypted_password) into v_owner_pwd_ok
  from auth.users where email = 'khanh51024@gmail.com';
  if not v_owner_pwd_ok then
    raise exception 'Owner password hash không verify được';
  end if;
  raise notice 'OK — bcrypt helper + owner password verify';
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

-- 5. luot_noi + phien_hoc tồn tại + có BRIN index trên cột thời gian.
-- (Partition đã bỏ tạm — sẽ thêm lại khi scale > 1M rows.)
do $$
declare v_n int;
begin
  select count(*) into v_n from pg_indexes
   where schemaname = 'public' and tablename = 'luot_noi' and indexname = 'idx_luot_noi_brin';
  if v_n <> 1 then raise exception 'idx_luot_noi_brin thiếu'; end if;

  select count(*) into v_n from pg_indexes
   where schemaname = 'public' and tablename = 'phien_hoc' and indexname = 'idx_phien_hoc_brin';
  if v_n <> 1 then raise exception 'idx_phien_hoc_brin thiếu'; end if;

  raise notice 'OK — BRIN index trên luot_noi + phien_hoc';
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
