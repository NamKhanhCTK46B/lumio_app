---
description: Self-review diff trước khi commit — chạy typecheck/lint/test + checklist nghiệp vụ + kỹ thuật Lumio.
allowed-tools: Read Grep Bash(git diff*) Bash(git log*) Bash(git status*) Bash(pnpm typecheck) Bash(pnpm lint) Bash(pnpm test) Bash(pnpm exec *) Bash(pnpm build)
model: claude-sonnet-4-6
effort: low
---

# /review

Self-review diff trước commit / mở PR. Mục đích: **bắt lỗi rẻ hơn người review** + giữ chất lượng code Lumio.

## Context (bash injection — chạy tự động trước khi Claude đọc)

### Staged diff
!`git diff --staged`

### Unstaged diff (nếu chưa stage)
!`git diff`

### Recent commits (style tham chiếu)
!`git log --oneline -5`

### Branch hiện tại
!`git branch --show-current`

---

## Bước 1 — Chạy CI local

```
pnpm typecheck   # tsc --noEmit, không lỗi
pnpm lint        # ESLint v9 flat config
pnpm test        # Vitest (nếu có test)
```

Fail → **DỪNG**, sửa, không commit.

## Bước 2 — Checklist nghiệp vụ (Lumio)

- [ ] Đúng use case UC1–UC20 trong `docs/USE_CASES.md`? Nếu không thuộc → hỏi user.
- [ ] Trọng tâm Speaking/Reader/Conversation: STT/TTS qua `lib/speech/`? Web Speech API trước, Whisper fallback?
- [ ] Schema DB thay đổi → có migration trong `supabase/migrations/`? Có RLS chưa?
- [ ] Server Action có Zod `safeParse` đầu vào không?
- [ ] Server Action có gọi `revalidateTag(tag, 'max')` HOẶC `updateTag(tag)` (Next 16) sau mutation?
  - `updateTag` cho read-your-writes (UI cần update ngay, vd. save speaking attempt).
  - `revalidateTag` cho content acceptable stale (vd. nguon_noi_dung catalog).
- [ ] LLM call qua `llm()` từ `lib/ai/provider.ts`? KHÔNG import `@google/genai` trực tiếp trong feature code?
- [ ] User input trong prompt LLM có XML delimiter (`<target>`, `<user-transcript>`, `<essay>`)?
- [ ] LLM response có Zod schema parse + retry/fallback?
- [ ] Mọi text UI qua `useTranslations()` chứ không hardcode chuỗi?
- [ ] Tiếng Việt: dùng "bạn", không "quý khách"? Không emoji trong UI sản phẩm?
- [ ] (Speaking) Pronunciation feedback có `encouragement` không rỗng + cụ thể (không phải "Cố lên!" generic)?

## Bước 3 — Checklist kỹ thuật (Next.js 16 + Supabase SSR 2026)

- [ ] Server Component fetch trực tiếp qua `createClient()` từ `lib/supabase/server.ts`, không qua API route?
- [ ] `'use client'` chỉ khi thực sự cần state/effect/browser API (mic, TTS, WebSocket)?
- [ ] Auth check server-side qua `supabase.auth.getClaims()` — KHÔNG `getSession()` (không revalidate token)?
- [ ] Async API await đúng: `await cookies()`, `await headers()`, `await params`, `await searchParams`?
- [ ] Repository nhận `supabase` client, KHÔNG nhận `userId`? Tin RLS, không `.eq('user_id', userId)`?
- [ ] Middleware → đổi sang `src/proxy.ts` export `proxy()` (Next 16, không còn `middleware.ts`)?
- [ ] React Compiler 1.0 stable → KHÔNG `useMemo`/`useCallback` thủ công không cần thiết?
- [ ] Index DB cho cột mới thường query (đặc biệt `(user_id, created_at desc)` cho timeline)?
- [ ] Rate limit `@upstash/ratelimit` cho endpoint AI (30 attempt/giờ/user)?
- [ ] Service-role key chỉ trong `app/api/cron/*` + check `Authorization: Bearer ${CRON_SECRET}` header?
- [ ] Không log secret (`API_KEY`, `JWT`, `password`, audio URL chứa token)?
- [ ] Migration có rollback `drop ... cascade` dưới comment?

## Bước 4 — Code quality

- [ ] File mới đặt đúng thư mục theo `docs/AGENT.md §2`?
- [ ] Naming: kebab-case file, PascalCase component, camelCase function, `<verb><Noun>Action` cho Server Action?
- [ ] Không có `console.log` còn sót lại?
- [ ] Không có `// @ts-ignore` / `as any` chưa giải thích?
- [ ] Component > 200 dòng → tách module nhỏ?
- [ ] Hàm > 50 dòng → tách helper?
- [ ] Comment giải thích **tại sao**, không phải **làm gì**?

## Bước 5 — Soạn commit message

Conventional Commits, tiếng Việt:

```
<type>(<scope>): <subject — what changed, < 72 ký tự>

<body — why, không phải how>

<footer — Refs: UCx>
```

`<type>`: `feat | fix | refactor | docs | test | chore | perf | style`.
`<scope>`: `speak | read | vocab | write | roleplay | db | ai | ui | …`.

## Bước 6 — Quyết định

- ✅ Mọi check pass → đề xuất commit (user xác nhận).
- ⚠️ Có check fail nhưng có lý do → ghi vào commit message hoặc PR body.
- ❌ Critical fail (test fail, RLS thiếu, secret leak, `getSession()` server, missing `await` async API) → **DỪNG**, sửa trước.

## Output mẫu

```
✅ typecheck, lint, test PASS
✅ Zod validate, RLS, updateTag('speak:'+userId)
✅ XML delimiter trong prompt pronunciation-feedback
⚠️ Chưa có E2E test cho /speak — sẽ thêm trong PR sau
❌ Hardcode chuỗi "Bạn đã hoàn thành" ở src/app/(app)/speak/_components/result-card.tsx:42 — cần useTranslations
❌ src/lib/supabase/server.ts dùng getSession() — phải đổi getClaims()

Đề xuất commit (sau khi sửa 2 ❌):
feat(speak): thêm session luyện phát âm UC7

Refs: UC7
```

> Tham chiếu chi tiết quy ước Git/PR: `docs/GIT_WORKFLOW.md`.
