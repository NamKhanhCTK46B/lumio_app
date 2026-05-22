# Lumio — Schema cơ sở dữ liệu (v2 — tiếng Việt + tối ưu)

> PostgreSQL 15 (qua Supabase) với extension `pgvector`, `pg_cron`, `pg_trgm`, `pg_partman`, `pg_jsonschema`.
> Mọi bảng user-owned đều có `nguoi_dung_id` FK → `ho_so(id)` và RLS policy `auth.uid() = nguoi_dung_id`.
> Tất cả bảng đều có `tao_luc` / `cap_nhat_luc` (cái sau được trigger giữ tươi).
>
> **Quy ước v2 (5/2026):** đặt tên bảng + tên trường bằng tiếng Việt không dấu, `snake_case`. Giữ nguyên thuật ngữ tiếng Anh cho chuẩn quốc tế (CEFR, IELTS task achievement / coherence / lexical / grammar, IPA, embedding, slug).

---

## 0. Extension, helper, enum, quy ước

```sql
create extension if not exists "uuid-ossp";
create extension if not exists vector;        -- pgvector cho embedding
create extension if not exists pg_cron;       -- scheduled jobs
create extension if not exists pg_trgm;       -- fuzzy text search trên từ vựng
create extension if not exists pg_partman;    -- quản lý partition tự động
create extension if not exists pg_jsonschema; -- validate jsonb theo schema

-- Trigger updated_at tổng dụng
create or replace function public.cap_nhat_thoi_gian()
returns trigger language plpgsql as $$
begin
  new.cap_nhat_luc = now();
  return new;
end $$;

-- Enum
create type trinh_do_cefr   as enum ('A1','A2','B1','B2','C1','C2');
create type loai_muc_tieu   as enum ('ielts','toeic','giao_tiep','cong_viec','du_lich','phim_anh','hoc_thuat','khac');
create type loai_nguon      as enum ('youtube','bai_bao','podcast','thu_cong');
create type trang_thai_tu   as enum ('moi','dang_hoc','on_tap','thuoc');
create type loai_de_viet    as enum ('ielts_task1','ielts_task2','email','tu_do');
create type loai_thong_bao  as enum ('nhac_on','tien_do','he_thong','thanh_tich');
create type loai_hoat_dong  as enum ('noi','on_tu','doc','viet','quiz');
create type vai_nguoi_noi   as enum ('nguoi_dung','ai');
```

**Quy ước đặt tên**

- Bảng: `snake_case`, **tiếng Việt không dấu**, **số ít** (`ho_so`, `bo_tu`, `tu_da_luu`).
- PK: `id uuid primary key default uuid_generate_v4()`.
- FK: `<thuc_the>_id uuid references <thuc_the>(id) on delete cascade`.
- Timestamp: hậu tố `_luc`, kiểu `timestamptz`.
- Boolean: tiền tố `la_` hoặc `da_` (`la_hoat_dong`, `da_danh_dau`).
- Trường thuần kỹ thuật quốc tế giữ tiếng Anh: `id`, `email`, `url`, `slug`, `embedding`, `score_task_achievement`, `score_coherence`, `score_lexical`, `score_grammar`.

---

## 1. `ho_so` — Hồ sơ người dùng (mở rộng từ `auth.users`)

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users(id)` cascade | Mirror id của auth user |
| `email` | `text` | not null, unique | Sync từ `auth.users` qua trigger |
| `ten_hien_thi` | `text` |  | Tên hiển thị trong app |
| `url_avatar` | `text` |  | Supabase Storage URL |
| `so_dien_thoai` | `text` |  | Tuỳ chọn |
| `trinh_do_cefr` | `trinh_do_cefr` | default `'A2'` | Đặt bởi placement test |
| `do_tin_cefr` | `numeric(3,2)` | check `between 0 and 1` |  |
| `ngon_ngu_me_de` | `text` | default `'vi'` | ISO 639-1 |
| `ngon_ngu_giao_dien` | `text` | default `'vi'`, check (`in ('vi','en')`) | Toggle UI |
| `chu_de_giao_dien` | `text` | default `'system'`, check (`in ('light','dark','system')`) | Theme |
| `phut_moi_ngay` | `int` | default `15`, check `between 0 and 240` | Mục tiêu streak |
| `mui_gio` | `text` | default `'Asia/Ho_Chi_Minh'` |  |
| `hoan_tat_onboard_luc` | `timestamptz` |  | NULL = chưa onboarded |
| `tao_luc` | `timestamptz` | default `now()` |  |
| `cap_nhat_luc` | `timestamptz` | default `now()` |  |

**Trigger.** `on_auth_user_created` (schema `auth`) → insert hàng default vào `ho_so`.

**RLS.**
```sql
alter table ho_so enable row level security;
create policy "ho_so_self_select" on ho_so for select using (auth.uid() = id);
create policy "ho_so_self_update" on ho_so for update using (auth.uid() = id);
```

---

## 2. `muc_tieu_nd` — Mục tiêu học từ khảo sát onboarding

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `nguoi_dung_id` | `uuid` | FK → `ho_so(id)` cascade | Owner |
| `muc_tieu` | `loai_muc_tieu` | not null |  |
| `diem_muc_tieu` | `numeric(4,1)` |  | IELTS 7.0, TOEIC 800… |
| `han_chot` | `date` |  |  |
| `la_muc_tieu_chinh` | `boolean` | default `false` | Mỗi user chỉ 1 hàng chính |
| `tao_luc`, `cap_nhat_luc` |  |  |  |

**Index.** `(nguoi_dung_id, la_muc_tieu_chinh)`. **Partial unique:** `unique (nguoi_dung_id) where la_muc_tieu_chinh`.

---

## 3. `bai_kiem_tra_trinh_do` — Lần làm placement test

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `nguoi_dung_id` | `uuid` | FK → `ho_so(id)` cascade |  |
| `bat_dau_luc` | `timestamptz` | not null default `now()` |  |
| `hoan_thanh_luc` | `timestamptz` |  | NULL khi đang làm |
| `trinh_do_ket_qua` | `trinh_do_cefr` |  |  |
| `do_tin_ket_qua` | `numeric(3,2)` |  |  |
| `diem_tho` | `int` | check `between 0 and 100` |  |
| `tao_luc`, `cap_nhat_luc` |  |  |  |

**Index.** `(nguoi_dung_id, bat_dau_luc desc)`.

---

## 4. `cau_hoi_kiem_tra` — Câu hỏi trong một bài placement

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `bai_kiem_tra_id` | `uuid` | FK → `bai_kiem_tra_trinh_do(id)` cascade |  |
| `thu_tu` | `int` | not null |  |
| `cau_hoi` | `text` | not null |  |
| `trinh_do_du_kien` | `trinh_do_cefr` | not null |  |
| `cau_tra_loi` | `text` |  | Free text hoặc transcript |
| `la_dap_an_dung` | `boolean` |  | Sau khi chấm |
| `phan_hoi_ai` | `text` |  |  |
| `tao_luc` | `timestamptz` | default `now()` |  |

**Index.** `(bai_kiem_tra_id, thu_tu)` unique.

---

## 5. `nhan_vat` — Persona roleplay (catalog public)

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `slug` | `text` | not null unique | URL-friendly id |
| `ten` | `text` | not null | "Sophie", "Marcus"… |
| `url_avatar` | `text` |  |  |
| `giong` | `text` |  | "British", "American GA"… |
| `prompt_nhan_vat` | `text` | not null | System prompt cho LLM |
| `cefr_toi_thieu` | `trinh_do_cefr` |  |  |
| `nhan` | `text[]` |  | "casual", "business"… |
| `la_hoat_dong` | `boolean` | default `true` |  |
| `tao_luc`, `cap_nhat_luc` |  |  |  |

**RLS.** `select` mở cho mọi user đã auth; `insert/update/delete` chỉ service role.

---

## 6. `phien_noi` — Cuộc hội thoại user × nhân vật

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `nguoi_dung_id` | `uuid` | FK → `ho_so(id)` cascade |  |
| `nhan_vat_id` | `uuid` | FK → `nhan_vat(id)` |  |
| `boi_canh` | `text` |  | "Ordering coffee"… |
| `bat_dau_luc` | `timestamptz` | default `now()` |  |
| `ket_thuc_luc` | `timestamptz` |  |  |
| `tong_luot` | `int` | default `0` |  |
| `diem_phat_am_tb` | `numeric(4,2)` | check `between 0 and 10` |  |
| `tom_tat` | `text` |  |  |
| `tao_luc`, `cap_nhat_luc` |  |  |  |

**Index.** `(nguoi_dung_id, bat_dau_luc desc)`.

---

## 7. `luot_noi` — Từng lượt nói  *(PARTITIONED)*

Bảng **tăng nhanh nhất** (~30 lượt/phiên). Partition RANGE theo `tao_luc` (1 partition / tháng) bằng `pg_partman` — **tối ưu #1**.

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | default `uuid_generate_v4()` | PK gồm khoá partition |
| `phien_id` | `uuid` | FK → `phien_noi(id)` cascade |  |
| `thu_tu_luot` | `int` | not null |  |
| `vai` | `vai_nguoi_noi` | not null |  |
| `noi_dung` | `text` | not null | Transcript |
| `url_audio` | `text` |  |  |
| `diem_phat_am` | `numeric(4,2)` | check `between 0 and 10` | Chỉ với lượt user |
| `sua_loi` | `jsonb` | check `jsonb_matches_schema(...)` | `[{ phrase, fix, reason }]` — tối ưu #6 |
| `tao_luc` | `timestamptz` | not null default `now()` | Khoá partition |

```sql
create table luot_noi (
  id uuid default uuid_generate_v4(),
  phien_id uuid not null,
  thu_tu_luot int not null,
  vai vai_nguoi_noi not null,
  noi_dung text not null,
  url_audio text,
  diem_phat_am numeric(4,2) check (diem_phat_am between 0 and 10),
  sua_loi jsonb check (
    sua_loi is null
    or jsonb_matches_schema(
      '{"type":"array","items":{"type":"object","required":["phrase","fix","reason"]}}',
      sua_loi)
  ),
  tao_luc timestamptz not null default now(),
  primary key (id, tao_luc),
  unique (phien_id, thu_tu_luot, tao_luc)
) partition by range (tao_luc);

select partman.create_parent(
  p_parent_table => 'public.luot_noi',
  p_control      => 'tao_luc',
  p_interval     => '1 month',
  p_premake      => 3
);

create index idx_luot_noi_brin on luot_noi using brin (tao_luc) with (pages_per_range = 32);
create index idx_luot_noi_phien on luot_noi (phien_id, thu_tu_luot);
```

---

## 8. `nguon_noi_dung` — Nguồn import (YouTube / báo / podcast)

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `nguoi_dung_id` | `uuid` | FK → `ho_so(id)` cascade |  |
| `loai` | `loai_nguon` | not null |  |
| `url` | `text` | not null |  |
| `ma_bam_url` | `text` | not null | SHA-256 URL chuẩn hoá |
| `tieu_de` | `text` |  |  |
| `tac_gia` | `text` |  |  |
| `url_anh_bia` | `text` |  |  |
| `thoi_luong_giay` | `int` |  |  |
| `ngon_ngu` | `text` | default `'en'` |  |
| `ban_ghi_loi` | `text` |  | Transcript đầy đủ |
| `embedding` | `vector(1536)` |  |  |
| `tao_luc`, `cap_nhat_luc` |  |  |  |

**Index — tối ưu #3.**
```sql
create index idx_nguon_user on nguon_noi_dung (nguoi_dung_id, tao_luc desc);
create unique index idx_nguon_dedupe on nguon_noi_dung (nguoi_dung_id, ma_bam_url);
-- HNSW thay cho IVFFlat (nhanh hơn ở < 1M rows, không cần rebuild khi insert)
create index idx_nguon_embedding on nguon_noi_dung
  using hnsw (embedding vector_cosine_ops) with (m = 16, ef_construction = 64);
```

---

## 9. `doan_noi_dung` — Đoạn transcript có timestamp

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `nguon_id` | `uuid` | FK → `nguon_noi_dung(id)` cascade |  |
| `thu_tu_doan` | `int` | not null |  |
| `giay_bat_dau` | `numeric(8,2)` |  |  |
| `giay_ket_thuc` | `numeric(8,2)` |  |  |
| `noi_dung` | `text` | not null |  |

**Index.** `(nguon_id, thu_tu_doan)` unique; `(nguon_id, giay_bat_dau)`.

---

## 10. `bo_tu` — Sổ từ vựng (user tạo hoặc topic pack hệ thống)

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `nguoi_dung_id` | `uuid` | FK → `ho_so(id)` cascade; nullable với bộ hệ thống |  |
| `ten` | `text` | not null |  |
| `mo_ta` | `text` |  |  |
| `mau_bia` | `text` | default `'#E8A33D'` |  |
| `la_he_thong` | `boolean` | default `false` |  |
| `chu_de` | `text` |  |  |
| `cefr_phu_hop` | `trinh_do_cefr` |  | Với bộ hệ thống |
| `so_tu` | `int` | default `0` | Giữ tươi bởi trigger |
| `tao_luc`, `cap_nhat_luc` |  |  |  |

**RLS.**
- `select`: `la_he_thong or auth.uid() = nguoi_dung_id`.
- `insert/update/delete`: `auth.uid() = nguoi_dung_id`.

---

## 11. `tu_da_luu` — Từng từ đã lưu

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `nguoi_dung_id` | `uuid` | FK → `ho_so(id)` cascade |  |
| `bo_tu_id` | `uuid` | FK → `bo_tu(id)` set null |  |
| `tu_goc` | `text` | not null | Dạng từ điển |
| `loai_tu` | `text` |  | "noun"… |
| `phien_am` | `text` |  | IPA `/wɜːd/` |
| `nghia_en` | `text` |  |  |
| `nghia_vi` | `text` |  |  |
| `vi_du` | `jsonb` | check `jsonb_matches_schema(...)` | `[{ en, vi, nguon_id?, doan_id? }]` — tối ưu #6 |
| `tu_dong_nghia` | `text[]` |  |  |
| `cefr_phu_hop` | `trinh_do_cefr` |  |  |
| `nguon_id` | `uuid` | FK → `nguon_noi_dung(id)` set null |  |
| `ngu_canh` | `text` |  |  |
| `trang_thai` | `trang_thai_tu` | default `'moi'` |  |
| `da_danh_dau` | `boolean` | default `false` |  |
| `embedding` | `vector(1536)` |  |  |
| `tao_luc`, `cap_nhat_luc` |  |  |  |

**Index.**
- `(nguoi_dung_id, bo_tu_id)`.
- `(nguoi_dung_id, tu_goc)` unique.
- GIN pg_trgm trên `tu_goc` cho fuzzy search.
- HNSW trên `embedding` (tối ưu #3).

---

## 12. `lich_on_tap` — Trạng thái scheduling SRS

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `tu_id` | `uuid` | FK → `tu_da_luu(id)` cascade unique |  |
| `nguoi_dung_id` | `uuid` | FK → `ho_so(id)` cascade | Denormalize cho perf RLS |
| `he_so_de` | `numeric(4,2)` | default `2.5` | EF của SM-2 |
| `so_ngay_cach` | `int` | default `0` |  |
| `so_lan_lap` | `int` | default `0` |  |
| `on_tap_ke_luc` | `timestamptz` | not null default `now()` |  |
| `on_tap_cuoi_luc` | `timestamptz` |  |  |
| `chat_luong_cuoi` | `int` | check `between 0 and 5` | Grade SM-2 |
| `tao_luc`, `cap_nhat_luc` |  |  |  |

**Covering index — tối ưu #8.**
```sql
create index idx_lich_on_tap_due
  on lich_on_tap (nguoi_dung_id, on_tap_ke_luc)
  include (tu_id, he_so_de, so_ngay_cach, so_lan_lap);
```
Query "từ đến hạn hôm nay" trở thành **index-only scan**, không chạm heap.

---

## 13. `cau_hoi_tu_vung` — Quiz AI sinh theo nguồn

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `nguoi_dung_id` | `uuid` | FK → `ho_so(id)` cascade |  |
| `nguon_id` | `uuid` | FK → `nguon_noi_dung(id)` cascade |  |
| `loai_cau_hoi` | `text` | check `in ('dien_cho_trong','dich','nghe_go','trac_nghiem')` |  |
| `cau_hoi` | `text` | not null |  |
| `lua_chon` | `text[]` |  | Với trắc nghiệm |
| `dap_an_dung` | `text` | not null |  |
| `cau_tra_loi` | `text` |  |  |
| `la_dap_an_dung` | `boolean` |  |  |
| `tra_loi_luc` | `timestamptz` |  |  |
| `tao_luc` | `timestamptz` | default `now()` |  |

---

## 14. `de_bai_viet` — Đề bài viết (catalog hệ thống)

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `loai_de` | `loai_de_viet` | not null |  |
| `cefr_phu_hop` | `trinh_do_cefr` |  |  |
| `chu_de` | `text` |  |  |
| `de_bai` | `text` | not null |  |
| `gioi_han_phut` | `int` |  | 20 / 40 phút |
| `so_tu_toi_thieu` | `int` |  | 150 / 250 |
| `nguon` | `text` |  | "British Council"… |
| `url_nguon` | `text` |  |  |
| `la_hoat_dong` | `boolean` | default `true` |  |
| `tao_luc`, `cap_nhat_luc` |  |  |  |

**RLS.** Public read.

---

## 15. `bai_viet` — Bài viết của user

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `nguoi_dung_id` | `uuid` | FK → `ho_so(id)` cascade |  |
| `de_bai_id` | `uuid` | FK → `de_bai_viet(id)` set null | NULL nếu free writing |
| `loai_de` | `loai_de_viet` | not null |  |
| `de_bai_snapshot` | `text` | not null | Snapshot đề (đề phòng xoá prompt) |
| `noi_dung` | `text` | not null | Bài viết |
| `so_tu` | `int` | **generated stored** | Tối ưu #2 — không cần trigger |
| `thoi_gian_lam_giay` | `int` |  |  |
| `nop_luc` | `timestamptz` |  | NULL khi còn nháp |
| `diem_tong` | `numeric(3,1)` | check `between 0 and 9` |  |
| `score_task_achievement` | `numeric(3,1)` | check `between 0 and 9` |  |
| `score_coherence` | `numeric(3,1)` | check `between 0 and 9` |  |
| `score_lexical` | `numeric(3,1)` | check `between 0 and 9` |  |
| `score_grammar` | `numeric(3,1)` | check `between 0 and 9` |  |
| `tom_tat_phan_hoi` | `text` |  |  |
| `ban_viet_lai` | `text` |  |  |
| `tao_luc`, `cap_nhat_luc` |  |  |  |

```sql
-- Tối ưu #2: generated column thay trigger word-count
alter table bai_viet add column so_tu int
  generated always as (
    case when trim(noi_dung) = '' then 0
         else array_length(regexp_split_to_array(trim(noi_dung), '\s+'), 1)
    end
  ) stored;
```

**Index.** `(nguoi_dung_id, nop_luc desc)`.

---

## 16. `chu_thich_bai_viet` — Chú thích lỗi inline

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `bai_viet_id` | `uuid` | FK → `bai_viet(id)` cascade |  |
| `vi_tri_bat_dau` | `int` | not null, check `>= 0` |  |
| `vi_tri_ket_thuc` | `int` | not null, check `vi_tri_ket_thuc > vi_tri_bat_dau` | Tối ưu #5 |
| `phan_loai` | `text` | check `in ('grammar','lexical','coherence','task','spelling')` |  |
| `muc_do` | `text` | check `in ('nhe','nang')` |  |
| `doan_goc` | `text` |  |  |
| `goi_y_sua` | `text` |  |  |
| `giai_thich` | `text` |  | Phần *dạy học* |
| `tao_luc` | `timestamptz` | default `now()` |  |

**Index.** `(bai_viet_id, vi_tri_bat_dau)`.

---

## 17. `thong_bao` — Feed thông báo in-app

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `nguoi_dung_id` | `uuid` | FK → `ho_so(id)` cascade |  |
| `loai` | `loai_thong_bao` | not null |  |
| `tieu_de` | `text` | not null |  |
| `noi_dung` | `text` |  |  |
| `url_hanh_dong` | `text` |  | Deep link |
| `doc_luc` | `timestamptz` |  | NULL = chưa đọc |
| `lich_gui_luc` | `timestamptz` | default `now()` |  |
| `tao_luc` | `timestamptz` | default `now()` |  |

**Index.** `(nguoi_dung_id, doc_luc, tao_luc desc)`; partial `(lich_gui_luc) where doc_luc is null`.

**Realtime.** Client subscribe channel `thong_bao:nguoi_dung:<uid>`; INSERT đẩy về UI.

---

## 18. `phien_hoc` — Activity log cho streak  *(PARTITIONED)*

Append-only, tăng nhanh. Partition RANGE theo `bat_dau_luc` (monthly) — **tối ưu #1**.

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | default `uuid_generate_v4()` | PK gồm khoá partition |
| `nguoi_dung_id` | `uuid` | FK → `ho_so(id)` cascade |  |
| `loai_hoat_dong` | `loai_hoat_dong` | not null |  |
| `entity_id` | `uuid` |  | Polymorphic (session/word/essay id) |
| `bat_dau_luc` | `timestamptz` | not null | Khoá partition |
| `ket_thuc_luc` | `timestamptz` |  |  |
| `thoi_luong_giay` | `int` | check `>= 0` |  |
| `chi_so` | `jsonb` |  | Stats theo activity |
| `tao_luc` | `timestamptz` | default `now()` |  |

```sql
create table phien_hoc (
  id uuid default uuid_generate_v4(),
  nguoi_dung_id uuid not null,
  loai_hoat_dong loai_hoat_dong not null,
  entity_id uuid,
  bat_dau_luc timestamptz not null,
  ket_thuc_luc timestamptz,
  thoi_luong_giay int check (thoi_luong_giay >= 0),
  chi_so jsonb,
  tao_luc timestamptz not null default now(),
  primary key (id, bat_dau_luc)
) partition by range (bat_dau_luc);

select partman.create_parent(
  p_parent_table => 'public.phien_hoc',
  p_control      => 'bat_dau_luc',
  p_interval     => '1 month',
  p_premake      => 3
);

-- BRIN — tối ưu #4 (index ~1% size của btree cho append-only)
create index idx_phien_hoc_brin on phien_hoc using brin (bat_dau_luc) with (pages_per_range = 32);
create index idx_phien_hoc_user on phien_hoc (nguoi_dung_id, bat_dau_luc desc);
```

---

## 19. Materialized view tăng tốc dashboard — tối ưu #7

```sql
create materialized view mv_thong_ke_nguoi_dung as
select
  nguoi_dung_id,
  count(*) filter (where bat_dau_luc >= now() - interval '7 days')                                as so_phien_7_ngay,
  coalesce(sum(thoi_luong_giay) filter (where bat_dau_luc >= now() - interval '7 days'), 0) / 60 as phut_7_ngay,
  max(bat_dau_luc)                                                                                as hoc_gan_nhat_luc
from phien_hoc
group by nguoi_dung_id;

create unique index on mv_thong_ke_nguoi_dung (nguoi_dung_id);
```

Refresh hằng đêm qua `pg_cron` (xem §22). Query dashboard từ aggregate 100k+ rows → 1 row index lookup.

---

## 20. Tóm tắt ER (cardinality)

```
ho_so (1) ─< muc_tieu_nd (N)
ho_so (1) ─< bai_kiem_tra_trinh_do (N) ─< cau_hoi_kiem_tra (N)
ho_so (1) ─< phien_noi (N) ─< luot_noi (N)            phien_noi >─ nhan_vat (1)
ho_so (1) ─< nguon_noi_dung (N) ─< doan_noi_dung (N)
ho_so (1) ─< bo_tu (N) ─< tu_da_luu (N) ── lich_on_tap (1:1)
              tu_da_luu (N) >─ nguon_noi_dung (0..1)
ho_so (1) ─< cau_hoi_tu_vung (N) >─ nguon_noi_dung (1)
de_bai_viet (1) >─< bai_viet (N) ─< chu_thich_bai_viet (N)
ho_so (1) ─< bai_viet (N)
ho_so (1) ─< thong_bao (N)
ho_so (1) ─< phien_hoc (N)
```

---

## 21. Template RLS policy

Áp dụng cho mọi bảng user-owned:

```sql
alter table <t> enable row level security;
create policy "<t>_owner_select" on <t> for select using (auth.uid() = nguoi_dung_id);
create policy "<t>_owner_insert" on <t> for insert with check (auth.uid() = nguoi_dung_id);
create policy "<t>_owner_update" on <t> for update using (auth.uid() = nguoi_dung_id);
create policy "<t>_owner_delete" on <t> for delete using (auth.uid() = nguoi_dung_id);
```

Catalog dùng chung (`nhan_vat`, bộ từ hệ thống, `de_bai_viet`):
```sql
create policy "..._public_read" on <t> for select using (true);
-- write chỉ qua service role
```

---

## 22. Scheduled jobs (`pg_cron`)

```sql
-- 03:00 ICT hằng đêm: enqueue nhắc ôn từ
select cron.schedule(
  'nhac_on_hang_dem',
  '0 20 * * *',  -- 20:00 UTC = 03:00 ICT
  $$
  insert into thong_bao (nguoi_dung_id, loai, tieu_de, noi_dung, url_hanh_dong, lich_gui_luc)
  select l.nguoi_dung_id,
         'nhac_on',
         'Bạn có ' || count(*) || ' từ cần ôn',
         'Chỉ vài phút để giữ chuỗi học của bạn.',
         '/vocab/review',
         now()
  from lich_on_tap l
  where l.on_tap_ke_luc <= now() + interval '1 day'
  group by l.nguoi_dung_id
  having count(*) >= 1;
  $$
);

-- 03:30 ICT mỗi đêm: refresh MV streak
select cron.schedule(
  'refresh_thong_ke',
  '30 20 * * *',
  $$ refresh materialized view concurrently mv_thong_ke_nguoi_dung; $$
);

-- Chủ nhật 08:00 ICT: tổng kết tuần
select cron.schedule('tong_ket_tuan', '0 1 * * 0', $$ ... $$);

-- Bảo trì partition hằng ngày
select cron.schedule(
  'partman_maintenance',
  '0 17 * * *',
  $$ call partman.run_maintenance_proc(); $$
);
```

---

## 23. Tóm tắt 8 tối ưu hiệu năng (v2)

| # | Tối ưu | Bảng áp dụng | Lợi ích |
|---|---|---|---|
| 1 | **Partition RANGE monthly** (`pg_partman`) | `luot_noi`, `phien_hoc` | Query gần đây quét < 1/12 dữ liệu; drop partition cũ rẻ |
| 2 | **Generated column** `so_tu` | `bai_viet` | Bỏ trigger word-count; luôn tươi |
| 3 | **HNSW vector index** | `nguon_noi_dung.embedding`, `tu_da_luu.embedding` | Tốc độ ANN ~3× IVFFlat ở < 1M rows |
| 4 | **BRIN index** trên `tao_luc/bat_dau_luc` | `luot_noi`, `phien_hoc` | Index ~1% size của btree cho bảng append-only |
| 5 | **CHECK** số liệu nghiệp vụ | `bai_viet.score_*`, `lich_on_tap.chat_luong_cuoi`, `phien_noi.diem_phat_am_tb`, `chu_thich_bai_viet.vi_tri_*`, `phien_hoc.thoi_luong_giay` | Dữ liệu sai chết tại DB, không lan vào UI |
| 6 | **pg_jsonschema** validate jsonb | `luot_noi.sua_loi`, `tu_da_luu.vi_du` | Cấu trúc jsonb không drift theo phiên bản LLM |
| 7 | **Materialized view** | `mv_thong_ke_nguoi_dung` | Dashboard streak: aggregate → 1 row lookup |
| 8 | **Covering index INCLUDE** | `lich_on_tap` due-today | Query SRS → index-only scan |

Khi triển khai migration, thứ tự đề xuất theo độ rủi ro (thấp → cao): #5 → #8 → #4 → #3 → #2 → #6 → #7 → #1.
