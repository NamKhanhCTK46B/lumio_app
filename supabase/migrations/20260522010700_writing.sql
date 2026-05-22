-- Migration 08: Writing domain — de_bai_viet + bai_viet + chu_thich_bai_viet
-- Tối ưu #2: generated column `so_tu`. Tối ưu #5: CHECK score 0–9.

-- 16. de_bai_viet — catalog đề bài public ------------------------------
create table public.de_bai_viet (
  id                uuid primary key default uuid_generate_v4(),
  loai_de           loai_de_viet not null,
  cefr_phu_hop      trinh_do_cefr,
  chu_de            text,
  de_bai            text not null,
  gioi_han_phut     int check (gioi_han_phut is null or gioi_han_phut between 1 and 240),
  so_tu_toi_thieu   int check (so_tu_toi_thieu is null or so_tu_toi_thieu >= 0),
  nguon             text,
  url_nguon         text,
  la_hoat_dong      boolean not null default true,
  tao_luc           timestamptz not null default now(),
  cap_nhat_luc      timestamptz not null default now()
);

create index idx_de_bai_viet_filter on public.de_bai_viet (loai_de, cefr_phu_hop) where la_hoat_dong;

create trigger set_de_bai_viet_cap_nhat_luc
  before update on public.de_bai_viet
  for each row execute function public.cap_nhat_thoi_gian();

alter table public.de_bai_viet enable row level security;
create policy "de_bai_public_read" on public.de_bai_viet for select using (la_hoat_dong);
-- Write chỉ service role.

-- 17. bai_viet — bài viết của user ------------------------------------
create table public.bai_viet (
  id                        uuid primary key default uuid_generate_v4(),
  nguoi_dung_id             uuid not null references public.ho_so(id) on delete cascade,
  de_bai_id                 uuid references public.de_bai_viet(id) on delete set null,
  loai_de                   loai_de_viet not null,
  de_bai_snapshot           text not null,
  noi_dung                  text not null,
  -- Tối ưu #2: generated column thay trigger word-count.
  so_tu                     int generated always as (
    case when length(trim(noi_dung)) = 0 then 0
         else array_length(regexp_split_to_array(trim(noi_dung), '\s+'), 1)
    end
  ) stored,
  thoi_gian_lam_giay        int check (thoi_gian_lam_giay is null or thoi_gian_lam_giay >= 0),
  nop_luc                   timestamptz,
  diem_tong                 numeric(3,1) check (diem_tong is null or diem_tong between 0 and 9),
  score_task_achievement    numeric(3,1) check (score_task_achievement is null or score_task_achievement between 0 and 9),
  score_coherence           numeric(3,1) check (score_coherence is null or score_coherence between 0 and 9),
  score_lexical             numeric(3,1) check (score_lexical is null or score_lexical between 0 and 9),
  score_grammar             numeric(3,1) check (score_grammar is null or score_grammar between 0 and 9),
  tom_tat_phan_hoi          text,
  ban_viet_lai              text,
  tao_luc                   timestamptz not null default now(),
  cap_nhat_luc              timestamptz not null default now()
);

create index idx_bai_viet_user on public.bai_viet (nguoi_dung_id, nop_luc desc);

create trigger set_bai_viet_cap_nhat_luc
  before update on public.bai_viet
  for each row execute function public.cap_nhat_thoi_gian();

alter table public.bai_viet enable row level security;
create policy "bai_viet_owner_select" on public.bai_viet for select using (auth.uid() = nguoi_dung_id);
create policy "bai_viet_owner_insert" on public.bai_viet for insert with check (auth.uid() = nguoi_dung_id);
create policy "bai_viet_owner_update" on public.bai_viet for update using (auth.uid() = nguoi_dung_id);
create policy "bai_viet_owner_delete" on public.bai_viet for delete using (auth.uid() = nguoi_dung_id);

-- 18. chu_thich_bai_viet — chú thích lỗi inline -----------------------
create table public.chu_thich_bai_viet (
  id                uuid primary key default uuid_generate_v4(),
  bai_viet_id       uuid not null references public.bai_viet(id) on delete cascade,
  vi_tri_bat_dau    int not null check (vi_tri_bat_dau >= 0),
  vi_tri_ket_thuc   int not null,
  phan_loai         text not null check (phan_loai in ('grammar','lexical','coherence','task','spelling')),
  muc_do            text not null check (muc_do in ('nhe','nang')),
  doan_goc          text,
  goi_y_sua         text,
  giai_thich        text,
  tao_luc           timestamptz not null default now(),
  constraint chu_thich_range_valid check (vi_tri_ket_thuc > vi_tri_bat_dau)
);

create index idx_chu_thich_offset on public.chu_thich_bai_viet (bai_viet_id, vi_tri_bat_dau);

alter table public.chu_thich_bai_viet enable row level security;
create policy "chu_thich_owner_select" on public.chu_thich_bai_viet
  for select using (exists (
    select 1 from public.bai_viet b
    where b.id = bai_viet_id and b.nguoi_dung_id = auth.uid()
  ));
create policy "chu_thich_owner_insert" on public.chu_thich_bai_viet
  for insert with check (exists (
    select 1 from public.bai_viet b
    where b.id = bai_viet_id and b.nguoi_dung_id = auth.uid()
  ));
create policy "chu_thich_owner_update" on public.chu_thich_bai_viet
  for update using (exists (
    select 1 from public.bai_viet b
    where b.id = bai_viet_id and b.nguoi_dung_id = auth.uid()
  ));
create policy "chu_thich_owner_delete" on public.chu_thich_bai_viet
  for delete using (exists (
    select 1 from public.bai_viet b
    where b.id = bai_viet_id and b.nguoi_dung_id = auth.uid()
  ));
