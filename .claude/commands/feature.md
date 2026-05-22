---
description: Triển khai use case UC1–UC20 từ docs/USE_CASES.md (đọc section, lập kế hoạch file, dừng xác nhận nếu > 3 file mới).
argument-hint: [UC-number]
allowed-tools: Read Grep Glob Edit Write Bash(pnpm typecheck) Bash(pnpm lint) Bash(pnpm test) Bash(pnpm exec *)
model: claude-opus-4-7
effort: medium
---

# /feature `$ARGUMENTS`

Triển khai use case UC$ARGUMENTS theo `docs/USE_CASES.md`. Trọng tâm Lumio: **luyện đọc / phát âm / giao tiếp tiếng Anh** cho người Việt.

## Quy trình bắt buộc (đọc 1 sec / step trước khi gọi tool)

### Bước 1 — Đọc use case hẹp

```
Grep "^### UC$ARGUMENTS\b" docs/USE_CASES.md          # lấy line number
Read docs/USE_CASES.md offset=<line> limit=80          # KHÔNG read full file
```

Tóm tắt 1 câu use case đang triển khai. Nếu nội dung không khớp UC trong `docs/USE_CASES.md` → **dừng, hỏi user**.

### Bước 2 — Check schema DB

```
Grep "^## \d+\. `<bảng_dự_đoán>`" docs/DATABASE.md
```

- Nếu bảng/cột đã có → tiếp tục.
- Nếu thiếu → **dừng**, gợi ý user gọi `/migration <slug>` trước.

### Bước 3 — Lập kế hoạch file (path cụ thể, KHÔNG tạo file ngay)

Template paths Lumio:

- Server Action: `src/app/(app)/<feature>/actions.ts`
- Zod schema: `src/lib/schemas/<feature>.ts`
- Repository (nếu chưa có): `src/lib/repositories/<entity>.repo.ts`
- Page (Server Component): `src/app/(app)/<feature>/page.tsx`
- Client component: `src/app/(app)/<feature>/_components/<name>.tsx`
- i18n key: `messages/vi.json`, `messages/en.json`
- (Speaking/Reader) STT/TTS helper: `src/lib/speech/{stt,tts}.ts`
- (LLM) Prompt: `src/lib/ai/prompts/<feature>.ts`
- Test: cùng folder với `.test.ts`

### Bước 4 — Xác nhận user nếu > 3 file mới

Liệt kê paths + lý do từng file. Đợi user "OK" rồi mới Read/Edit/Write.

### Bước 5 — Thứ tự triển khai (1 file mỗi vòng + typecheck sau mỗi file)

1. Zod schema (`lib/schemas/<feature>.ts`)
2. Repository method + unit test
3. Server Action (wrap input bằng `safeParse`, return plain object)
4. Server Component (page)
5. Client component (chỉ thêm `'use client'` khi thực sự cần)
6. i18n key (vi + en)
7. Test E2E nếu là user-journey chính (Speaking, Reader, Roleplay)

Sau mỗi file:

```
pnpm typecheck
```

Fail → dừng, fix trước khi tiếp.

### Bước 6 — `/review` → đề xuất commit

Commit Conventional Commits tiếng Việt:

```
feat(<scope>): <subject < 72 ký tự>
Refs: UC$ARGUMENTS
```

## Quy tắc API (Next.js 16 + Supabase SSR 2026)

- ✅ **`await cookies()`** (Next 16 async). `createClient()` ở `src/lib/supabase/server.ts` đã await.
- ✅ **`supabase.auth.getClaims()`** server-side, **KHÔNG** dùng `getSession()` (không revalidate token).
- ✅ **`revalidateTag(tag, 'max')`** — Next 16 yêu cầu 2 arg (cacheLife profile).
- ✅ **`updateTag('speak:'+userId)`** trong Server Action khi cần read-your-writes (UI update ngay sau mutation).
- ✅ **`proxy.ts`** (không `middleware.ts` — Next 16 đổi tên).
- ✅ Server Action wrap input bằng Zod `safeParse`.
- ✅ LLM call qua `llm()` từ `lib/ai/provider.ts`, **không** import `@google/genai` trực tiếp trong feature code.
- ✅ Mọi text UI qua `useTranslations()`.
- ✅ RLS lo phần auth — **không** `where user_id = ...` thủ công.
- ✅ Rate limit `@upstash/ratelimit` cho mọi endpoint AI (vd. 30 speaking-attempt/giờ/user).

## Tham chiếu

- Stack: `AGENTS.md` (project root) + `docs/AGENT.md §1–3`.
- Pattern: `docs/DESIGN_PATTERNS.md`.
- Schema: `docs/DATABASE.md`.
- Use case: `docs/USE_CASES.md`.
- Prompt mẫu: `docs/PROMPTS.md §2` (Speaking), `§12` (Roleplay).
