# PROMPTS.md — Prompt bootstrap cho Claude Code

> Bộ prompt đã được tinh chỉnh để khởi tạo các task phổ biến nhất với Claude Code +
> Lumio codebase. Copy nguyên văn — đừng "cá nhân hoá" thêm để tiết kiệm token.
>
> Mọi prompt dưới đây giả định bạn đang ở repo root, `claude` đã đọc `CLAUDE.md`.

---

## 1. Khởi động project lần đầu

```
Setup Lumio app theo TECH_STACK.md §10. Cụ thể:

1. Chạy `npx create-next-app@latest . --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"` (chấp nhận overwrite tối thiểu, giữ tài liệu .md ở root)
2. Cài Supabase: @supabase/supabase-js, @supabase/ssr
3. Cài shadcn/ui init (Tailwind v4 mode), thêm: button card dialog dropdown-menu form input popover progress select sheet sonner tabs textarea tooltip avatar badge
4. Cài Gemini, Zod, react-hook-form, date-fns, lucide-react, @upstash/ratelimit, @upstash/redis, next-intl
5. Setup .env.example từ TECH_STACK.md §12
6. Tạo src/lib/supabase/{server,client,middleware}.ts theo @supabase/ssr template chuẩn
7. Tạo middleware.ts gọi updateSession từ lib/supabase/middleware
8. Copy colors_and_type.css thành src/app/globals.css với @import "tailwindcss" + @theme block dịch token sang Tailwind v4 format
9. Setup messages/vi.json + messages/en.json rỗng
10. Commit: chore: bootstrap Next.js 16 + Supabase + shadcn

Hỏi tôi nếu thiếu thông tin (NEXT_PUBLIC_SUPABASE_URL chưa có chẳng hạn). KHÔNG tạo thêm tính năng UC nào trong bước này.
```

---

## 2. Triển khai một use case

```
/feature UC10

UC10 là "Ôn từ vựng hằng ngày qua SRS". Đọc USE_CASES.md §UC10 và DATABASE.md §11–12 (vocab_words, vocab_reviews) trước. Sau đó lập kế hoạch file, xác nhận với tôi nếu > 3 file mới.
```

Thay UC10 bằng use case khác (UC5 placement test, UC7 speaking, UC8 reader, UC13 essay…).

---

## 3. Thêm bảng / cột DB

```
/migration add-essay-versions

Yêu cầu: thêm bảng essay_versions để lưu history của essays. Cột:
- id uuid
- essay_id uuid → essays(id) cascade
- user_id uuid → auth.users(id) cascade
- version_index int
- body text
- word_count int
- created_at timestamptz

Index (essay_id, version_index desc). RLS bốn policy chuẩn. Cập nhật DATABASE.md mục §15 (essays) với liên kết.
```

---

## 4. Tạo prompt LLM mới

```
/prompt vocab-quiz

Mục đích: AI sinh 5–8 câu quiz từ vocab_words user đã save trong một content_source. Loại câu: fill_blank, translate (EN→VI), multiple_choice, listen_type.

Input: { words: VocabWord[], transcript: string, count: number }
Output schema (Zod):
- quizSetId
- questions: { type, question, choices?, correctAnswer, explanation }[]

Yêu cầu LLM trả JSON, parse qua Zod, retry 1 lần với prompt strict hơn nếu fail. Model: gemini-3-flash (cân bằng tốc độ/chất lượng).
```

---

## 5. Fix một bug

```
Bug: khi user click "Lưu vào sổ từ" trong reader nhanh 2 lần liên tiếp, đôi khi vocab_words insert 2 dòng trùng lemma (race condition).

Reproduce:
- vào /read/[sourceId]
- click một từ over-level
- click "Lưu vào sổ từ" 2 lần liền (< 200ms)

Yêu cầu:
1. Tìm root cause (action không idempotent hoặc trigger debounce sai)
2. Fix sao cho vẫn optimistic UI nhưng không tạo row trùng
3. Viết regression test cho race case này

Tham chiếu: AGENT.md §7.2.
```

---

## 6. Refactor không thay đổi behavior

```
Refactor: src/app/(app)/vocab/[deckId]/review/page.tsx hiện > 250 dòng. Tách thành:
- page.tsx (server component, data fetch)
- _components/review-card.tsx (client, card-flip)
- _components/grade-buttons.tsx (client, 4 button SM-2)
- _components/queue-sidebar.tsx (server)

Không thêm tính năng mới. Không thay đổi public API của Server Action. Sau khi tách phải pass test cũ + lint + typecheck. Commit message: refactor(vocab): tách review page thành component.
```

---

## 7. Performance check

```
Performance: chạy `pnpm build` rồi đọc output Next.js. Tìm:
- Route có First Load JS > 200KB
- Route Server Component nhưng có 'use client' không cần thiết
- Image không có width/height → CLS

Báo cáo top 3 vấn đề + đề xuất fix. Không sửa trước khi tôi xác nhận.
```

---

## 8. Nâng cấp package

```
/chore upgrade-tailwind

Cập nhật tailwindcss từ phiên bản hiện tại lên 4.4.x (hoặc latest trong dòng 4.x). Quy trình:
1. Đọc CHANGELOG: https://tailwindcss.com/blog
2. Tạo branch chore/upgrade-tailwind
3. Chạy `npx @tailwindcss/upgrade@latest` nếu có
4. Update package.json + lockfile
5. Chạy full test suite
6. Báo diff chú ý + screenshot UI nếu thay đổi visual

Không upgrade major version trừ khi tôi nói rõ.
```

---

## 9. Setup CI / deploy lần đầu

```
Setup deploy lần đầu lên Vercel + Supabase production:

1. Verify .github/workflows/ci.yml chạy được trên 1 PR test
2. Hỏi tôi Supabase prod URL + anon key (đừng đoán)
3. Hướng dẫn từng bước cài Vercel env qua `vercel env add` hoặc dashboard
4. Setup vercel.json với cron entry theo API_DESIGN.md §9
5. Verify preview deployment trên 1 branch test

Đừng tự push lên main, đừng tự promote production.
```

---

## 10. Khi bí — escalate

```
Tôi đã thử medium thinking 2 lần không ra. Vấn đề: <mô tả ngắn>.
Bật high thinking, đọc lại USE_CASES.md §UCx + ARCHITECTURE.md §<n>, đề xuất 2-3 hướng giải pháp với trade-off rõ ràng. KHÔNG implement, chỉ phân tích.
```

---

## 11. Snippet ngắn — task cơ học

Khi task nhỏ và rõ ràng, dùng prompt + override model:

```bash
# Fix tsc errors
claude --model claude-sonnet-4-7 "Fix all tsc errors in src/lib. Run pnpm typecheck after."

# Generate commit message từ staged diff
claude --model claude-haiku-4-7 "git diff --staged, suggest a Conventional Commits message in Vietnamese."

# Rename file + update imports
claude --model claude-sonnet-4-7 "Rename src/components/app/word-popup.tsx → vocab-popup.tsx and update all imports."
```

---

## 12. Anti-prompt (đừng làm)

❌ `"Hãy code toàn bộ app Lumio cho tôi"` — quá rộng, tốn token, không kiểm soát.
❌ `"Sửa hết bug đi"` — không có bug list cụ thể.
❌ `"Làm cho nó đẹp hơn"` — không actionable.
❌ `"Đọc tất cả file trong repo"` — không bao giờ.
❌ `"Tự deploy lên production"` — KHÔNG BAO GIỜ.

---

## 13. Checklist trước khi gửi prompt

- [ ] Đã nêu rõ use case (UCx)?
- [ ] Đã nêu file path cụ thể nếu sửa file có sẵn?
- [ ] Đã giới hạn phạm vi (không > 5 file)?
- [ ] Đã chỉ định model nếu task cơ học?
- [ ] Đã nói "đừng commit / đừng push" nếu không muốn auto?
