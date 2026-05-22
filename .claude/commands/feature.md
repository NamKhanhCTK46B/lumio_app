---
name: feature
description: Bắt đầu triển khai một use case (UC1–UC20) từ docs/USE_CASES.md
model: claude-opus-4-7
thinking: medium
---

# /feature <UCx>

Triển khai một tính năng dựa trên use case có sẵn trong `docs/USE_CASES.md`.

## Quy trình bắt buộc

1. **Đọc use case** tương ứng (chỉ section UCx, không read full file).
   ```
   Grep "^### UCx" docs/USE_CASES.md → lấy line number
   Read docs/USE_CASES.md offset=<line> limit=80
   ```

2. **Xác định bảng DB** đụng tới. Nếu schema chưa đủ:
   - Liệt kê bảng/cột cần thêm
   - **DỪNG**, gọi `/migration` trước

3. **Lập kế hoạch file** (đường dẫn cụ thể, KHÔNG tạo file ngay):
   - Server Action: `src/app/(app)/<feature>/actions.ts`
   - Zod schema: `src/lib/schemas/<feature>.ts`
   - Repository (nếu chưa có): `src/lib/repositories/<entity>.repo.ts`
   - Page (Server Component): `src/app/(app)/<feature>/page.tsx`
   - Client component: `src/app/(app)/<feature>/_components/<name>.tsx`
   - i18n keys: `messages/vi.json`, `messages/en.json`

4. **Xác nhận với user** nếu > 3 file mới sẽ được tạo.

5. **Thứ tự triển khai:**
   1. Zod schema
   2. Repository method (test unit trước)
   3. Server Action
   4. Server Component (page)
   5. Client component (nếu cần `'use client'`)
   6. i18n key
   7. E2E test (Playwright) nếu là user-journey chính

6. **Sau mỗi file:** `pnpm typecheck` → fix nếu fail.

7. **Sau khi xong tính năng:** `/review` rồi commit theo Conventional Commits.

## Quy tắc

- Server Action wrap input bằng Zod (`SaveVocabSchema.safeParse(input)`)
- Server Component fetch trực tiếp qua `createClient()` — KHÔNG fetch API
- LLM call qua `llm()` từ `lib/ai/provider.ts` — KHÔNG import Gemini SDK
- Mọi text UI qua `useTranslations()` — KHÔNG hardcode chuỗi
- RLS lo phần auth — KHÔNG `where user_id = ...`

## Tham chiếu

- Quy ước stack: `AGENTS.md` (project root) + `docs/AGENT.md §1–3`
- Pattern phần mềm: `docs/DESIGN_PATTERNS.md`
- Schema bảng: `docs/DATABASE.md`
- Phiên bản package: `docs/TECH_STACK.md`
