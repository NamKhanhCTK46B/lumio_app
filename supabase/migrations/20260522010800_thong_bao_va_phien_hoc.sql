-- Migration 09: thong_bao + phien_hoc (partitioned monthly)

-- 19. thong_bao — feed in-app ----------------------------------------
create table public.thong_bao (
  id              uuid primary key default uuid_generate_v4(),
  nguoi_dung_id   uuid not null references public.ho_so(id) on delete cascade,
  loai            loai_thong_bao not null,
  tieu_de         text not null,
  noi_dung        text,
  url_hanh_dong   text,
  doc_luc         timestamptz,
  lich_gui_luc    timestamptz not null default now(),
  tao_luc         timestamptz not null default now()
);

create index idx_thong_bao_user on public.thong_bao (nguoi_dung_id, doc_luc, tao_luc desc);
-- Partial index cho job "tìm thông báo chưa đọc đến hạn gửi".
create index idx_thong_bao_pending
  on public.thong_bao (lich_gui_luc) where doc_luc is null;

alter table public.thong_bao enable row level security;
create policy "thong_bao_owner_select" on public.thong_bao for select using (auth.uid() = nguoi_dung_id);
create policy "thong_bao_owner_insert" on public.thong_bao for insert with check (auth.uid() = nguoi_dung_id);
create policy "thong_bao_owner_update" on public.thong_bao for update using (auth.uid() = nguoi_dung_id);
create policy "thong_bao_owner_delete" on public.thong_bao for delete using (auth.uid() = nguoi_dung_id);

-- 20. phien_hoc — activity log cho streak (partitioned monthly) ---------
-- Tối ưu #1: partition + Tối ưu #4: BRIN. Tối ưu #5: check thoi_luong >= 0.

create table public.phien_hoc (
  id                uuid not null default uuid_generate_v4(),
  nguoi_dung_id     uuid not null,
  loai_hoat_dong    loai_hoat_dong not null,
  entity_id         uuid,
  bat_dau_luc       timestamptz not null,
  ket_thuc_luc      timestamptz,
  thoi_luong_giay   int check (thoi_luong_giay is null or thoi_luong_giay >= 0),
  chi_so            jsonb,
  tao_luc           timestamptz not null default now(),
  primary key (id, bat_dau_luc)
) partition by range (bat_dau_luc);

-- FK declarative không được trên partitioned table khi có pg_partman quản lý;
-- ràng buộc owner sẽ check qua RLS.

select partman.create_parent(
  p_parent_table => 'public.phien_hoc',
  p_control      => 'bat_dau_luc',
  p_type         => 'range',
  p_interval     => '1 month',
  p_premake      => 3
);

create index idx_phien_hoc_brin on public.phien_hoc using brin (bat_dau_luc) with (pages_per_range = 32);
create index idx_phien_hoc_user on public.phien_hoc (nguoi_dung_id, bat_dau_luc desc);

alter table public.phien_hoc enable row level security;
create policy "phien_hoc_owner_select" on public.phien_hoc for select using (auth.uid() = nguoi_dung_id);
create policy "phien_hoc_owner_insert" on public.phien_hoc for insert with check (auth.uid() = nguoi_dung_id);
create policy "phien_hoc_owner_update" on public.phien_hoc for update using (auth.uid() = nguoi_dung_id);
create policy "phien_hoc_owner_delete" on public.phien_hoc for delete using (auth.uid() = nguoi_dung_id);
