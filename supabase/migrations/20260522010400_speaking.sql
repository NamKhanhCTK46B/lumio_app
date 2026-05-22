-- Migration 05: Speaking domain
-- nhan_vat (catalog public) + phien_noi + luot_noi (partitioned monthly)

-- 7. nhan_vat — persona roleplay, catalog public ------------------------
create table public.nhan_vat (
  id                uuid primary key default uuid_generate_v4(),
  slug              text not null unique,
  ten               text not null,
  url_avatar        text,
  giong             text,
  prompt_nhan_vat   text not null,
  cefr_toi_thieu    trinh_do_cefr,
  nhan              text[],
  la_hoat_dong      boolean not null default true,
  tao_luc           timestamptz not null default now(),
  cap_nhat_luc      timestamptz not null default now()
);

create trigger set_nhan_vat_cap_nhat_luc
  before update on public.nhan_vat
  for each row execute function public.cap_nhat_thoi_gian();

alter table public.nhan_vat enable row level security;
-- Public read cho mọi user đã auth.
create policy "nhan_vat_public_read" on public.nhan_vat
  for select using (la_hoat_dong);
-- Write chỉ qua service role (không cần policy — service-role bypass RLS).

-- 8. phien_noi — cuộc hội thoại user × nhân vật -------------------------
create table public.phien_noi (
  id                        uuid primary key default uuid_generate_v4(),
  nguoi_dung_id             uuid not null references public.ho_so(id) on delete cascade,
  nhan_vat_id               uuid not null references public.nhan_vat(id),
  boi_canh                  text,
  bat_dau_luc               timestamptz not null default now(),
  ket_thuc_luc              timestamptz,
  tong_luot                 int not null default 0,
  diem_phat_am_tb           numeric(4,2) check (diem_phat_am_tb is null or diem_phat_am_tb between 0 and 10),
  tom_tat                   text,
  tao_luc                   timestamptz not null default now(),
  cap_nhat_luc              timestamptz not null default now()
);

create index idx_phien_noi_user on public.phien_noi (nguoi_dung_id, bat_dau_luc desc);

create trigger set_phien_noi_cap_nhat_luc
  before update on public.phien_noi
  for each row execute function public.cap_nhat_thoi_gian();

alter table public.phien_noi enable row level security;
create policy "phien_noi_owner_select" on public.phien_noi for select using (auth.uid() = nguoi_dung_id);
create policy "phien_noi_owner_insert" on public.phien_noi for insert with check (auth.uid() = nguoi_dung_id);
create policy "phien_noi_owner_update" on public.phien_noi for update using (auth.uid() = nguoi_dung_id);
create policy "phien_noi_owner_delete" on public.phien_noi for delete using (auth.uid() = nguoi_dung_id);

-- 9. luot_noi — partitioned by month theo tao_luc -----------------------
-- Tối ưu #1: partition giảm scan cho query gần đây.
-- Tối ưu #4: BRIN index trên tao_luc (append-only).
-- Tối ưu #6: pg_jsonschema validate sua_loi.

create table public.luot_noi (
  id              uuid not null default uuid_generate_v4(),
  phien_id        uuid not null,
  thu_tu_luot     int not null,
  vai             vai_nguoi_noi not null,
  noi_dung        text not null,
  url_audio       text,
  diem_phat_am    numeric(4,2) check (diem_phat_am is null or diem_phat_am between 0 and 10),
  sua_loi         jsonb check (
    sua_loi is null
    or jsonb_matches_schema(
      '{"type":"array","items":{"type":"object","required":["phrase","fix","reason"]}}',
      sua_loi
    )
  ),
  tao_luc         timestamptz not null default now(),
  primary key (id, tao_luc),
  unique (phien_id, thu_tu_luot, tao_luc)
) partition by range (tao_luc);

-- Tạo partition tự động qua pg_partman (1 partition / tháng, premake 3 tháng tới)
select partman.create_parent(
  p_parent_table => 'public.luot_noi',
  p_control      => 'tao_luc',
  p_type         => 'range',
  p_interval     => '1 month',
  p_premake      => 3
);

-- BRIN index — rẻ cho bảng append-only theo thời gian.
create index idx_luot_noi_brin on public.luot_noi using brin (tao_luc) with (pages_per_range = 32);
-- btree cho query render hội thoại theo thứ tự.
create index idx_luot_noi_phien on public.luot_noi (phien_id, thu_tu_luot);

-- RLS — kiểm tra owner qua phien_noi.
alter table public.luot_noi enable row level security;

create policy "luot_noi_owner_select" on public.luot_noi
  for select using (exists (
    select 1 from public.phien_noi p
    where p.id = phien_id and p.nguoi_dung_id = auth.uid()
  ));

create policy "luot_noi_owner_insert" on public.luot_noi
  for insert with check (exists (
    select 1 from public.phien_noi p
    where p.id = phien_id and p.nguoi_dung_id = auth.uid()
  ));

create policy "luot_noi_owner_update" on public.luot_noi
  for update using (exists (
    select 1 from public.phien_noi p
    where p.id = phien_id and p.nguoi_dung_id = auth.uid()
  ));

create policy "luot_noi_owner_delete" on public.luot_noi
  for delete using (exists (
    select 1 from public.phien_noi p
    where p.id = phien_id and p.nguoi_dung_id = auth.uid()
  ));
