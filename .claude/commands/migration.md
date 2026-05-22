---
name: migration
description: Tạo Supabase migration với bảng + RLS policy + trigger updated_at
model: claude-opus-4-7
thinking: medium
---

# /migration <slug>

Tạo một database migration mới (Supabase CLI format) cho schema change.

## Quy trình

1. **Đọc docs/DATABASE.md** chỉ section của bảng liên quan (đừng read full file):
   ```
   Grep "^## \d+\. \`<tên_bảng>\`" docs/DATABASE.md
   Read docs/DATABASE.md offset=<line> limit=80
   ```

2. **Tạo migration file:**
   ```bash
   npx supabase migration new <slug>
   ```
   Tạo `supabase/migrations/<timestamp>_<slug>.sql`.

3. **Template bắt buộc** cho mỗi migration:
   ```sql
   -- ====================================================================
   -- <slug>: <mô tả ngắn>
   -- ====================================================================

   -- 1. Tables
   create table public.<name> (
     id uuid primary key default uuid_generate_v4(),
     user_id uuid not null references auth.users(id) on delete cascade,
     -- columns ...
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now()
   );

   -- 2. Indexes
   create index <name>_user_id_idx on public.<name>(user_id);
   -- thêm index cho mọi cột thường được WHERE / ORDER BY

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

   -- 5. Rollback (comment để có khi cần)
   -- drop table public.<name> cascade;
   ```

4. **Regenerate types:**
   ```bash
   npx supabase gen types typescript --local > src/types/supabase.ts
   ```

5. **Test local:**
   ```bash
   npx supabase db reset       # chỉ chạy nếu KHÔNG có dữ liệu thật
   npx supabase db push --dry-run   # check sẽ làm gì
   ```

6. **Commit:**
   ```
   feat(db): thêm bảng <name>
   ```

## Checklist trước khi xong

- [ ] FK cascade hợp lý (delete user → delete row)
- [ ] Index trên `user_id` + cột query thường xuyên
- [ ] Trigger `set_updated_at` (lấy từ migration đầu tiên)
- [ ] RLS bật + 4 policy (select/insert/update/delete)
- [ ] Rollback có sẵn dưới comment
- [ ] `supabase.ts` types regenerated
- [ ] Repository tương ứng được tạo / cập nhật

## Anti-pattern

- ❌ `disable row level security` — không bao giờ
- ❌ `policy ... using (true)` cho bảng user-owned
- ❌ FK không có `on delete` rule (mặc định NO ACTION → orphan)
- ❌ Cột không nullable mà không có default → migration phá production
