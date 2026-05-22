---
name: review
description: Self-review diff trước khi commit — chạy checklist nghiệp vụ + kỹ thuật
model: claude-sonnet-4-7
thinking: none
---

# /review

Self-review trước khi commit / mở PR. Mục đích: bắt lỗi rẻ hơn người review.

## Bước 1 — Đọc diff

```bash
git diff --staged
```

Nếu chưa stage gì → `git diff` thay vào.

## Bước 2 — Chạy CI local

```bash
pnpm typecheck   # không có lỗi nào
pnpm lint        # không có warning quan trọng
pnpm test        # tất cả pass
```

Nếu fail → **DỪNG**, sửa, không commit.

## Bước 3 — Checklist nghiệp vụ

- [ ] Đúng use case (UC1–UC20)? Nếu không thuộc → hỏi user.
- [ ] Schema DB thay đổi → có migration không? Có RLS chưa?
- [ ] Server Action có Zod validate đầu vào không?
- [ ] Server Action có gọi `revalidateTag/Path` sau mutation không?
- [ ] LLM call qua `llm()` chứ không import SDK Gemini trực tiếp chứ?
- [ ] User input trong prompt LLM có delimiter chống injection không?
- [ ] Mọi text UI qua `useTranslations()` chứ không hardcode chứ?
- [ ] Tiếng Việt dùng "bạn", không dùng "quý khách"? Không emoji?

## Bước 4 — Checklist kỹ thuật

- [ ] Server Component fetch trực tiếp Supabase, không qua API route?
- [ ] Client Component (`'use client'`) chỉ khi thực sự cần state/effect?
- [ ] Không có `where user_id = ...` thủ công (RLS lo)?
- [ ] Repository nhận `supabase` client làm tham số, không nhận `userId`?
- [ ] Index DB cho cột mới thường query?
- [ ] Rate limit `@upstash/ratelimit` cho endpoint AI?
- [ ] Service-role key chỉ trong `app/api/cron/*` + check `Authorization` header?
- [ ] Không log secret (`API_KEY`, `JWT`, `password`)?
- [ ] Migration có rollback (drop... cascade) dưới comment?

## Bước 5 — Checklist code quality

- [ ] File mới đặt đúng thư mục theo `docs/AGENT.md §2`?
- [ ] Naming: kebab-case file, PascalCase component, camelCase function?
- [ ] Không có `console.log` rò rỉ?
- [ ] Không có `// @ts-ignore` / `as any` chưa giải thích?
- [ ] Component > 200 dòng → tách module nhỏ hơn?
- [ ] Hàm > 50 dòng → tách helper?
- [ ] Comment giải thích **tại sao**, không phải **làm gì**?

## Bước 6 — Soạn commit message

Conventional Commits, tiếng Việt:

```
<type>(<scope>): <subject — what changed, < 72 ký tự>

<body — why, không phải how>

<footer — Refs: UCx>
```

## Bước 7 — Quyết định

- ✅ Mọi check pass → đề xuất `git commit` (user xác nhận).
- ⚠️ Một số check fail nhưng có lý do → ghi vào commit message.
- ❌ Critical check fail (test fail, RLS thiếu, secret leak) → **DỪNG**, sửa.

## Output

Báo cáo dạng:

```
✅ typecheck, lint, test
✅ Zod validation, RLS, revalidateTag
⚠️ Không có E2E test cho action mới — sẽ thêm trong PR sau
❌ Hardcode chuỗi "Lưu" ở dòng 42 file X — cần useTranslations

Đề xuất commit:
feat(vocab): thêm saveVocabAction với optimistic UI

Sửa file X dòng 42 rồi `git add` lại trước khi commit.
```
