-- Migration 07: Vocab domain
-- bo_tu + tu_da_luu (HNSW + GIN + pg_jsonschema) + lich_on_tap (covering index)
-- + cau_hoi_tu_vung

-- 12. bo_tu — sổ từ vựng (user-owned hoặc system topic pack) -----------
create table public.bo_tu (
  id              uuid primary key default uuid_generate_v4(),
  nguoi_dung_id   uuid references public.ho_so(id) on delete cascade,  -- null = bộ hệ thống
  ten             text not null,
  mo_ta           text,
  mau_bia         text default '#E8A33D',
  la_he_thong     boolean not null default false,
  chu_de          text,
  cefr_phu_hop    trinh_do_cefr,
  so_tu           int not null default 0,
  tao_luc         timestamptz not null default now(),
  cap_nhat_luc    timestamptz not null default now(),
  -- Ràng buộc: bộ hệ thống KHÔNG có owner, bộ user PHẢI có owner.
  constraint bo_tu_owner_consistent check (
    (la_he_thong = true and nguoi_dung_id is null)
    or (la_he_thong = false and nguoi_dung_id is not null)
  )
);

create index idx_bo_tu_user on public.bo_tu (nguoi_dung_id, tao_luc desc);
create index idx_bo_tu_system on public.bo_tu (la_he_thong, cefr_phu_hop) where la_he_thong;

create trigger set_bo_tu_cap_nhat_luc
  before update on public.bo_tu
  for each row execute function public.cap_nhat_thoi_gian();

alter table public.bo_tu enable row level security;
-- Đọc: bộ hệ thống cho ai cũng được; bộ user chỉ owner.
create policy "bo_tu_read" on public.bo_tu
  for select using (la_he_thong or auth.uid() = nguoi_dung_id);
create policy "bo_tu_owner_insert" on public.bo_tu
  for insert with check (auth.uid() = nguoi_dung_id and la_he_thong = false);
create policy "bo_tu_owner_update" on public.bo_tu
  for update using (auth.uid() = nguoi_dung_id and la_he_thong = false);
create policy "bo_tu_owner_delete" on public.bo_tu
  for delete using (auth.uid() = nguoi_dung_id and la_he_thong = false);

-- 13. tu_da_luu — từng từ đã lưu --------------------------------------
create table public.tu_da_luu (
  id              uuid primary key default uuid_generate_v4(),
  nguoi_dung_id   uuid not null references public.ho_so(id) on delete cascade,
  bo_tu_id        uuid references public.bo_tu(id) on delete set null,
  tu_goc          text not null,
  loai_tu         text,
  phien_am        text,
  nghia_en        text,
  nghia_vi        text,
  vi_du           jsonb check (
    vi_du is null
    or jsonb_matches_schema(
      '{"type":"array","items":{"type":"object","required":["en","vi"]}}',
      vi_du
    )
  ),
  tu_dong_nghia   text[],
  cefr_phu_hop    trinh_do_cefr,
  nguon_id        uuid references public.nguon_noi_dung(id) on delete set null,
  ngu_canh        text,
  trang_thai      trang_thai_tu not null default 'moi',
  da_danh_dau     boolean not null default false,
  embedding       vector(1536),
  tao_luc         timestamptz not null default now(),
  cap_nhat_luc    timestamptz not null default now()
);

create index idx_tu_da_luu_deck on public.tu_da_luu (nguoi_dung_id, bo_tu_id);
-- Mỗi user chỉ lưu 1 lần cho mỗi tu_goc (chống click "Lưu" 2 lần).
create unique index idx_tu_da_luu_unique on public.tu_da_luu (nguoi_dung_id, tu_goc);
-- pg_trgm GIN cho fuzzy search trên tu_goc.
create index idx_tu_da_luu_trgm on public.tu_da_luu using gin (tu_goc gin_trgm_ops);
-- HNSW cho similar-word lookup.
create index idx_tu_da_luu_embedding on public.tu_da_luu
  using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);

create trigger set_tu_da_luu_cap_nhat_luc
  before update on public.tu_da_luu
  for each row execute function public.cap_nhat_thoi_gian();

alter table public.tu_da_luu enable row level security;
create policy "tu_da_luu_owner_select" on public.tu_da_luu for select using (auth.uid() = nguoi_dung_id);
create policy "tu_da_luu_owner_insert" on public.tu_da_luu for insert with check (auth.uid() = nguoi_dung_id);
create policy "tu_da_luu_owner_update" on public.tu_da_luu for update using (auth.uid() = nguoi_dung_id);
create policy "tu_da_luu_owner_delete" on public.tu_da_luu for delete using (auth.uid() = nguoi_dung_id);

-- 14. lich_on_tap — state SRS (SuperMemo-2) ----------------------------
-- Tối ưu #8: covering index INCLUDE → query "due today" thành index-only scan.
create table public.lich_on_tap (
  id                uuid primary key default uuid_generate_v4(),
  tu_id             uuid not null unique references public.tu_da_luu(id) on delete cascade,
  nguoi_dung_id     uuid not null references public.ho_so(id) on delete cascade,
  he_so_de          numeric(4,2) not null default 2.5,
  so_ngay_cach      int not null default 0,
  so_lan_lap        int not null default 0,
  on_tap_ke_luc     timestamptz not null default now(),
  on_tap_cuoi_luc   timestamptz,
  chat_luong_cuoi   int check (chat_luong_cuoi is null or chat_luong_cuoi between 0 and 5),
  tao_luc           timestamptz not null default now(),
  cap_nhat_luc      timestamptz not null default now()
);

-- Covering index — query "due today" trở thành index-only scan, không chạm heap.
create index idx_lich_on_tap_due
  on public.lich_on_tap (nguoi_dung_id, on_tap_ke_luc)
  include (tu_id, he_so_de, so_ngay_cach, so_lan_lap);

create trigger set_lich_on_tap_cap_nhat_luc
  before update on public.lich_on_tap
  for each row execute function public.cap_nhat_thoi_gian();

alter table public.lich_on_tap enable row level security;
create policy "lich_on_tap_owner_select" on public.lich_on_tap for select using (auth.uid() = nguoi_dung_id);
create policy "lich_on_tap_owner_insert" on public.lich_on_tap for insert with check (auth.uid() = nguoi_dung_id);
create policy "lich_on_tap_owner_update" on public.lich_on_tap for update using (auth.uid() = nguoi_dung_id);
create policy "lich_on_tap_owner_delete" on public.lich_on_tap for delete using (auth.uid() = nguoi_dung_id);

-- 15. cau_hoi_tu_vung — quiz AI sinh từ source -------------------------
create table public.cau_hoi_tu_vung (
  id              uuid primary key default uuid_generate_v4(),
  nguoi_dung_id   uuid not null references public.ho_so(id) on delete cascade,
  nguon_id        uuid not null references public.nguon_noi_dung(id) on delete cascade,
  loai_cau_hoi    text not null check (loai_cau_hoi in ('dien_cho_trong','dich','nghe_go','trac_nghiem')),
  cau_hoi         text not null,
  lua_chon        text[],
  dap_an_dung     text not null,
  cau_tra_loi     text,
  la_dap_an_dung  boolean,
  tra_loi_luc     timestamptz,
  tao_luc         timestamptz not null default now()
);

create index idx_cau_hoi_tv_user on public.cau_hoi_tu_vung (nguoi_dung_id, tao_luc desc);

alter table public.cau_hoi_tu_vung enable row level security;
create policy "cau_hoi_tv_owner_select" on public.cau_hoi_tu_vung for select using (auth.uid() = nguoi_dung_id);
create policy "cau_hoi_tv_owner_insert" on public.cau_hoi_tu_vung for insert with check (auth.uid() = nguoi_dung_id);
create policy "cau_hoi_tv_owner_update" on public.cau_hoi_tu_vung for update using (auth.uid() = nguoi_dung_id);
create policy "cau_hoi_tv_owner_delete" on public.cau_hoi_tu_vung for delete using (auth.uid() = nguoi_dung_id);
