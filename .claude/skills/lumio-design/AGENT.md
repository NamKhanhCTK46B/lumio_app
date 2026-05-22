# AGENT.md — Hướng dẫn dành cho coding agent

> File này dành cho các AI coding agent (Cursor, Claude Code, Windsurf, Cline, Aider, GitHub Copilot Workspace, Gemini CLI…) khi triển khai code thật cho website **Lumio**.
>
> Đặt file `AGENT.md` ở thư mục gốc của dự án Next.js. Cursor sẽ tự đọc `AGENTS.md` / `AGENT.md` từ workspace. Claude Code đọc `CLAUDE.md`. Bạn có thể tạo symlink nếu muốn cùng nội dung cho cả hai.
>
> Toàn bộ nội dung dưới đây là **quy ước CỨNG**. Không tự ý đi chệch nếu chưa hỏi.

---

## 0. Trước khi bắt đầu

1. **Đọc các tài liệu nền** trong thứ tự sau:
   1. `README.md` — bối cảnh sản phẩm, brand voice, visual foundations
   2. `ARCHITECTURE.md` — kiến trúc tổng thể
   3. `DATABASE.md` — schema chi tiết
   4. `USE_CASES.md` — 7 luồng tính năng
   5. `DESIGN_PATTERNS.md` — pattern phần mềm
   6. `TECH_STACK.md` — phiên bản package chính xác
   7. `CONTENT_SOURCES.md` — nguồn dữ liệu nội dung
2. **Kiểm tra** `package.json` và `.env.local.example` xem đã có những gì.
3. **Hỏi user** nếu thiếu thông tin (Supabase URL, Gemini API key, mục tiêu task cụ thể).
4. Không tạo file rác — sửa file hiện hữu nếu có.

---

## 1. Stack được khoá

| Mục | Lựa chọn cứng | Lý do |
|---|---|---|
| Framework | **Next.js 16.x App Router** | Server Components, Server Actions, Turbopack stable |
| Ngôn ngữ | **TypeScript 5.7+** strict | Type-safe end-to-end |
| Styling | **Tailwind CSS v4** (CSS-first config) | Không dùng v3, không dùng styled-components/Emotion |
| Component lib | **shadcn/ui** trên **Radix** | Copy-paste, accessible, dễ tuỳ biến |
| Icons | **lucide-react** | Nhất quán với shadcn |
| BaaS | **Supabase** (Postgres + Auth + Storage + Realtime) | RLS là tầng auth chính |
| LLM | **`@google/genai`** → Gemini 3.x | Primary; fallback OpenRouter |
| Embedding | `gemini-embedding-2-preview` (1536-d) | Không dùng `text-embedding-004` (shutdown) |
| Validation | **Zod 3.23+** | Schema = source of truth cho type |
| Forms (client) | **react-hook-form** + `@hookform/resolvers/zod` | Chỉ khi cần client-side validation |
| Date | **date-fns 4** | Không dùng moment |
| Test | **Vitest** (unit) + **Playwright** (E2E) | Không dùng Jest cho dự án mới |
| Deploy | **Vercel** | Edge Functions cho streaming |

**KHÔNG dùng:**
- React Query / SWR (Server Components + Server Actions thay thế)
- tRPC (Server Actions đã đủ)
- Prisma (Drizzle hoặc Supabase client trực tiếp; Prisma không hỗ trợ RLS tốt)
- Redux / MobX (state nhỏ → Zustand, đa số dùng URL state)
- styled-jsx / styled-components / Emotion (Tailwind v4 thuần)
- Mui / Chakra / Ant Design (đã chọn shadcn)
- Axios (fetch built-in của Next 16 đã đủ)

---

## 2. Cấu trúc thư mục bắt buộc

Bám sát mục §11 trong `TECH_STACK.md`. Tóm tắt:

```
src/
├── app/
│   ├── (marketing)/        # public landing
│   ├── (auth)/             # login, signup
│   ├── (app)/              # behind auth, sidebar layout
│   ├── api/                # route handlers (streaming, webhooks, cron)
│   ├── layout.tsx          # root
│   └── globals.css         # @import "tailwindcss" + @theme
├── components/
│   ├── ui/                 # shadcn primitives (đừng sửa trực tiếp)
│   └── app/                # Lumio-specific
├── lib/
│   ├── supabase/{server,client,middleware}.ts
│   ├── ai/{gemini,openrouter,provider}.ts + prompts/
│   ├── content/{youtube,article,extractor}.ts
│   ├── speech/{stt,tts}.ts
│   ├── srs/sm2.ts
│   ├── repositories/*.repo.ts
│   ├── schemas/*.ts        # Zod schemas
│   └── utils.ts            # cn() + helpers nhỏ
├── middleware.ts
└── types/
```

Mỗi tính năng (speak, vocab, …) có cấu trúc nội bộ tương tự:
```
app/(app)/vocab/
├── page.tsx                # SC: list decks
├── [deckId]/page.tsx       # SC: deck detail
├── [deckId]/review/page.tsx
├── actions.ts              # 'use server' — saveVocab, gradeReview, ...
└── _components/            # client components dùng riêng tính năng này
    ├── deck-card.tsx
    └── review-card.tsx
```

---

## 3. Quy tắc code

### 3.1 Server vs Client component
- **Mặc định: Server Component.** Chỉ thêm `'use client'` khi component thực sự cần state, effect, hoặc browser API.
- Server Components fetch dữ liệu trực tiếp qua `createClient()` từ `lib/supabase/server.ts` — RLS lo phần quyền, **không thêm** `where nguoi_dung_id = ...` thủ công.
- Client Components không gọi Supabase trực tiếp cho writes — gọi Server Action.

### 3.2 Server Actions
- Mọi mutation đi qua `'use server'` action.
- Wrap đầu vào bằng **Zod schema** trong `lib/schemas/<feature>.ts`.
- Trả về plain object — `null`, hoặc `{ ok: true, data }`, hoặc `{ ok: false, error: '...' }`.
- Gọi `revalidateTag(...)` hoặc `revalidatePath(...)` để cache miss.

```ts
// app/(app)/vocab/actions.ts
'use server';
import { SaveVocabSchema } from '@/lib/schemas/vocab';
import { vocabRepo } from '@/lib/repositories/vocab.repo';
import { createClient } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';

export async function saveVocabAction(input: unknown) {
  const parsed = SaveVocabSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: parsed.error.message };
  const supabase = await createClient();
  const word = await vocabRepo.save(supabase, parsed.data);
  revalidateTag(`vocab:nguoi_dung:${word.nguoi_dung_id}`);
  return { ok: true as const, data: word };
}
```

### 3.3 Repository pattern
- Đặt trong `lib/repositories/<entity>.repo.ts`.
- Methods nhận `supabase: SupabaseClient` làm tham số đầu — KHÔNG `userId`.
- Throw `Error` thay vì trả `{ error }`.

### 3.4 LLM calls — qua interface, không gọi SDK trực tiếp
```ts
import { llm } from '@/lib/ai/provider';

const reply = await llm().chat([
  { role: 'system', content: '...' },
  { role: 'user', content: essay },
]);
```
Provider chọn Gemini hoặc OpenRouter dựa trên rate-limit. Đừng `import { GoogleGenAI } from '@google/genai'` trong tính năng.

### 3.5 Prompts
- Mỗi prompt ở `lib/ai/prompts/<feature>.ts` dưới dạng function pure trả về `Message[]`.
- Wrap user input trong delimiter (`<essay>...</essay>`) để tránh prompt injection.
- Yêu cầu JSON output có schema → parse bằng Zod, không tin LLM mù quáng.

### 3.6 Tailwind & styling
- **Không** viết file CSS rời. Mọi style trong className.
- Token màu/spacing/type lấy từ `globals.css` `@theme {}` block — đã sync với `colors_and_type.css` của design system.
- Class compose bằng `cn()` (clsx + tailwind-merge) trong `lib/utils.ts`.
- Khi cần variant phức tạp, dùng `class-variance-authority`.

### 3.7 Naming
- File: `kebab-case.tsx` (`word-popup.tsx`).
- Component: `PascalCase` (`WordPopup`).
- Hook: `useCamelCase`.
- Bảng DB / cột: `snake_case`.
- Zod schema: `SaveVocabSchema` (PascalCase + `Schema` suffix).
- Server action: `<verb><Noun>Action` (`saveVocabAction`).

### 3.8 Tiếng Việt trong UI
- Mọi UI string trong tiếng Việt **mặc định**, có nhánh tiếng Anh nếu `ho_so.ngon_ngu_giao_dien = 'en'`.
- Dùng `next-intl` (https://next-intl.dev) cho i18n. Đặt namespace theo tính năng:
  ```
  messages/
    vi.json
    en.json
  ```
- Không hardcode chuỗi UI; mọi key đi qua `useTranslations()`.
- Đại từ: `bạn` cho user, `Lumio` cho brand. Không dùng `quý khách`. Không emoji trong UI sản phẩm.

### 3.9 Clean code

Mọi PR đều phải qua checklist này. Reviewer reject nếu vi phạm.

**Đặt tên**
- ✅ `dueWordsForReview`, `gradeVocabReviewAction`, `extractTranscriptFromYouTube`
- ❌ `dw`, `doIt`, `helper2`, `tmp`
- Domain term giữ nguyên cách viết chuẩn: `CEFR`, `IELTS`, `SRS`, `SM-2`, `FSRS`.

**Kích thước & hình dạng hàm**
- Hàm ≤ **40 dòng**; nếu cần scroll → tách subfunction.
- 1 hàm = 1 nhiệm vụ. Tên hàm phải mô tả đúng nhiệm vụ đó (nếu phải dùng "và" → tách).
- Tham số ≤ **4**; nhiều hơn → gom vào object `{ … }`.

**Control flow**
- **Early return** cho guard clause:
  ```ts
  // ✅ Đúng
  if (!user) return { ok: false, error: 'Chưa đăng nhập' };
  if (input.lemma.length === 0) return { ok: false, error: 'Thiếu từ' };
  return save(input);

  // ❌ Sai — nested
  if (user) {
    if (input.lemma.length > 0) {
      return save(input);
    } else { return ... }
  }
  ```
- Không `else` sau `return`.
- Tránh ternary lồng > 1 cấp.

**Magic number / string**
- Mọi giá trị nghiệp vụ thành `const` có tên + comment lý do:
  ```ts
  // Tối đa 20 từ mỗi phiên ôn theo khuyến nghị SuperMemo
  const MAX_REVIEW_BATCH = 20;
  ```

**Immutability**
- `const` mặc định, chỉ `let` khi thực sự cần reassign.
- Không mutate tham số. Dùng spread / `map` / `filter`.
- Object trả về từ server action: **plain object**, không class instance.

**Error handling**
- Không `try { … } catch {}` rỗng.
- `catch` phải: (a) log có context, (b) re-throw hoặc trả `{ ok: false, error: '…' }` có nghĩa cho user.
- Đừng dùng `as any` để né lỗi type. Sửa root cause hoặc dùng Zod narrow.

**DRY / YAGNI**
- 2 lần lặp: chấp nhận. 3 lần: trừu tượng hoá.
- Không viết abstraction cho "tương lai" — chỉ khi thực sự cần.
- Không feature flag, fallback, validation cho case không thể xảy ra (xem `noUncheckedIndexedAccess` + Zod đã bảo vệ).

**Chú thích (comment)**
- **Bằng tiếng Việt.** Giải thích **tại sao**, không phải **cái gì**.
  ```ts
  // ✅ Đúng — giải thích lý do
  // Dùng SM-2 vì dataset hiện chưa đủ để fit FSRS (cần ≥ 1000 review).
  return sm2Next(prev, quality);

  // ❌ Sai — mô tả cái code đã nói rõ
  // Gọi hàm sm2Next với prev và quality
  return sm2Next(prev, quality);
  ```
- **JSDoc tiếng Việt** cho hàm public của `lib/repositories/*`, `lib/ai/prompts/*`, mọi server action:
  ```ts
  /**
   * Lưu từ mới vào deck của user hiện tại.
   * @param supabase  Client đã mang JWT (RLS sẽ tự filter theo auth.uid()).
   * @param input     Đã được Zod parse ở Server Action gọi đến.
   * @returns Row vừa insert; throw nếu vi phạm unique (lemma + deck_id).
   */
  async save(supabase: SupabaseClient, input: SaveVocabInput) { … }
  ```
- TODO phải có owner + lý do: `// TODO(@khanh): chờ Gemini 3.1 hỗ trợ JSON mode chính thức`.
- Không comment-out code trong commit — xoá hẳn (git history giữ lại).

---

## 4. Bảo mật (an ninh dữ liệu)

Áp dụng đầy đủ checklist trong `ARCHITECTURE.md` §11. Tóm tắt:

- **RLS bật trên 100%** bảng `public.*` mà user sở hữu. Mỗi bảng có policy `using (auth.uid() = user_id)`.
- **Service-role key** chỉ tồn tại trong `app/api/cron/*` (xác thực qua `Authorization: Bearer ${CRON_SECRET}` header).
- **Không** lưu JWT trong `localStorage` — dùng `@supabase/ssr` cookie HTTP-only.
- **Validation** ở mỗi Server Action; client validation chỉ là UX layer.
- **Rate limit** bằng `@upstash/ratelimit` cho mọi endpoint AI: ví dụ 30 essay scoring / giờ / user, 200 vocab lookups / giờ / user.
- **Sanitize** mọi user-provided URL trước khi extract (whitelist hostname).
- Trong prompt LLM, **không** trộn user content vào system instruction — luôn ở user role với delimiter rõ ràng.

---

## 5. Database migrations

- Dùng **Supabase CLI**: https://supabase.com/docs/guides/cli
- File migration ở `supabase/migrations/<timestamp>_<slug>.sql`, generate bằng `supabase migration new`.
- Mỗi migration phải có **down** dưới comment hoặc sẵn sàng `drop` để rollback.
- Sau khi sửa schema:
  ```bash
  supabase gen types typescript --local > src/types/supabase.ts
  ```
- Mọi bảng phải có `created_at`, `updated_at`, trigger `set_updated_at`.
- RLS policies thuộc cùng migration với CREATE TABLE.

---

## 6. Testing

### 6.1 Unit (Vitest)
- Test các function thuần (SM-2, CEFR estimator, prompt builders, validators).
- Ở `src/lib/**/*.test.ts`.

### 6.2 Integration
- Test Server Actions với Supabase test project (riêng, có RLS đầy đủ).
- Helper `createTestUser()` trong `tests/helpers/supabase.ts`.

### 6.3 E2E (Playwright)
- Test 3 user-journey quan trọng nhất: onboarding test, vocab save & review, essay submit & score.
- Chạy headless trong CI; chạy headed trong dev.

### 6.4 CI checklist (GitHub Actions)
- `pnpm install` (hoặc `npm ci`)
- `pnpm typecheck` → `tsc --noEmit`
- `pnpm lint` → ESLint v9
- `pnpm test` → Vitest
- `pnpm build` → Next.js build
- (Tuỳ chọn) `pnpm e2e` → Playwright trên preview deploy

---

## 7. Cách AI agent tương tác với dự án

### 7.1 Khi user yêu cầu "thêm tính năng X"
1. **Trả lời câu hỏi đầu tiên:** "Tính năng X thuộc use case nào? (UC1–UC20 trong `USE_CASES.md`)"
2. Đọc use case tương ứng.
3. Xác định bảng DB cần thiết — kiểm tra đã có trong `DATABASE.md` chưa.
4. Liệt kê file cần tạo / sửa, kèm dependency.
5. **Hỏi xác nhận** trước khi tạo > 3 file.
6. Khi sửa code, sửa 1 file mỗi lần và run test.

### 7.2 Khi user yêu cầu "fix bug Y"
1. Reproduce trước (nếu được).
2. Tìm root cause (đừng workaround).
3. Fix, viết test regression nếu chưa có.
4. Báo cáo: nguyên nhân, thay đổi, file đã sửa.

### 7.3 Khi user yêu cầu "deploy"
1. Kiểm tra `pnpm build` chạy được local.
2. Đảm bảo `.env.local` được mirror trên Vercel Project Settings.
3. Push lên branch → Vercel preview → user kiểm tra → merge `main`.

### 7.4 Khi user yêu cầu "nâng cấp package Z"
1. Đọc CHANGELOG / migration guide.
2. Tạo branch riêng `chore/upgrade-z`.
3. Chạy codemod nếu có (`npx @next/codemod`).
4. Chạy đầy đủ test suite.
5. Cung cấp diff đáng chú ý.

---

## 8. Code style nhanh

```ts
// ✅ Đúng
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { vocabRepo } from '@/lib/repositories/vocab.repo';

export default async function VocabPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const decks = await vocabRepo.listDecks(supabase);
  return <DeckList decks={decks} />;
}
```

```tsx
// ❌ Sai
'use client';
import { useEffect, useState } from 'react';
export default function VocabPage() {
  const [decks, setDecks] = useState([]);
  useEffect(() => {
    fetch('/api/decks').then(r => r.json()).then(setDecks);
  }, []);
  return <div>...</div>;
}
// → Không tận dụng Server Component; tốn waterfall fetch; lộ /api/decks route không cần thiết.
```

---

## 9. Giao tiếp với user

- **Tiếng Việt** mặc định cho mọi thứ: comment, commit message, PR description, code review.
- Comment trong code: **tiếng Việt ngắn gọn**, giải thích *tại sao* (không phải *cái gì*). Chi tiết xem §3.9.
- Commit theo Conventional Commits: `feat: thêm SRS scheduler`, `fix(vocab): popup không đóng khi click ngoài`.
- PR có mô tả: **Mục đích** / **Thay đổi** / **Cách test** / **Ảnh chụp UI** (nếu có).
- Khi không chắc, **hỏi**. Đừng đoán mò trên domain nghiệp vụ (CEFR, IELTS rubric, SRS).

---

## 10. Liên kết nhanh

| Vấn đề | Đi tới |
|---|---|
| Phiên bản package | `TECH_STACK.md` |
| Schema bảng | `DATABASE.md` |
| Pattern phần mềm | `DESIGN_PATTERNS.md` |
| Luồng tính năng | `USE_CASES.md` |
| Brand voice & visual | `README.md` (Content + Visual foundations) |
| Token CSS | `colors_and_type.css` |
| Nguồn dữ liệu | `CONTENT_SOURCES.md` |
| Component recipes | `ui_kits/web/` |

---

## 11. Khi bí

- Đọc lại 6 file trên trước khi hỏi.
- Hỏi user: "Tôi đang ở use case **UCx**, cần thông tin **Y**, bạn có thể bổ sung không?"
- Không bịa CEFR mapping, không bịa rubric IELTS — luôn tham chiếu nguồn trong `CONTENT_SOURCES.md`.

Cuối cùng: **đọc kỹ là một nửa công việc.** Đừng tạo code mà chưa hiểu tại sao nó cần tồn tại.
