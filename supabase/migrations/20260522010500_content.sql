-- Migration 06: Content domain — nguon_noi_dung + doan_noi_dung
-- Tối ưu #3: HNSW vector index thay IVFFlat.

-- 10. nguon_noi_dung ----------------------------------------------------
create table public.nguon_noi_dung (
  id                uuid primary key default uuid_generate_v4(),
  nguoi_dung_id     uuid not null references public.ho_so(id) on delete cascade,
  loai              loai_nguon not null,
  url               text not null,
  ma_bam_url        text not null,
  tieu_de           text,
  tac_gia           text,
  url_anh_bia       text,
  thoi_luong_giay   int check (thoi_luong_giay is null or thoi_luong_giay >= 0),
  ngon_ngu          text default 'en',
  ban_ghi_loi       text,
  embedding         vector(1536),
  tao_luc           timestamptz not null default now(),
  cap_nhat_luc      timestamptz not null default now()
);

create index idx_nguon_user on public.nguon_noi_dung (nguoi_dung_id, tao_luc desc);
-- Dedup theo URL chuẩn hoá (mỗi user 1 lần lưu 1 URL).
create unique index idx_nguon_dedupe on public.nguon_noi_dung (nguoi_dung_id, ma_bam_url);

-- HNSW: tốc độ ANN ~3× IVFFlat ở < 1M rows, không cần rebuild khi insert.
create index idx_nguon_embedding on public.nguon_noi_dung
  using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);

create trigger set_nguon_nd_cap_nhat_luc
  before update on public.nguon_noi_dung
  for each row execute function public.cap_nhat_thoi_gian();

alter table public.nguon_noi_dung enable row level security;
create policy "nguon_owner_select" on public.nguon_noi_dung for select using (auth.uid() = nguoi_dung_id);
create policy "nguon_owner_insert" on public.nguon_noi_dung for insert with check (auth.uid() = nguoi_dung_id);
create policy "nguon_owner_update" on public.nguon_noi_dung for update using (auth.uid() = nguoi_dung_id);
create policy "nguon_owner_delete" on public.nguon_noi_dung for delete using (auth.uid() = nguoi_dung_id);

-- 11. doan_noi_dung — transcript segments có timestamp ----------------
create table public.doan_noi_dung (
  id              uuid primary key default uuid_generate_v4(),
  nguon_id        uuid not null references public.nguon_noi_dung(id) on delete cascade,
  thu_tu_doan     int not null,
  giay_bat_dau    numeric(8,2),
  giay_ket_thuc   numeric(8,2),
  noi_dung        text not null
);

create unique index idx_doan_order on public.doan_noi_dung (nguon_id, thu_tu_doan);
create index idx_doan_seek on public.doan_noi_dung (nguon_id, giay_bat_dau);

alter table public.doan_noi_dung enable row level security;
-- Owner check qua join với nguon_noi_dung.
create policy "doan_owner_select" on public.doan_noi_dung
  for select using (exists (
    select 1 from public.nguon_noi_dung n
    where n.id = nguon_id and n.nguoi_dung_id = auth.uid()
  ));
create policy "doan_owner_insert" on public.doan_noi_dung
  for insert with check (exists (
    select 1 from public.nguon_noi_dung n
    where n.id = nguon_id and n.nguoi_dung_id = auth.uid()
  ));
create policy "doan_owner_update" on public.doan_noi_dung
  for update using (exists (
    select 1 from public.nguon_noi_dung n
    where n.id = nguon_id and n.nguoi_dung_id = auth.uid()
  ));
create policy "doan_owner_delete" on public.doan_noi_dung
  for delete using (exists (
    select 1 from public.nguon_noi_dung n
    where n.id = nguon_id and n.nguoi_dung_id = auth.uid()
  ));
