# Lumio — Stack công nghệ chi tiết

> Tất cả phiên bản và URL trong file này đã được kiểm tra ngày **13/05/2026**. Các phiên bản nêu ra hoặc đang **LTS hoạt động** (Active LTS) hoặc đang **stable mới nhất**. Tránh mọi công nghệ đã end-of-life.

Mục tiêu: nếu bạn `npm install` theo đúng phiên bản trong file này, dự án sẽ build và chạy được đến hết năm 2026 mà không gặp vấn đề về deprecation.

---

## 1. Lõi framework

### Next.js — `16.x`
- **Trang chính:** https://nextjs.org
- **Changelog:** https://nextjs.org/blog
- **Hỗ trợ:** https://nextjs.org/support-policy
- **Phiên bản dùng:** `next@16.2.x` hoặc cao hơn trong dòng 16.
- **Lý do chọn 16:** Turbopack đã stable mặc định cho cả `next dev` và `next build`; tích hợp React Compiler 1.0 stable; cải thiện Adapter API và Cache Components.
- **Lưu ý migrate:** Nếu code cũ chạy v15, dùng `npx @next/codemod@canary upgrade latest` để tự động chuyển. Có MCP server riêng (`next-devtools-mcp@latest`) để các agent code (Cursor / Claude Code) tự xử lý nâng cấp.
- **Bảo mật:** Cập nhật patch ngay — đầu tháng 5/2026 đã có security release vá 13 advisories (Middleware/Proxy bypass, SSRF, DoS, XSS). Không khoá phiên bản chính xác trong production.

### React — `19.2.x`
- **Trang chính:** https://react.dev
- **Phiên bản đi kèm Next 16:** React 19.2 (qua Canary release tích hợp View Transitions, `useEffectEvent`, `Activity`).
- **React Compiler 1.0:** Tự động memo hoá component, giảm re-render — bật bằng cờ `reactCompiler: true` trong `next.config.ts`.

### TypeScript — `5.7+`
- **Trang chính:** https://www.typescriptlang.org
- **Phiên bản tham chiếu:** `typescript@5.7` trở lên. Hỗ trợ `noUncheckedIndexedAccess`, JSON Schema Draft 2020-12, Decorator stage 3.
- **Cấu hình khuyến nghị:** `"strict": true`, `"noUncheckedIndexedAccess": true`, `"moduleResolution": "bundler"`.

---

## 2. UI / Styling

### Tailwind CSS — `4.3.x`
- **Trang chính:** https://tailwindcss.com
- **Phát hành stable v4:** 22/01/2025; hiện tại v4.3 (npm: https://www.npmjs.com/package/tailwindcss).
- **Khác biệt chính so với v3:** cấu hình bằng CSS (không còn `tailwind.config.js`), engine mới nhanh hơn 5×, content detection tự động, gradient/3D transform mở rộng, container queries built-in. Hỗ trợ `oklch()`, `color-mix()`, `@property`.
- **Cách cài cho Next.js 16:**
  ```bash
  npm install tailwindcss @tailwindcss/postcss
  ```
  Trong `globals.css`:
  ```css
  @import "tailwindcss";
  @theme {
    --color-lm-primary: oklch(0.74 0.15 65);
    /* ... */
  }
  ```
- **Migration từ v3:** chạy `npx @tailwindcss/upgrade@latest`.

### shadcn/ui — đã hỗ trợ Tailwind 4
- **Trang chính:** https://ui.shadcn.com
- **Cách cài:**
  ```bash
  npx shadcn@latest init
  npx shadcn@latest add button card dialog dropdown-menu form input ...
  ```
- **Lưu ý:** shadcn/ui không phải package npm — nó copy code vào dự án. Lumio dùng các primitive: Button, Card, Dialog, Sheet, Tooltip, Popover, Form, Input, Textarea, Select, Toast (Sonner), Tabs, Avatar, Badge, Progress.

### Radix UI Primitives — `2.x`
- **Trang chính:** https://www.radix-ui.com/primitives
- shadcn/ui dùng Radix bên dưới — accessibility built-in (ARIA, keyboard nav).

### Lucide React — `0.4xx`
- **Trang chính:** https://lucide.dev
- **Package:** `lucide-react`
- 1,400+ icon outline 1.5-stroke. Là bộ icon mặc định của shadcn/ui.

### `class-variance-authority` + `tailwind-merge` + `clsx`
- Combo chuẩn của shadcn/ui để compose className. Không dùng nếu đã có một util khác.

---

## 3. Backend / Database

### Supabase
- **Trang chính:** https://supabase.com
- **Dashboard:** https://app.supabase.com
- **Postgres version:** 15 (mặc định trên project mới)
- **Pricing:** Free tier đủ cho đồ án (500MB DB, 1GB storage, 2GB bandwidth/tháng, 50,000 monthly active users).
- **Packages bắt buộc:**
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
  - `@supabase/supabase-js` (v2.x): client SDK chính
  - `@supabase/ssr` (v0.6.x): SSR helper cho Next.js App Router — quản lý cookie session, middleware refresh.

### pgvector — `0.8+`
- **Repo:** https://github.com/pgvector/pgvector
- Đã có sẵn trong Supabase (chỉ cần `create extension vector;`).
- Dùng cho embedding từ vựng và content source.

### pg_cron
- **Repo:** https://github.com/citusdata/pg_cron
- Đã có sẵn trong Supabase. Dùng để chạy job nhắc ôn nhanh hằng đêm.

### Drizzle ORM (tuỳ chọn) — `0.36+`
- **Trang chính:** https://orm.drizzle.team
- Nếu muốn type-safe queries thay vì gọi `supabase.from().select()` trực tiếp.
- **Packages:**
  ```bash
  npm install drizzle-orm postgres
  npm install -D drizzle-kit
  ```
- Kết nối qua connection string của Supabase (Transaction pooler — IPv4-compatible).

---

## 4. AI / LLM

### Google Gemini API — sử dụng dòng `gemini-3.x`
- **Trang chính:** https://ai.google.dev
- **Console:** https://aistudio.google.com
- **SDK:**
  ```bash
  npm install @google/genai
  ```
- **Model dùng trong Lumio:**

  | Tác vụ | Model | Lý do |
  |---|---|---|
  | Phản hồi viết / chấm essay | `gemini-3.1-pro-preview` | Cần reasoning sâu, rubric IELTS phức tạp |
  | Sinh quiz / dịch / định nghĩa | `gemini-3-flash` | Cân bằng tốc độ-chất lượng |
  | Cụm câu nhanh, đơn giản (highlight, tooltip) | `gemini-3.1-flash-lite` | Cost-efficient, độ trễ thấp |
  | Embedding (vocab, content) | `gemini-embedding-2-preview` (1536-d, multimodal) | Mới nhất, hỗ trợ ảnh + audio + PDF |

- **Đã ngừng hỗ trợ — KHÔNG dùng:**
  - `gemini-1.0`, `gemini-1.5` (tất cả): shutdown rồi
  - `gemini-2.0-flash`, `gemini-2.0-flash-lite`: shutdown 01/06/2026
  - `gemini-2.5-flash-image-preview`: shutdown 15/01/2026
  - `gemini-2.5-flash-lite-preview-09-2025`: shutdown 31/03/2026
  - `text-embedding-004`: shutdown 14/01/2026 → dùng `gemini-embedding-2-preview`
  - Mọi `gemini-3-pro-preview` cũ — đã alias sang `gemini-3.1-pro-preview`

### OpenRouter (dự phòng)
- **Trang chính:** https://openrouter.ai
- **API:** OpenAI-compatible — đổi URL base và header xong xài luôn.
- **Free tier models đang hoạt động (tham khảo, kiểm tra trước khi deploy):**
  - `deepseek/deepseek-chat-v3` — chat tổng quát
  - `meta-llama/llama-3.3-70b-instruct:free` — tổng quát, đa ngôn ngữ
  - `google/gemma-4-9b-it:free` — open model nhẹ
- **Vai trò:** fallback khi Gemini bị rate-limit. Strategy pattern đã chuẩn bị cho việc này (xem `DESIGN_PATTERNS.md`).

### Whisper (qua OpenRouter hoặc Replicate) — fallback STT
- Chỉ dùng khi Web Speech API không khả dụng (Safari iOS cũ).
- Khuyến nghị: `openai/whisper-large-v3` qua https://replicate.com hoặc gọi qua https://api.together.ai (free tier rộng rãi).

---

## 5. Speech (trong trình duyệt)

### Web Speech API
- **Spec:** https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API
- **STT:** `window.SpeechRecognition` — miễn phí, không cần server.
- **TTS:** `window.speechSynthesis` — voice "Google English" có sẵn trên hầu hết browser.
- **Hỗ trợ browser:** Chrome/Edge/Safari (desktop + mobile) tốt; Firefox còn flag. Không có trên Safari iOS < 14.5 → fallback Whisper.

---

## 6. Triển khai

### Vercel
- **Trang chính:** https://vercel.com
- **Free Hobby tier đủ cho đồ án.**
- **Edge runtime** opt-in cho `/api/ai/stream` (streaming LLM nhanh).
- **Vercel Cron Jobs** (https://vercel.com/docs/cron-jobs) — định nghĩa trong `vercel.json` (Hobby tier: chỉ chạy daily, không tần suất cao hơn).
- **Adapters API stable từ Next 16.2** — nếu sau này không dùng Vercel, có thể deploy qua adapter chính thức cho AWS / Cloudflare / OpenNext.

---

## 7. Quan sát & phân tích (tuỳ chọn)

| Mục đích | Công cụ | Free tier |
|---|---|---|
| Web Vitals | Vercel Analytics | Có |
| Error tracking | Sentry — https://sentry.io | 5K event/tháng |
| Product analytics | PostHog — https://posthog.com | 1M event/tháng |
| Logging | Axiom — https://axiom.co | 0.5GB/ngày |

---

## 8. Validation, Forms, Misc

| Mục đích | Package | Phiên bản |
|---|---|---|
| Schema validation | `zod` | 3.23+ |
| Form (client) | `react-hook-form` + `@hookform/resolvers` | 7.5x |
| Date | `date-fns` | 4.x |
| State | Zustand (chỉ khi thực sự cần global) | 5.x |
| Server cache | `unstable_cache` của Next 16 + `revalidateTag` | built-in |
| Markdown render | `react-markdown` + `remark-gfm` | 9.x / 4.x |
| Rate limit | `@upstash/ratelimit` + `@upstash/redis` | 2.x |
| File upload | `react-dropzone` | 14.x |

---

## 9. Dev tools

| Mục đích | Công cụ |
|---|---|
| Linter | `eslint` v9 + `eslint-config-next` |
| Formatter | `prettier` v3 + `prettier-plugin-tailwindcss` |
| Git hooks | `husky` + `lint-staged` |
| Test (unit) | `vitest` v3 |
| Test (E2E) | `playwright` v1.50+ |
| Type-checking CI | `tsc --noEmit` |
| Bundle analysis | `@next/bundle-analyzer` (đã stable trong 16.1) |

---

## 10. Lệnh khởi tạo dự án nhanh

```bash
# 1. Tạo Next app
npx create-next-app@latest lumio-app \
  --typescript --tailwind --app --eslint --src-dir --import-alias "@/*"

# 2. Vào project
cd lumio-app

# 3. Cài Supabase + ssr
npm install @supabase/supabase-js @supabase/ssr

# 4. Cài shadcn
npx shadcn@latest init
npx shadcn@latest add button card dialog dropdown-menu form input \
  popover progress select sheet sonner tabs textarea toast tooltip avatar badge

# 5. Cài Gemini + AI helpers
npm install @google/genai zod

# 6. Cài form + utils
npm install react-hook-form @hookform/resolvers date-fns

# 7. Rate limiting + caching
npm install @upstash/ratelimit @upstash/redis

# 8. (Tuỳ chọn) Drizzle
npm install drizzle-orm postgres
npm install -D drizzle-kit

# 9. (Tuỳ chọn) Sentry
npx @sentry/wizard@latest -i nextjs

# 10. Dev tools
npm install -D vitest @vitejs/plugin-react @playwright/test \
  prettier prettier-plugin-tailwindcss eslint-config-prettier
```

---

## 11. Cấu trúc thư mục Next.js khuyến nghị

```
lumio-app/
├── src/
│   ├── app/
│   │   ├── (marketing)/        # landing, pricing — public
│   │   ├── (auth)/             # login, signup, reset
│   │   ├── (app)/              # toàn bộ app sau đăng nhập (layout = sidebar)
│   │   │   ├── dashboard/
│   │   │   ├── speak/
│   │   │   ├── vocab/
│   │   │   ├── read/
│   │   │   ├── write/
│   │   │   └── settings/
│   │   ├── api/
│   │   │   ├── ai/stream/      # SSE LLM
│   │   │   ├── transcribe/     # Whisper fallback
│   │   │   ├── youtube/        # transcript fetch
│   │   │   └── cron/           # vercel cron callbacks
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                 # shadcn primitives (generated)
│   │   └── app/                # Lumio-specific
│   ├── lib/
│   │   ├── supabase/           # server.ts, client.ts, middleware.ts
│   │   ├── ai/                 # gemini.ts, openrouter.ts, provider.ts, prompts/
│   │   ├── content/            # youtube.ts, article.ts, extractor.ts
│   │   ├── speech/             # stt.ts, tts.ts (client-only)
│   │   ├── srs/                # sm2.ts
│   │   ├── repositories/       # *.repo.ts
│   │   ├── schemas/            # zod schemas
│   │   └── utils.ts
│   ├── middleware.ts           # Supabase session refresh
│   └── types/
├── supabase/
│   ├── migrations/             # SQL versioned
│   └── seed.sql
├── public/
├── .env.local                  # KHÔNG commit
├── next.config.ts
├── tailwind.css                # @theme block
└── tsconfig.json
```

---

## 12. Biến môi trường (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...      # chỉ dùng trong cron + admin

# Google Gemini
GEMINI_API_KEY=...                  # lấy tại https://aistudio.google.com

# OpenRouter (dự phòng)
OPENROUTER_API_KEY=sk-or-...

# Upstash Redis (rate limit)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Cron secret
CRON_SECRET=...                     # random 32-char string

# Sentry (tuỳ chọn)
SENTRY_DSN=https://...
```

---

## 13. Câu hỏi thường gặp

**Tại sao không dùng tRPC?**
Server Actions của Next.js 16 đã đủ — type-safe end-to-end, không cần thêm layer. tRPC vẫn ổn nếu nhóm bạn quen, nhưng không cần thiết.

**Tại sao không dùng Prisma?**
RLS của Supabase là tầng phân quyền chính. Prisma không hỗ trợ RLS đầy đủ (phải workaround). Supabase client + Drizzle (nếu cần) phù hợp hơn.

**Tại sao không tự host Whisper?**
Trên free tier (Vercel), không có GPU; tự host Whisper trên CPU quá chậm. Web Speech API miễn phí trong browser; Replicate / Together API có free tier đủ dùng cho fallback.

**Có cần Redux / Zustand không?**
Không, trừ khi có state thực sự cần dùng chung giữa nhiều route. Server Components đã là "store" — chỉ Zustand các state UI nhỏ (sidebar open/close).

**Tailwind v3 còn dùng được không?**
Vẫn dùng được — Tailwind team thông báo "v3 still supported". Nhưng v4 nhanh hơn 5×, có nhiều utility mới — dự án mới nên bắt đầu với v4.

---

## 14. Lịch trình kiểm tra phiên bản

Khuyến nghị kiểm tra mỗi 2 tháng:
- Next.js: https://nextjs.org/blog
- Tailwind: https://tailwindcss.com/blog
- Gemini deprecations: https://ai.google.dev/gemini-api/docs/changelog (đặc biệt mục "Deprecation announcement")
- Supabase: https://supabase.com/changelog
