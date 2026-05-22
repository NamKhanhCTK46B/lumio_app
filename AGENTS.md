<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTS.md — Lumio coding rules

> Convention chuẩn cho Cursor / Claude Code / Windsurf / Aider. Chi tiết 330 dòng ở [docs/AGENT.md](docs/AGENT.md). File này chỉ giữ phần **must-know** để mọi agent đọc nhanh.

## Stack khoá (chi tiết: [docs/TECH_STACK.md](docs/TECH_STACK.md))

- **Next.js 16** App Router + Server Components + Server Actions + Turbopack.
- **TypeScript 5.7+** strict, `noUncheckedIndexedAccess`.
- **Tailwind CSS v4** (CSS-first config, `@theme {}` trong `src/app/globals.css`).
- **shadcn/ui** + Radix + lucide-react.
- **Supabase** (Postgres + Auth + Storage + Realtime) — RLS là tầng auth chính.
- **`@google/genai`** → Gemini 3.x; fallback **OpenRouter**.
- **Zod 3.23+** = source of truth cho mọi schema.
- **react-hook-form** + `@hookform/resolvers/zod` cho form client.
- **next-intl** cho i18n (vi mặc định, en optional).
- **Zustand 5** chỉ khi cần global state nhỏ (UI). Không Redux/MobX/SWR/React Query/tRPC/Prisma/Axios.

## Cấu trúc thư mục (chi tiết: [docs/TECH_STACK.md §11](docs/TECH_STACK.md))

```
src/
├── app/
│   ├── (marketing)/ (auth)/ (app)/ api/
│   ├── layout.tsx · globals.css
├── components/{ui,app}/
├── lib/{supabase,ai,content,speech,srs,repositories,schemas}/ · utils.ts
├── proxy.ts                ← Next 16: thay middleware.ts cũ
└── types/
```

## 5 quy tắc cứng

1. **Mặc định Server Component.** `'use client'` chỉ khi cần state/effect/browser API.
2. **Mutation = Server Action** (`'use server'`), wrap input bằng Zod, gọi `revalidateTag/Path`.
3. **Repository pattern.** `lib/repositories/<entity>.repo.ts` nhận `supabase` làm tham số (không nhận `userId`). Tin RLS.
4. **LLM call qua `llm()`** từ `lib/ai/provider.ts`. Không import `@google/genai` trực tiếp trong feature code.
5. **i18n.** Mọi UI string qua `useTranslations()`. Tiếng Việt mặc định, gọi user là `bạn`. Không emoji trong UI.

## Clean code & chú thích (chi tiết: [docs/AGENT.md §3.9](docs/AGENT.md))

- **Đặt tên đầy đủ nghĩa.** `dueWords` thay vì `dw`; `gradeReviewAction` thay vì `doIt`. Không viết tắt domain (CEFR, IELTS, SRS giữ nguyên).
- **Hàm ≤ 40 dòng, 1 nhiệm vụ.** Nếu phải scroll để đọc hết → tách.
- **Early return** thay vì lồng `if`. Không `else` sau `return`.
- **Không magic number / magic string** — gom vào const có tên (`MAX_REVIEW_BATCH = 20`).
- **Immutable mặc định** — `const` + spread/`map`, không mutate tham số.
- **Không catch nuốt lỗi.** `catch` phải log + re-throw hoặc trả lỗi có nghĩa cho user.
- **DRY có chừng mực** — lặp 3 lần mới trừu tượng hoá; 2 lần chấp nhận.
- **Comment = tiếng Việt, giải thích *tại sao*.** Không mô tả *cái gì* (code tự nói). Ví dụ: `// Dùng SM-2 thay vì FSRS vì dataset hiện chưa đủ để fit FSRS`. Tránh comment rác (`// loop qua mảng`).
- **JSDoc tiếng Việt** cho hàm public của repository / server action / prompt builder — mô tả input, output, side effect.

## Bảo mật (chi tiết: [docs/ARCHITECTURE.md §11](docs/ARCHITECTURE.md))

- RLS bật trên **100%** bảng `public.*` user-owned + 4 policy (select/insert/update/delete).
- Service-role key chỉ trong `app/api/cron/*` (check `Authorization: Bearer ${CRON_SECRET}`).
- Cookie HTTP-only qua `@supabase/ssr`, không `localStorage`.
- Rate limit bằng `@upstash/ratelimit` cho mọi endpoint AI.
- Wrap user input trong prompt LLM bằng delimiter (`<essay>...</essay>`) — không trộn vào system role.

## Workflow

- **Trước khi viết code:** xác định UCx → bảng DB → file path → nếu > 3 file → hỏi user.
- **Commit:** Conventional Commits tiếng Việt (`feat(vocab): ...`). 1 commit = 1 ý.
- **Không push thẳng `main`** — luôn qua feature branch + PR.
- **Khi gặp lỗi:** tìm root cause, viết regression test. Không workaround.

## Slash commands & subagents

- [.claude/commands/](.claude/commands/): `/feature` `/migration` `/prompt` `/review`.
- [.claude/agents/](.claude/agents/): `db-migrator` `ui-builder` `test-writer`.
- [.claude/skills/lumio-design/](.claude/skills/lumio-design/): design system skill (token + UI kit + brand voice).

> Quy ước Claude Code chi tiết (model/thinking budget/quota saving): [docs/CLAUDE.md](docs/CLAUDE.md).
