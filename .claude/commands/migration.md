---
description: Tạo Supabase migration mới với 4 RLS policy + trigger updated_at + types regen (Postgres 15).
argument-hint: [slug-kebab-case]
allowed-tools: Read Grep Edit Write Bash(npx supabase *) Bash(pnpm exec *)
model: claude-opus-4-7
effort: medium
---

# /migration `$ARGUMENTS`

Tạo database migration cho schema change. Slug ngắn, kebab-case (vd. `speaking-attempts`, `add-essay-versions`, `roleplay-sessions`).

## Quy trình

### Bước 1 — Đọc `docs/DATABASE.md` hẹp

```
Grep "^## \d+\. `<tên_bảng>`" docs/DATABASE.md      # line number
Read docs/DATABASE.md offset=<line> limit=80
```

Tóm tắt 1 câu thay đổi (thêm bảng / thêm cột / thêm enum / thêm index).

### Bước 2 — Generate file qua Supabase CLI

```bash
npx supabase migration new $ARGUMENTS
```

→ tạo `supabase/migrations/<timestamp>_$ARGUMENTS.sql`.

### Bước 3 — SQL template (BẮT BUỘC cho bảng user-owned)

```sql
-- ====================================================================
-- $ARGUMENTS: <mô tả ngắn>
-- ====================================================================

-- 1. Table
create table public.<name> (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- columns ...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Indexes
create index <name>_user_id_idx on public.<name>(user_id);
-- Thêm index cho cột thường WHERE / ORDER BY (vd. user_id + created_at desc cho timeline)

-- 3. updated_at trigger
create trigger set_<name>_updated_at
  before update on public.<name>
  for each row execute function public.set_updated_at();

-- 4. RLS — BẮT BUỘC trên mọi bảng user-owned
alter table public.<name> enable row level security;

create policy "<name>_owner_select" on public.<name>
  for select using (auth.uid() = user_id);
create policy "<name>_owner_insert" on public.<name>
  for insert with check (auth.uid() = user_id);
create policy "<name>_owner_update" on public.<name>
  for update using (auth.uid() = user_id);
create policy "<name>_owner_delete" on public.<name>
  for delete using (auth.uid() = user_id);

-- 5. Rollback (comment, sẵn sàng khi cần)
-- drop table public.<name> cascade;
```

### Bước 4 — Regenerate TypeScript types

```bash
npx supabase gen types typescript --local > src/types/supabase.ts
```

### Bước 5 — Test local

```bash
npx supabase db reset           # chỉ khi KHÔNG có dữ liệu thật ở local
npx supabase db push --dry-run  # check sẽ làm gì lên remote
```

### Bước 6 — Cập nhật `docs/DATABASE.md`

Thêm section mới (mô tả bảng + cardinality) + cập nhật §19 (ER diagram) nếu có quan hệ mới.

### Bước 7 — Commit

```
feat(db): thêm bảng <name>

<lý do nghiệp vụ>

Refs: UC<n>
```

## Checklist trước khi xong

- [ ] FK cascade hợp lý (delete user → delete row con).
- [ ] Index trên `user_id` + cột thường query (timeline `(user_id, created_at desc)`, lookup `(user_id, <key>)`).
- [ ] Trigger `set_<name>_updated_at`.
- [ ] RLS bật + 4 policy chuẩn.
- [ ] Rollback dưới comment.
- [ ] `src/types/supabase.ts` regenerated.
- [ ] Repository `src/lib/repositories/<name>.repo.ts` tạo/cập nhật.

## Quy tắc auth (Supabase SSR 2026)

- ✅ Repository method nhận `supabase: SupabaseClient` làm tham số đầu — **KHÔNG** nhận `userId`.
- ✅ Server-side query/mutation chạy với client tạo từ `await createClient()` (đã có cookies từ request).
- ✅ Auth check qua `supabase.auth.getClaims()`, **không** `getSession()` (không revalidate token).
- ✅ Tin RLS lo quyền — **không** `.eq('user_id', userId)` thủ công.

## Anti-pattern bắt buộc kiểm tra

- ❌ `alter table ... disable row level security` — không bao giờ với bảng user-owned.
- ❌ `policy ... using (true)` — equivalent disable RLS.
- ❌ FK không có `on delete` rule → orphan rows khi user xoá.
- ❌ Cột nullable hỗn loạn không có default → migration phá production khi insert.
- ❌ Index thiếu trên `user_id` → mọi query RLS đều seq scan.
- ❌ Quên trigger `set_<name>_updated_at` → cột `updated_at` cứng đơ.
- ❌ Lưu audio/file binary trực tiếp trong bảng → dùng Supabase Storage + lưu path string.
