-- Migration 02: Helper functions + auth.users → public.ho_so trigger
-- Lý do tách: helper dùng xuyên suốt mọi bảng → khai báo trước.

-- Trigger function giữ tươi cap_nhat_luc trên mọi bảng có cột này.
create or replace function public.cap_nhat_thoi_gian()
returns trigger
language plpgsql
as $$
begin
  new.cap_nhat_luc = now();
  return new;
end;
$$;

-- Sau khi auth.users insert (signup hoặc OAuth), tạo hàng public.ho_so tương ứng.
-- Dùng metadata từ provider (Google/Facebook) để fill ten_hien_thi + url_avatar nếu có.
create or replace function public.tao_ho_so_khi_dang_ky()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.ho_so (id, email, ten_hien_thi, url_avatar)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Gắn trigger vào auth.users (Supabase quản lý schema này — chỉ thêm trigger được).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.tao_ho_so_khi_dang_ky();
