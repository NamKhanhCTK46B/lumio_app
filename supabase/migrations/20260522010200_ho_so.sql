-- Migration 03: Bảng ho_so (hồ sơ người dùng, mirror auth.users)
-- RLS: chỉ self-select và self-update.

create table public.ho_so (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null unique,
  ten_hien_thi          text,
  url_avatar            text,
  so_dien_thoai         text,
  trinh_do_cefr         trinh_do_cefr default 'A2',
  do_tin_cefr           numeric(3,2) check (do_tin_cefr is null or do_tin_cefr between 0 and 1),
  ngon_ngu_me_de        text default 'vi',
  ngon_ngu_giao_dien    text default 'vi' check (ngon_ngu_giao_dien in ('vi','en')),
  chu_de_giao_dien      text default 'system' check (chu_de_giao_dien in ('light','dark','system')),
  phut_moi_ngay         int default 15 check (phut_moi_ngay between 0 and 240),
  mui_gio               text default 'Asia/Ho_Chi_Minh',
  hoan_tat_onboard_luc  timestamptz,
  tao_luc               timestamptz not null default now(),
  cap_nhat_luc          timestamptz not null default now()
);

create trigger set_ho_so_cap_nhat_luc
  before update on public.ho_so
  for each row execute function public.cap_nhat_thoi_gian();

alter table public.ho_so enable row level security;

create policy "ho_so_self_select" on public.ho_so
  for select using (auth.uid() = id);

create policy "ho_so_self_update" on public.ho_so
  for update using (auth.uid() = id);

-- Cho phép insert chỉ từ trigger (security definer) — không cần policy insert riêng vì
-- trigger tao_ho_so_khi_dang_ky chạy với quyền owner. User thường không insert trực tiếp.

comment on table public.ho_so is
  'Hồ sơ mở rộng của auth.users. Tạo tự động bởi trigger on_auth_user_created.';
