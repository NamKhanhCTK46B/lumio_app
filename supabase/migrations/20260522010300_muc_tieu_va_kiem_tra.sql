-- Migration 04: muc_tieu_nd + bai_kiem_tra_trinh_do + cau_hoi_kiem_tra
-- 3 bảng đầu vào onboarding flow (UC1–UC3).

-- 4. muc_tieu_nd ----------------------------------------------------------
create table public.muc_tieu_nd (
  id                  uuid primary key default uuid_generate_v4(),
  nguoi_dung_id       uuid not null references public.ho_so(id) on delete cascade,
  muc_tieu            loai_muc_tieu not null,
  diem_muc_tieu       numeric(4,1),
  han_chot            date,
  la_muc_tieu_chinh   boolean not null default false,
  tao_luc             timestamptz not null default now(),
  cap_nhat_luc        timestamptz not null default now()
);

create index idx_muc_tieu_nd_user on public.muc_tieu_nd (nguoi_dung_id, la_muc_tieu_chinh);
-- Mỗi user chỉ có 1 mục tiêu chính.
create unique index idx_muc_tieu_nd_chinh
  on public.muc_tieu_nd (nguoi_dung_id)
  where la_muc_tieu_chinh;

create trigger set_muc_tieu_nd_cap_nhat_luc
  before update on public.muc_tieu_nd
  for each row execute function public.cap_nhat_thoi_gian();

alter table public.muc_tieu_nd enable row level security;
create policy "muc_tieu_nd_owner_select" on public.muc_tieu_nd for select using (auth.uid() = nguoi_dung_id);
create policy "muc_tieu_nd_owner_insert" on public.muc_tieu_nd for insert with check (auth.uid() = nguoi_dung_id);
create policy "muc_tieu_nd_owner_update" on public.muc_tieu_nd for update using (auth.uid() = nguoi_dung_id);
create policy "muc_tieu_nd_owner_delete" on public.muc_tieu_nd for delete using (auth.uid() = nguoi_dung_id);

-- 5. bai_kiem_tra_trinh_do -----------------------------------------------
create table public.bai_kiem_tra_trinh_do (
  id                    uuid primary key default uuid_generate_v4(),
  nguoi_dung_id         uuid not null references public.ho_so(id) on delete cascade,
  bat_dau_luc           timestamptz not null default now(),
  hoan_thanh_luc        timestamptz,
  trinh_do_ket_qua      trinh_do_cefr,
  do_tin_ket_qua        numeric(3,2) check (do_tin_ket_qua is null or do_tin_ket_qua between 0 and 1),
  diem_tho              int check (diem_tho is null or diem_tho between 0 and 100),
  tao_luc               timestamptz not null default now(),
  cap_nhat_luc          timestamptz not null default now()
);

create index idx_bktdd_user on public.bai_kiem_tra_trinh_do (nguoi_dung_id, bat_dau_luc desc);

create trigger set_bktdd_cap_nhat_luc
  before update on public.bai_kiem_tra_trinh_do
  for each row execute function public.cap_nhat_thoi_gian();

alter table public.bai_kiem_tra_trinh_do enable row level security;
create policy "bktdd_owner_select" on public.bai_kiem_tra_trinh_do for select using (auth.uid() = nguoi_dung_id);
create policy "bktdd_owner_insert" on public.bai_kiem_tra_trinh_do for insert with check (auth.uid() = nguoi_dung_id);
create policy "bktdd_owner_update" on public.bai_kiem_tra_trinh_do for update using (auth.uid() = nguoi_dung_id);
create policy "bktdd_owner_delete" on public.bai_kiem_tra_trinh_do for delete using (auth.uid() = nguoi_dung_id);

-- 6. cau_hoi_kiem_tra ----------------------------------------------------
create table public.cau_hoi_kiem_tra (
  id                  uuid primary key default uuid_generate_v4(),
  bai_kiem_tra_id     uuid not null references public.bai_kiem_tra_trinh_do(id) on delete cascade,
  thu_tu              int not null,
  cau_hoi             text not null,
  trinh_do_du_kien    trinh_do_cefr not null,
  cau_tra_loi         text,
  la_dap_an_dung      boolean,
  phan_hoi_ai         text,
  tao_luc             timestamptz not null default now()
);

create unique index idx_cau_hoi_kiem_tra_order
  on public.cau_hoi_kiem_tra (bai_kiem_tra_id, thu_tu);

alter table public.cau_hoi_kiem_tra enable row level security;

-- Owner check qua join với bài kiểm tra (RLS lan toả qua FK).
create policy "cau_hoi_kt_owner_select" on public.cau_hoi_kiem_tra
  for select using (exists (
    select 1 from public.bai_kiem_tra_trinh_do b
    where b.id = bai_kiem_tra_id and b.nguoi_dung_id = auth.uid()
  ));

create policy "cau_hoi_kt_owner_insert" on public.cau_hoi_kiem_tra
  for insert with check (exists (
    select 1 from public.bai_kiem_tra_trinh_do b
    where b.id = bai_kiem_tra_id and b.nguoi_dung_id = auth.uid()
  ));

create policy "cau_hoi_kt_owner_update" on public.cau_hoi_kiem_tra
  for update using (exists (
    select 1 from public.bai_kiem_tra_trinh_do b
    where b.id = bai_kiem_tra_id and b.nguoi_dung_id = auth.uid()
  ));

create policy "cau_hoi_kt_owner_delete" on public.cau_hoi_kiem_tra
  for delete using (exists (
    select 1 from public.bai_kiem_tra_trinh_do b
    where b.id = bai_kiem_tra_id and b.nguoi_dung_id = auth.uid()
  ));
