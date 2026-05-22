# Lumio — Kiến trúc hệ thống

> Kiến trúc cho website học tiếng Anh ứng dụng AI.
> Stack: Next.js 16 (App Router) + Supabase + Vercel.
> Cập nhật: 13/05/2026. Phiên bản công nghệ chi tiết xem `TECH_STACK.md`.

---

## 1. Topology tổng quan

```
┌──────────────────────────────────────────────────────────────────────────┐
│                  NGƯỜI DÙNG (browser, desktop / mobile)                  │
│   - Web Speech API (STT / TTS)   - MediaRecorder (audio fallback)        │
└────────────────────────┬─────────────────────────────────────────────────┘
                         │  HTTPS
                         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│              VERCEL EDGE / SERVERLESS (Next.js 16, App Router)           │
│   ┌──────────────────────────────────────────────────────────────────┐   │
│   │  /app                                                            │   │
│   │   ├─ (marketing)/   Landing, pricing — public, ISR               │   │
│   │   ├─ (auth)/        Login, signup                                │   │
│   │   ├─ (app)/         Dashboard, speak, vocab, read, write — auth  │   │
│   │   ├─ api/           Route handlers: streaming, cron, webhooks    │   │
│   │   └─ middleware.ts  Supabase session refresh                     │   │
│   └──────────────────────────────────────────────────────────────────┘   │
│   Edge runtime: AI streaming, transcript extract (cold start nhanh)      │
│   Node runtime: Whisper fallback, PDF/email gen                          │
└────────────┬─────────────────────────────────┬───────────────────────────┘
             │                                 │
             ▼                                 ▼
┌──────────────────────────────┐   ┌────────────────────────────────────────┐
│      SUPABASE (BaaS)         │   │      DỊCH VỤ AI / NỘI DUNG NGOÀI       │
│  ┌────────────────────────┐  │   │  ┌──────────────────────────────────┐  │
│  │ PostgreSQL 15          │  │   │  │ Google Gemini API                │  │
│  │  + pgvector (vector)   │  │   │  │   - gemini-3.1-pro-preview       │  │
│  │  + pg_cron (jobs)      │  │   │  │   - gemini-3-flash               │  │
│  │  + pg_trgm (fuzzy)     │  │   │  │   - gemini-3.1-flash-lite        │  │
│  └────────────────────────┘  │   │  │   - gemini-embedding-2-preview   │  │
│  ┌────────────────────────┐  │   │  └──────────────────────────────────┘  │
│  │ Auth (JWT trong cookie │  │   │  ┌──────────────────────────────────┐  │
│  │  HTTP-only, email+OAuth)│  │   │  │ OpenRouter (dự phòng)            │  │
│  └────────────────────────┘  │   │  │   - deepseek/deepseek-chat-v3    │  │
│  ┌────────────────────────┐  │   │  │   - meta-llama/llama-3.3-70b     │  │
│  │ Storage (audio, avatar)│  │   │  └──────────────────────────────────┘  │
│  └────────────────────────┘  │   │  ┌──────────────────────────────────┐  │
│  ┌────────────────────────┐  │   │  │ YouTube Transcript                │  │
│  │ Realtime (notifications│  │   │  │  npm: youtube-transcript          │  │
│  │  per-user channel)     │  │   │  │  + Whisper fallback (Replicate)  │  │
│  └────────────────────────┘  │   │  └──────────────────────────────────┘  │
│  ┌────────────────────────┐  │   │  ┌──────────────────────────────────┐  │
│  │ RLS bật trên 100% bảng │  │   │  │ @mozilla/readability             │  │
│  │  user-owned            │  │   │  │   - Article text extraction      │  │
│  └────────────────────────┘  │   │  └──────────────────────────────────┘  │
│  ┌────────────────────────┐  │   │  ┌──────────────────────────────────┐  │
│  │ Edge Functions (Deno)  │  │   │  │ LanguageTool API                 │  │
│  │  (tuỳ chọn, pre-process)│ │   │  │   - Grammar/spell pre-check      │  │
│  └────────────────────────┘  │   │  └──────────────────────────────────┘  │
└──────────────────────────────┘   └────────────────────────────────────────┘
```

---

## 2. Trách nhiệm từng lớp

### 2.1 Lớp trình bày (`app/`)
- **Mặc định Server Component** — fetch trực tiếp qua Supabase server client (JWT từ cookie được inject sẵn). RLS lo phần phân quyền; SC không cần `where user_id = ?`.
- **Client Component** chỉ dùng khi cần tương tác: mic recorder, editor viết, popup từ vựng, charts, drag-reorder, theme toggle.
- Streaming UI qua React Suspense + `loading.tsx` boundaries.

### 2.2 Server Actions (`app/.../actions.ts`)
Nguồn sự thật duy nhất cho mọi mutation. Mọi action wrap qua:
```ts
'use server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export async function saveVocabAction(input: unknown) {
  const data = SaveVocabSchema.parse(input);     // Zod validation
  const supabase = await createClient();          // server client w/ JWT
  return vocabRepo.save(supabase, data);          // delegate → repository
}
```

### 2.3 Route Handlers (`app/api/`)
Chỉ dùng cho:
- **Streaming response** từ LLM (`text/event-stream`).
- **Webhook** (Supabase trigger, scheduled jobs).
- **Callback** từ bên thứ ba.

### 2.4 Thư viện (`lib/`)
```
lib/
├── supabase/
│   ├── server.ts        # createClient() cho Server Components / Actions
│   ├── client.ts        # createClient() cho Client Components
│   └── middleware.ts    # session refresh trong Next middleware
├── ai/
│   ├── gemini.ts        # GeminiAdapter implements LLMProvider
│   ├── openrouter.ts    # OpenRouterAdapter implements LLMProvider
│   ├── provider.ts      # interface LLMProvider + factory()
│   └── prompts/         # speaking.ts, writing.ts, quiz.ts (template prompt)
├── content/
│   ├── youtube.ts       # transcript fetcher
│   ├── article.ts       # Readability extractor
│   └── extractor.ts     # ContentExtractor strategy interface
├── speech/
│   ├── stt.ts           # browser STT wrapper (client-only)
│   └── tts.ts           # browser TTS wrapper (client-only)
├── srs/
│   └── sm2.ts           # SuperMemo-2 scheduler
├── repositories/
│   ├── vocab.repo.ts
│   ├── deck.repo.ts
│   ├── essay.repo.ts
│   ├── speaking.repo.ts
│   └── notification.repo.ts
└── schemas/             # Zod schemas, dùng chung Server Actions
```

### 2.5 Dữ liệu (Supabase Postgres)
- **Tách schema theo concern:** `auth.*` (Supabase quản lý), `public.*` (app tables).
- Mọi bảng user-owned có cột `user_id uuid` FK → `auth.users(id)` và policy RLS `using (auth.uid() = user_id)`.
- Mọi bảng có `created_at timestamptz default now()` + `updated_at timestamptz default now()` (giữ tươi bởi trigger `set_updated_at()`).
- Index cho mọi FK + cột thường được filter (`user_id`, `next_review_at`, …).
- **pgvector** lưu embedding 1536-d cho `tu_da_luu` và `nguon_noi_dung` (dedup ngữ nghĩa, gợi ý nội dung tương tự).
- **pg_cron** chạy hằng đêm để enqueue thông báo ôn tập.

---

## 3. Xác thực & phân quyền

- **Supabase Auth** với email/password + Google OAuth.
- JWT lưu trong **cookie HTTP-only** (xử lý bởi `@supabase/ssr`); refresh tự động ở Next middleware mỗi request.
- **RLS** là tầng phân quyền chính. Code server **không** tự kiểm tra ownership lại — tin cậy policy. Repository nhận client Supabase (đã mang JWT) — không thể lộ dữ liệu vì DB tự filter theo `auth.uid()`.
- Service-role key chỉ dùng trong:
  - Job `pg_cron` (ví dụ enqueue nhắc nhở cho tất cả user).
  - Migration admin một-lần.

  Tuyệt đối không xuất hiện trong code đường request thông thường.

---

## 4. Tích hợp AI (Strategy + Adapter)

Hệ thống nói chuyện với nhiều LLM provider (Gemini chính, OpenRouter dự phòng). Để tránh feature bị khoá cứng vào vendor, dùng **Strategy** sau interface `LLMProvider`:

```ts
// lib/ai/provider.ts
export interface LLMProvider {
  chat(messages: Message[], opts?: ChatOpts): Promise<string>;
  chatStream(messages: Message[], opts?: ChatOpts): AsyncIterable<string>;
}

export function llm(): LLMProvider {
  if (rateLimit.allow('gemini')) return new GeminiAdapter();
  return new OpenRouterAdapter('deepseek/deepseek-chat-v3');
}
```

Feature chỉ gọi `llm().chatStream(...)` — không bao giờ import SDK vendor trực tiếp.

**Prompt** sống trong `lib/ai/prompts/*.ts` ở dạng function thuần trả về template:
```ts
export const writingScorePrompt = (essay: string, taskType: 'task1'|'task2') => [...];
```
Lý do: prompt được version-control, test được, dễ A/B.

---

## 5. Realtime & thông báo

- Bảng `thong_bao` + channel Supabase Realtime `thong_bao:nguoi_dung:<uid>`.
- Client subscribe khi app shell mount; INSERT mới push xuống dưới dạng toast + bell tray.
- **Nhắc ôn theo lịch** sinh ra bởi `pg_cron` hằng đêm → INSERT vào `thong_bao` → push qua Realtime.
- **Browser Notifications API** opt-in cho push cấp OS khi tab đóng.

---

## 6. Chiến lược cache

| Dữ liệu | Cache | Invalidation |
|---|---|---|
| Trang tĩnh (landing, pricing) | Vercel Edge (`force-static`) | Trên mỗi deploy |
| User profile, bo_tu | `revalidateTag('user:<uid>:bo_tu')` trong Server Action | Tag bị invalid sau mutation |
| Transcript YouTube | Bảng `nguon_noi_dung` — cache theo `ma_bam_url` | Manual refresh |
| LLM cho prompt deterministic (dictionary lookup) | Bảng `vocab_lookups` | TTL 30 ngày |
| LLM cho prompt user-specific (chấm bài) | Không cache |

---

## 7. Pipeline speech

```
[mic của user] → MediaRecorder → ArrayBuffer
   │                              │
   │ (đường ưu tiên)              │ (đường fallback)
   ▼                              ▼
Web Speech API STT          Upload → /api/transcribe
(SpeechRecognition)         (Whisper qua Replicate/Together)
   │                              │
   └──────────────┬───────────────┘
                  ▼
            Transcript string
                  │
                  ▼
        LLM speaking-feedback prompt (Gemini 3.1 Pro)
                  │
                  ▼
        Streaming response → client UI:
          { transcript, corrections[], suggestions[] }
                  │
                  ▼
       Web Speech TTS đọc reply
```

Web Speech API được ưu tiên (miễn phí, trong browser, gần như tức thì). Whisper fallback chỉ chạy khi `SpeechRecognition` không khả dụng (Safari iOS cũ) hoặc confidence < 0.6.

---

## 8. Cấu trúc thư mục (app sản xuất — không phải design system)

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                  # landing
│   │   └── pricing/page.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                # sidebar + topbar, yêu cầu auth
│   │   ├── dashboard/page.tsx
│   │   ├── speak/page.tsx
│   │   ├── speak/[characterId]/page.tsx
│   │   ├── vocab/page.tsx            # deck list
│   │   ├── vocab/[deckId]/page.tsx   # deck detail + review
│   │   ├── read/page.tsx             # paste URL
│   │   ├── read/[sourceId]/page.tsx  # reader view
│   │   ├── write/page.tsx            # prompt list
│   │   ├── write/[essayId]/page.tsx  # editor
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── ai/stream/route.ts        # SSE cho LLM streaming
│   │   ├── transcribe/route.ts       # Whisper fallback
│   │   ├── youtube/route.ts          # transcript extraction
│   │   └── cron/*                    # webhook từ vercel cron
│   ├── layout.tsx
│   └── globals.css                   # @import "tailwindcss"
├── components/
│   ├── ui/                           # shadcn primitives (auto-gen)
│   └── app/                          # Lumio-specific
├── lib/                              # xem §2.4
├── middleware.ts                     # session refresh
└── types/supabase.ts                 # auto-gen từ schema
supabase/
├── migrations/                       # SQL versioned
└── seed.sql
```

---

## 9. Triển khai (Vercel)

- **Preview deployment** trên mọi PR — Supabase dev project chia sẻ, biến môi trường scope theo branch.
- **Production** trên push `main` — Supabase prod project.
- **Edge runtime** opt-in trên các route:
  - `/api/ai/stream` — độ trễ thấp cho streaming
  - `/api/youtube` — fetch transcript toàn cầu
- **Node runtime** cho phần còn lại (Whisper, PDF, dep nặng).
- **Cron jobs** qua `vercel.json` (lưu ý Hobby tier chỉ chạy được daily); endpoint `/api/cron/*` xác thực bằng header `Authorization: Bearer ${CRON_SECRET}`. Mỗi cron route gọi function Postgres qua service-role client.

---

## 10. Quan sát

- **Vercel Analytics** — page-load + Web Vitals.
- **Supabase logs** — query timing.
- **Sentry** — client + server error.
- **PostHog** — product analytics (drop-off onboarding, feature usage).

---

## 11. Checklist bảo mật

- [x] RLS bật trên 100% bảng `public.*` user-owned
- [x] Service-role key chỉ trong cron + migration
- [x] CSRF được Next Server Actions xử lý (`origin` check)
- [x] Upload qua Supabase Storage có MIME validation
- [x] User input trong prompt LLM bọc trong delimiter; không có system action nhạy cảm prompt-injection
- [x] Rate limit theo `user_id` cho mọi endpoint AI (Upstash Redis, free tier)
- [x] Mọi secret trong env Vercel; không bundle về client
- [x] Reset password rate-limit 3/giờ/email (mặc định Supabase)
- [x] CSP nonce cho App Router (cấu hình theo Next.js 16 security guide)
- [x] Cập nhật Next.js patch ngay khi có security release
