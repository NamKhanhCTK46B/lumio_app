# Lumio — Schema cơ sở dữ liệu

> PostgreSQL 15 (qua Supabase) với extension `pgvector`, `pg_cron`, `pg_trgm`.
> Mọi bảng user-owned đều có `user_id` FK → `auth.users(id)` và RLS policy `auth.uid() = user_id`.
> Tất cả bảng đều có `created_at` / `updated_at` (cái sau được trigger giữ tươi).

---

## 0. Extension, helper, quy ước

```sql
create extension if not exists "uuid-ossp";
create extension if not exists vector;       -- pgvector cho embedding
create extension if not exists pg_cron;      -- scheduled jobs
create extension if not exists pg_trgm;      -- fuzzy text search trên từ vựng

-- Trigger updated_at tổng dụng
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Enum CEFR
create type cefr_level as enum ('A1','A2','B1','B2','C1','C2');

-- Các enum khác
create type goal_type as enum ('ielts','toeic','communication','business','travel','movies','academic','other');
create type source_type as enum ('youtube','article','podcast','manual');
create type word_status as enum ('new','learning','reviewing','mastered');
create type essay_task as enum ('ielts_task1','ielts_task2','email','free');
create type notif_type as enum ('review_due','progress','system','achievement');
```

**Quy ước đặt tên**

- Bảng: `snake_case`, **số nhiều** (`users`, `decks`, `vocab_words`).
- PK: `id uuid primary key default uuid_generate_v4()`.
- FK: `<entity>_id uuid references <entity>(id) on delete cascade`.
- Timestamp: hậu tố `_at`, kiểu `timestamptz`.
- Boolean: `is_<state>` (`is_active`, `is_starred`).

---

## 1. `profiles` — Thông tin hồ sơ mở rộng từ `auth.users`

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | **PK**, **FK** → `auth.users(id)` on delete cascade | Mirror id của auth user |
| `email` | `text` | not null, unique | Sync từ `auth.users` qua trigger |
| `display_name` | `text` |  | Tên hiển thị trong app |
| `avatar_url` | `text` |  | URL Supabase Storage |
| `phone` | `text` |  | Tuỳ chọn, theo đề bài |
| `cefr_level` | `cefr_level` | default `'A2'` | Đặt bởi placement test |
| `cefr_confidence` | `numeric(3,2)` | check `between 0 and 1` | Độ tin cậy CEFR |
| `native_language` | `text` | default `'vi'` | ISO 639-1 |
| `ui_language` | `text` | default `'vi'` check (`in ('vi','en')`) | Toggle ngôn ngữ UI |
| `theme` | `text` | default `'system'` check (`in ('light','dark','system')`) | Chế độ màu |
| `daily_goal_minutes` | `int` | default `15`, check `>= 0 and <= 240` | Mục tiêu streak |
| `timezone` | `text` | default `'Asia/Ho_Chi_Minh'` | Lịch nhắc ôn |
| `onboarded_at` | `timestamptz` |  | NULL = chưa hoàn thành onboarding |
| `created_at` | `timestamptz` | default `now()` |  |
| `updated_at` | `timestamptz` | default `now()` |  |

**Chức năng bảng.** Hồ sơ công khai + tuỳ chọn UX. Tách khỏi `auth.users` để có thể expose subset qua RLS mà không lộ phần auth internals.

**Trigger**
- `on_auth_user_created` (schema `auth`) → insert hàng default vào `profiles`.

**RLS**
```sql
alter table profiles enable row level security;
create policy "profiles_self_select" on profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on profiles for update using (auth.uid() = id);
```

---

## 2. `user_goals` — Mục tiêu học từ khảo sát onboarding

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `user_id` | `uuid` | FK → `profiles(id)` on delete cascade | Owner |
| `goal` | `goal_type` | not null | Enum |
| `target_score` | `numeric(4,1)` |  | Ví dụ IELTS 7.0, TOEIC 800 |
| `deadline` | `date` |  | Hạn hoàn thành |
| `is_primary` | `boolean` | default `false` | Mỗi user chỉ có 1 hàng primary |
| `created_at`, `updated_at` |  |  |  |

**Chức năng bảng.** Đầu vào cho kế hoạch onboarding + ưu tiên trên dashboard. Một user có thể có nhiều mục tiêu (ví dụ IELTS *và* đi du lịch).

**Index:** `(user_id, is_primary)`. Partial unique: `unique (user_id) where is_primary`.

---

## 3. `level_assessments` — Lần làm placement test

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `user_id` | `uuid` | FK → `profiles(id)` cascade |  |
| `started_at` | `timestamptz` | not null default `now()` |  |
| `completed_at` | `timestamptz` |  | NULL khi đang làm |
| `result_level` | `cefr_level` |  | Điểm tổng → CEFR |
| `result_confidence` | `numeric(3,2)` |  |  |
| `raw_score` | `int` |  | 0–100 |
| `created_at`, `updated_at` |  |  |  |

**Chức năng bảng.** Lịch sử placement test (user được làm lại mỗi 60 ngày).

---

## 4. `assessment_questions` — Các câu hỏi trong một bài placement

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `assessment_id` | `uuid` | FK → `level_assessments(id)` cascade |  |
| `question_index` | `int` | not null | Thứ tự trong bài |
| `prompt` | `text` | not null | Câu hỏi hiển thị |
| `expected_level` | `cefr_level` | not null | CEFR mà câu này kiểm tra |
| `user_answer` | `text` |  | Free text hoặc transcribed speech |
| `is_correct` | `boolean` |  | Sau khi chấm |
| `ai_feedback` | `text` |  | Giải thích một dòng |
| `created_at` |  |  |  |

**Index:** `(assessment_id, question_index)` unique.

---

## 5. `speaking_characters` — Persona nhân vật roleplay (catalog dùng chung)

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `slug` | `text` | not null unique | URL-friendly id |
| `name` | `text` | not null | "Sophie", "Marcus", "Mei" |
| `avatar_url` | `text` |  | Avatar minh hoạ |
| `accent` | `text` |  | "British", "American GA", "Australian" |
| `persona_prompt` | `text` | not null | System prompt cho LLM |
| `cefr_min` | `cefr_level` |  | Mức tối thiểu khuyến nghị |
| `tags` | `text[]` |  | "casual", "business", "travel" |
| `is_active` | `boolean` | default `true` |  |
| `created_at`, `updated_at` |  |  |  |

**Chức năng bảng.** Catalog nhân vật AI. Public read; write chỉ qua service role.

**RLS:** `select` mở cho mọi user đã auth; `insert/update` giới hạn service role.

---

## 6. `speaking_sessions` — Một cuộc hội thoại giữa user và một nhân vật

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `user_id` | `uuid` | FK → `profiles(id)` cascade |  |
| `character_id` | `uuid` | FK → `speaking_characters(id)` |  |
| `scenario` | `text` |  | "Ordering coffee", "Job interview" |
| `started_at` | `timestamptz` | default `now()` |  |
| `ended_at` | `timestamptz` |  |  |
| `total_turns` | `int` | default `0` |  |
| `avg_pronunciation_score` | `numeric(4,2)` |  | 0–10 |
| `summary` | `text` |  | Wrap-up do LLM sinh |
| `created_at`, `updated_at` |  |  |  |

---

## 7. `speaking_turns` — Từng lượt nói trong một session

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `session_id` | `uuid` | FK → `speaking_sessions(id)` cascade |  |
| `turn_index` | `int` | not null |  |
| `speaker` | `text` | check `in ('user','ai')` |  |
| `text` | `text` | not null | Transcript |
| `audio_url` | `text` |  | Supabase Storage nếu có ghi |
| `pronunciation_score` | `numeric(4,2)` |  | 0–10 (chỉ với lượt user) |
| `corrections` | `jsonb` |  | `[{ phrase, fix, reason }]` |
| `created_at` |  |  |  |

**Index:** `(session_id, turn_index)` unique.

---

## 8. `content_sources` — Nguồn nội dung được import (YouTube / báo / podcast)

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `user_id` | `uuid` | FK → `profiles(id)` cascade |  |
| `type` | `source_type` | not null |  |
| `url` | `text` | not null |  |
| `url_hash` | `text` | not null | SHA-256 của URL chuẩn hoá; key cache |
| `title` | `text` |  |  |
| `author` | `text` |  |  |
| `thumbnail_url` | `text` |  |  |
| `duration_sec` | `int` |  | Độ dài video/audio |
| `language` | `text` | default `'en'` |  |
| `transcript` | `text` |  | Transcript đầy đủ |
| `embedding` | `vector(1536)` |  | Cho "similar content" lookup |
| `created_at`, `updated_at` |  |  |  |

**Index:**
- `(user_id, created_at desc)` — lịch sử đọc của user.
- IVFFlat trên `embedding` (`vector_cosine_ops`).
- `(user_id, url_hash)` unique để dedupe.

**Chức năng bảng.** Cache nội dung đã trích → user paste lại cùng link sẽ tức thì.

---

## 9. `content_segments` — Đoạn transcript có timestamp

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `source_id` | `uuid` | FK → `content_sources(id)` cascade |  |
| `segment_index` | `int` | not null |  |
| `start_sec` | `numeric(8,2)` |  |  |
| `end_sec` | `numeric(8,2)` |  |  |
| `text` | `text` | not null |  |

**Index:** `(source_id, segment_index)` unique; `(source_id, start_sec)`.

**Chức năng bảng.** Sync phụ đề với video / audio. Click vào segment để seek tới giây tương ứng.

---

## 10. `decks` — Sổ từ vựng (user tạo hoặc system topic packs)

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `user_id` | `uuid` | FK → `profiles(id)` cascade; **nullable** với system deck |  |
| `name` | `text` | not null |  |
| `description` | `text` |  |  |
| `cover_color` | `text` | default `'#E8A33D'` | Hex cho card cover |
| `is_system` | `boolean` | default `false` | Topic packs (ví dụ "Travel A2") |
| `topic` | `text` |  | "travel", "business", "movies" |
| `cefr_level` | `cefr_level` |  | Với system deck |
| `word_count` | `int` | default `0` | Giữ tươi bởi trigger |
| `created_at`, `updated_at` |  |  |  |

**RLS:**
- `select` nếu `is_system or auth.uid() = user_id`.
- `insert/update/delete` nếu `auth.uid() = user_id`.

---

## 11. `vocab_words` — Từng từ đã lưu

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `user_id` | `uuid` | FK → `profiles(id)` cascade |  |
| `deck_id` | `uuid` | FK → `decks(id)` set null |  |
| `lemma` | `text` | not null | Dạng từ điển |
| `pos` | `text` |  | Loại từ ("noun") |
| `phonetic_ipa` | `text` |  | `/wɜːd/` |
| `definition_en` | `text` |  |  |
| `definition_vi` | `text` |  |  |
| `examples` | `jsonb` |  | `[{ en, vi, source_id?, segment_id? }]` |
| `synonyms` | `text[]` |  |  |
| `cefr_level` | `cefr_level` |  | Độ khó ước tính |
| `source_id` | `uuid` | FK → `content_sources(id)` set null | Nơi gặp lần đầu |
| `source_context` | `text` |  | Câu chứa từ |
| `status` | `word_status` | default `'new'` |  |
| `is_starred` | `boolean` | default `false` |  |
| `embedding` | `vector(1536)` |  | Dedup + similar-word lookup |
| `created_at`, `updated_at` |  |  |  |

**Index:**
- `(user_id, deck_id)`.
- `(user_id, lemma)` unique (mỗi user chỉ có 1 entry cho 1 từ).
- pg_trgm GIN trên `lemma` cho fuzzy search.
- IVFFlat trên `embedding`.

---

## 12. `vocab_reviews` — Trạng thái scheduling SRS

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `word_id` | `uuid` | FK → `vocab_words(id)` cascade unique |  |
| `user_id` | `uuid` | FK → `profiles(id)` cascade | Denormalize cho perf RLS |
| `ease_factor` | `numeric(4,2)` | default `2.5` | EF của SM-2 |
| `interval_days` | `int` | default `0` |  |
| `repetition` | `int` | default `0` |  |
| `next_review_at` | `timestamptz` | not null default `now()` |  |
| `last_reviewed_at` | `timestamptz` |  |  |
| `last_quality` | `int` |  | Grade 0–5 của SM-2 |
| `created_at`, `updated_at` |  |  |  |

**Index:** `(user_id, next_review_at)` — query "từ đến hạn hôm nay".

**Chức năng bảng.** Triển khai SuperMemo-2 spaced repetition.

---

## 13. `vocab_quizzes` — Quiz do AI sinh theo content source

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `user_id` | `uuid` | FK → `profiles(id)` cascade |  |
| `source_id` | `uuid` | FK → `content_sources(id)` cascade | Quiz đến từ source này |
| `question_type` | `text` | check `in ('fill_blank','translate','listen_type','multiple_choice')` |  |
| `question` | `text` | not null |  |
| `choices` | `text[]` |  | Với MCQ |
| `correct_answer` | `text` | not null |  |
| `user_answer` | `text` |  |  |
| `is_correct` | `boolean` |  |  |
| `answered_at` | `timestamptz` |  |  |
| `created_at` |  |  |  |

---

## 14. `essay_prompts` — Đề bài viết (system catalog)

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `task_type` | `essay_task` | not null |  |
| `cefr_level` | `cefr_level` |  | Trình độ khuyến nghị |
| `topic` | `text` |  | "environment", "education" |
| `prompt` | `text` | not null | Đề bài |
| `time_limit_min` | `int` |  | 20 / 40 phút |
| `min_words` | `int` |  | 150 / 250 |
| `source` | `text` |  | "British Council", "IELTS Liz", "Cambridge Past Paper" |
| `source_url` | `text` |  | Link gốc — bắt buộc nếu có |
| `is_active` | `boolean` | default `true` |  |
| `created_at`, `updated_at` |  |  |  |

**Chức năng bảng.** Catalog đề bài (xem `CONTENT_SOURCES.md`). Public read.

---

## 15. `essays` — Bài viết của user

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `user_id` | `uuid` | FK → `profiles(id)` cascade |  |
| `prompt_id` | `uuid` | FK → `essay_prompts(id)` set null | NULL nếu free writing |
| `task_type` | `essay_task` | not null |  |
| `prompt` | `text` | not null | Snapshot đề (đề phòng xoá prompt) |
| `body` | `text` | not null | Bài viết của user |
| `word_count` | `int` |  | Tính lúc lưu |
| `time_spent_sec` | `int` |  | Bộ đếm thời gian viết |
| `submitted_at` | `timestamptz` |  | NULL khi còn nháp |
| `overall_band` | `numeric(3,1)` |  | 0.0–9.0 |
| `score_task_achievement` | `numeric(3,1)` |  |  |
| `score_coherence` | `numeric(3,1)` |  |  |
| `score_lexical` | `numeric(3,1)` |  |  |
| `score_grammar` | `numeric(3,1)` |  |  |
| `feedback_summary` | `text` |  | Phản hồi tổng một đoạn |
| `rewritten_version` | `text` |  | Bản viết lại bởi AI |
| `created_at`, `updated_at` |  |  |  |

**Index:** `(user_id, submitted_at desc)`.

---

## 16. `essay_annotations` — Chú thích lỗi inline trên bài viết

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `essay_id` | `uuid` | FK → `essays(id)` cascade |  |
| `start_offset` | `int` | not null | Vị trí ký tự trong `essays.body` |
| `end_offset` | `int` | not null |  |
| `category` | `text` | check `in ('grammar','lexical','coherence','task','spelling')` |  |
| `severity` | `text` | check `in ('minor','major')` |  |
| `original_text` | `text` |  |  |
| `suggestion` | `text` |  |  |
| `explanation` | `text` |  | Giải thích — phần *dạy học* |
| `created_at` |  |  |  |

**Index:** `(essay_id, start_offset)`.

---

## 17. `notifications` — Feed thông báo in-app

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `user_id` | `uuid` | FK → `profiles(id)` cascade |  |
| `type` | `notif_type` | not null |  |
| `title` | `text` | not null |  |
| `body` | `text` |  |  |
| `action_url` | `text` |  | Deep link |
| `read_at` | `timestamptz` |  | NULL = chưa đọc |
| `scheduled_for` | `timestamptz` | default `now()` | Nhắc nhở trễ |
| `created_at` |  |  |  |

**Index:** `(user_id, read_at, created_at desc)`; `(scheduled_for) where read_at is null`.

**Realtime:** client subscribe channel `notifications:user:<uid>`; INSERT mới đẩy về UI.

---

## 18. `study_sessions` — Activity log cho streak + biểu đồ tiến độ

| Trường | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | `uuid` | PK |  |
| `user_id` | `uuid` | FK → `profiles(id)` cascade |  |
| `activity` | `text` | check `in ('speaking','vocab_review','reading','writing','quiz')` |  |
| `entity_id` | `uuid` |  | Polymorphic: session/word/essay id |
| `started_at` | `timestamptz` | not null |  |
| `ended_at` | `timestamptz` |  |  |
| `duration_sec` | `int` |  |  |
| `metric` | `jsonb` |  | Stats theo activity (`{ words_reviewed: 12 }`) |
| `created_at` |  |  |  |

**Index:** `(user_id, started_at desc)`.

**Chức năng bảng.** Nguồn sự thật cho streak, biểu đồ phút/tuần, widget dashboard.

---

## 19. Tóm tắt ER (cardinality)

```
profiles (1) ─< user_goals (N)
profiles (1) ─< level_assessments (N) ─< assessment_questions (N)
profiles (1) ─< speaking_sessions (N) ─< speaking_turns (N)
                speaking_sessions (N) >─ speaking_characters (1)
profiles (1) ─< content_sources (N) ─< content_segments (N)
profiles (1) ─< decks (N) ─< vocab_words (N) ── vocab_reviews (1:1)
                vocab_words (N) >─ content_sources (0..1)
profiles (1) ─< vocab_quizzes (N) >─ content_sources (1)
essay_prompts (1) >─< essays (N) ─< essay_annotations (N)
profiles (1) ─< essays (N)
profiles (1) ─< notifications (N)
profiles (1) ─< study_sessions (N)
```

---

## 20. Template RLS policy

Áp dụng cho mọi bảng user-owned:

```sql
alter table <t> enable row level security;
create policy "<t>_owner_select" on <t> for select using (auth.uid() = user_id);
create policy "<t>_owner_insert" on <t> for insert with check (auth.uid() = user_id);
create policy "<t>_owner_update" on <t> for update using (auth.uid() = user_id);
create policy "<t>_owner_delete" on <t> for delete using (auth.uid() = user_id);
```

Với catalog dùng chung (`speaking_characters`, system decks, `essay_prompts`):
```sql
create policy "..._public_read" on <t> for select using (true);
-- write chỉ qua service role
```

---

## 21. Scheduled jobs (`pg_cron`)

```sql
-- Hằng đêm 03:00 ICT: enqueue thông báo ôn từ
select cron.schedule(
  'enqueue_due_reviews',
  '0 20 * * *',  -- 20:00 UTC = 03:00 ICT
  $$
  insert into notifications (user_id, type, title, body, action_url, scheduled_for)
  select vr.user_id,
         'review_due',
         'Bạn có ' || count(*) || ' từ cần ôn',
         'Chỉ tốn vài phút để giữ chuỗi học của bạn.',
         '/vocab/review',
         now()
  from vocab_reviews vr
  where vr.next_review_at <= now() + interval '1 day'
  group by vr.user_id
  having count(*) >= 1;
  $$
);

-- Chủ nhật hằng tuần: tổng kết tiến độ
select cron.schedule('weekly_progress', '0 1 * * 0', $$ ... $$);
```
