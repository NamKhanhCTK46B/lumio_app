# PROMPTS.md — Prompt bootstrap cho Claude Code (Lumio)

> Bộ prompt đã được tinh chỉnh theo **Anthropic best-practice 2026** + **Next.js 16** + **Supabase SSR (`getClaims`)**.
> Trọng tâm domain: luyện **đọc — phát âm — giao tiếp** tiếng Anh cho người Việt.
>
> Mọi prompt giả định bạn đang ở repo `lumio-app/`, Claude Code đã đọc `CLAUDE.md` + `AGENTS.md`.

## Nguyên tắc viết prompt áp dụng trong file này

- **Role prompting**: mở đầu bằng "Bạn là …" để khoá persona.
- **XML delimiter**: wrap input người dùng (`<target>`, `<user-transcript>`, `<diff>`, `<repro>`) — chống prompt injection, parse rõ.
- **Clear deliverable**: cuối prompt nêu rõ output format (JSON schema, danh sách file path, bullet list).
- **Chain of thought** cho task phức tạp: yêu cầu Claude nghĩ trong `<thinking>` trước. Dùng từ khoá `ultrathink` cho reasoning sâu (Opus 4.7).
- **Prefilling** `{` khi cần buộc JSON output.
- **Be specific**: nêu rõ context, constraint, audience (người Việt học tiếng Anh).
- **Voice Lumio**: gọi user là "bạn", không "quý khách", không emoji UI, ấm áp + khuyến khích.

---

## 1. Bootstrap project (đã chạy — tham chiếu)

Đã hoàn thành ở commit đầu tiên. Chi tiết thực tế xem `docs/TECH_STACK.md §10` + `git log --oneline`. Prompt gốc lưu trong `git show ae33aa5` nếu cần.

---

## 2. `/feature UC7` — Triển khai Speaking (luyện phát âm)

> **Khi dùng:** triển khai use case UC7 (Speaking). **Model:** `claude-opus-4-7` effort `medium`.

```
/feature 7

Bạn là kỹ sư senior triển khai UC7 "Luyện phát âm tiếng Anh" cho Lumio.

<context>
- Người dùng: người Việt học tiếng Anh, trình độ A2–C1.
- Flow: chọn câu mẫu → bấm mic → đọc to → STT (Web Speech API, fallback Whisper) → so sánh với câu mục tiêu → LLM chấm pronunciation theo IPA + intonation + stress → hiển thị từng từ với điểm + lỗi cụ thể + tip + lời khuyến khích.
- Đọc docs/USE_CASES.md §UC7 và docs/DATABASE.md §<speaking_attempts> trước khi lập kế hoạch.
</context>

<constraints>
- Next.js 16: Server Action với `await cookies()`; mutation phải `updateTag('speak:'+userId)` (read-your-writes) thay vì `revalidateTag`.
- Supabase: query qua `supabase.auth.getClaims()` ở Server Component, không dùng `getSession()`.
- STT phía client trong _components/ (cần 'use client'); LLM call qua `llm()` từ src/lib/ai/provider.ts (không import @google/genai trực tiếp).
- Mọi UI string qua `useTranslations('speak')`.
- Rate limit 30 attempt/giờ/user qua @upstash/ratelimit.
</constraints>

<deliverable>
1. Liệt kê file sẽ tạo (đường dẫn tuyệt đối). Nếu > 3 file mới → dừng, xin xác nhận.
2. Server Action signature (input Zod + return type).
3. Thứ tự triển khai: Zod → repo → action → page (SC) → client (_components) → i18n key → test.
</deliverable>

KHÔNG code ngay. Trả về plan trước.
```

---

## 3. `/migration speaking-attempts` — Schema cho session luyện phát âm

> **Khi dùng:** thêm bảng lưu lịch sử attempt. **Model:** `claude-opus-4-7` effort `medium`.

```
/migration speaking-attempts

Tạo migration Supabase cho bảng speaking_attempts.

<schema-spec>
- id uuid primary key default uuid_generate_v4()
- user_id uuid → auth.users(id) ON DELETE CASCADE
- target_text text NOT NULL                   -- câu mẫu user phải đọc
- target_ipa text                              -- IPA tham chiếu
- user_transcript text NOT NULL                -- STT output
- audio_url text                               -- Supabase Storage path (nullable nếu user không cho lưu)
- overall_score int NOT NULL CHECK (overall_score BETWEEN 0 AND 100)
- word_scores jsonb NOT NULL                   -- [{word, ipa, userIpa, score, issue, tip}]
- intonation_score int CHECK (intonation_score BETWEEN 0 AND 100)
- stress_score int CHECK (stress_score BETWEEN 0 AND 100)
- duration_ms int                              -- độ dài audio
- created_at timestamptz NOT NULL default now()
- updated_at timestamptz NOT NULL default now()

Index: (user_id, created_at desc), (user_id, overall_score).
Trigger: set_speaking_attempts_updated_at.
RLS: 4 policy chuẩn (auth.uid() = user_id) cho select/insert/update/delete.
</schema-spec>

<deliverable>
1. File SQL ở supabase/migrations/<ts>_speaking_attempts.sql.
2. Regenerate src/types/supabase.ts.
3. Update docs/DATABASE.md thêm section mới + cập nhật §19 ER cardinality.
4. Rollback `drop table` dưới comment.
</deliverable>
```

---

## 4. `/prompt pronunciation-feedback` — LLM chấm phát âm

> **Khi dùng:** tạo prompt mới chấm pronunciation. **Model dev:** `claude-opus-4-7`. **Model runtime LLM:** `gemini-3.1-pro-preview` (cần accuracy phonetic).

```
/prompt pronunciation-feedback

Tạo prompt LLM trong src/lib/ai/prompts/pronunciation-feedback.ts.

<role>
Bạn là giáo viên IELTS Speaking 10 năm kinh nghiệm dạy người Việt. Bạn nhận diện được các lỗi phát âm phổ biến của người Việt: thiếu âm cuối /s/ /z/ /t/ /d/, nhầm /θ/ ↔ /t/ /s/, nhầm /ð/ ↔ /d/ /z/, sai trọng âm từ 2+ âm tiết, intonation flat (không lên xuống).
</role>

<input>
Server Action sẽ gọi prompt với:
- targetText: string (câu user phải đọc)
- targetIpa: string (IPA tham chiếu, optional)
- userTranscript: string (STT output từ Web Speech / Whisper)
- userLevel: 'A2' | 'B1' | 'B2' | 'C1'
</input>

<output-schema-zod>
PronunciationFeedbackResponseSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  intonationScore: z.number().int().min(0).max(100),
  stressScore: z.number().int().min(0).max(100),
  wordScores: z.array(z.object({
    word: z.string(),
    ipa: z.string(),               // IPA chuẩn
    userIpa: z.string(),            // IPA ước lượng từ transcript
    score: z.number().int().min(0).max(100),
    issue: z.enum(['ok','missing-ending','stress','vowel','consonant','intonation']),
    tip: z.string(),                // tiếng Việt, ngắn, hành động cụ thể
  })),
  encouragement: z.string(),        // tiếng Việt, ấm áp, 1-2 câu
});
</output-schema-zod>

<prompt-structure>
- System role: persona giáo viên IELTS + danh sách lỗi phổ biến người Việt.
- User role: wrap input bằng XML <target>...</target> + <user-transcript>...</user-transcript> + <level>...</level>.
- Yêu cầu: "Trả về JSON đúng schema. KHÔNG thêm text ngoài JSON."
- Output ngôn ngữ: `feedback`/`encouragement`/`tip` tiếng Việt; `ipa` + `issue` tiếng Anh kỹ thuật.
- Tone: cụ thể về kỹ thuật, ấm áp về cảm xúc. Không chê "phát âm tệ". Luôn ghi nhận 1 điểm tốt trước khi chỉ ra lỗi lớn nhất.
</prompt-structure>

<runtime-rules>
- Parse output qua Zod safeParse.
- Nếu fail: retry 1 lần với prompt strict hơn + prefilling assistant message bằng "{".
- Nếu vẫn fail: log + fallback OpenRouter (deepseek/deepseek-chat-v3).
- Comment ước tính token: "~600 input + 400 output, gemini-3.1-pro-preview".
</runtime-rules>

<deliverable>
1. File src/lib/ai/prompts/pronunciation-feedback.ts (schema + builder + type).
2. 3 fixture test `.test.ts`: (a) user nói đúng hoàn toàn, (b) sai trọng âm "comFORTable", (c) thiếu âm cuối /s/ ở "wants" "needs".
</deliverable>
```

---

## 5. Fix bug race condition trong Speaking session

> **Khi dùng:** bug action không idempotent. **Model:** `claude-opus-4-7` effort `medium`.

```
<repro>
- Vào /speak/[lessonId], chọn câu "I would like a coffee, please."
- Bật mic, đọc, dừng.
- Click "Lưu attempt" 2 lần liên tiếp (< 200ms) khi mạng chậm.
- Kết quả: 2 row trong speaking_attempts cùng transcript, cùng score.
</repro>

<task>
1. Tìm root cause (action thiếu idempotency key? UI không disable button khi pending?).
2. Fix: giữ optimistic UI (hiển thị score ngay), nhưng dedupe bằng client_attempt_id (uuid v4 sinh ở client trước khi submit) — unique constraint trên (user_id, client_attempt_id).
3. Viết Vitest regression test cho race case này (Promise.all 2 lần action với cùng client_attempt_id → assert 1 row + return cùng id).
4. Báo cáo: nguyên nhân + file đã sửa + test thêm.
</task>

Tham chiếu: docs/AGENT.md §7.2.
```

---

## 6. Refactor `/read/[sourceId]` (Reader page)

> **Khi dùng:** page > 250 dòng. **Model:** `claude-sonnet-4-6` effort `low`.

```
Refactor src/app/(app)/read/[sourceId]/page.tsx. Hiện tại file > 250 dòng. Tách thành:

- page.tsx (Server Component): await params, fetch source qua readerRepo.getSource(supabase, sourceId), pass props xuống client.
- _components/reader-text.tsx ('use client'): render đoạn văn, highlight từ over-level dùng class .lm-vocab-highlight, on-click → open WordPopup.
- _components/word-popup.tsx ('use client'): popup IPA + nghĩa + nút TTS (window.speechSynthesis), nút "Lưu vào sổ từ" gọi saveVocabAction.
- _components/save-vocab-button.tsx ('use client'): optimistic UI, dùng client_attempt_id cho idempotency.

<constraints>
- KHÔNG thêm tính năng mới. KHÔNG đổi public API của saveVocabAction.
- Sau khi tách: pnpm typecheck && pnpm lint && pnpm test phải xanh.
- Server Component vẫn dùng `await cookies()` qua createClient từ @/lib/supabase/server.
</constraints>

<deliverable>
Commit: refactor(read): tách reader page thành component nhỏ
</deliverable>
```

---

## 7. Performance check cho route Speaking

> **Khi dùng:** route /speak có cảm giác chậm. **Model:** `claude-sonnet-4-6` effort `low`.

```
Chạy `pnpm build` rồi đọc output Turbopack. Tìm trong các route /speak/*:

<checks>
1. Route nào có First Load JS > 200KB (audio worklet + STT polyfill thường nặng).
2. Component nào 'use client' nhưng không thực sự cần state/effect → đề xuất đẩy lên Server Component.
3. Image (vd. avatar giáo viên ảo, illustration) thiếu width/height → CLS.
4. Có dùng useMemo/useCallback thủ công không cần thiết (React Compiler 1.0 đã auto-memo).
</checks>

<deliverable>
Báo cáo top 3 vấn đề + file path + đề xuất fix cụ thể. KHÔNG sửa trước khi tôi xác nhận.
</deliverable>
```

---

## 8. Nâng cấp package

> **Khi dùng:** package có version mới quan trọng. **Model:** `claude-sonnet-4-6` effort `low`.

```
/chore upgrade-tailwind

<task>
Cập nhật tailwindcss lên latest trong dòng 4.x (không major).

1. Tạo branch chore/upgrade-tailwind.
2. Chạy `pnpm dlx @tailwindcss/upgrade@latest` nếu codemod có.
3. Update package.json + pnpm-lock.yaml.
4. Đối chiếu CHANGELOG: https://tailwindcss.com/blog.
5. Chạy: pnpm typecheck && pnpm lint && pnpm build && pnpm test.
6. Screenshot 3 màn key (dashboard, /speak, /read) trước-sau nếu visual đổi.
</task>

<constraints>
- KHÔNG upgrade major version trừ khi tôi nói rõ.
- KHÔNG đụng @theme {} trong globals.css trừ khi codemod yêu cầu.
</constraints>
```

---

## 9. Setup CI + deploy lần đầu lên Vercel

> **Khi dùng:** sẵn sàng deploy preview/production. **Model:** `claude-opus-4-7` effort `medium`.

```
Setup deploy Lumio lên Vercel + Supabase production.

<task>
1. Tạo .github/workflows/ci.yml: pnpm install → typecheck → lint → test → build. Trigger trên PR vào main.
2. Verify CI chạy được trên 1 PR test.
3. Hỏi tôi Supabase prod URL + anon/secret keys (ĐỪNG đoán, ĐỪNG dùng key dev).
4. Hướng dẫn từng bước cài Vercel env qua `vercel env add` HOẶC dashboard.
5. Tạo vercel.json với cron entry: /api/cron/srs-remind chạy 0 9 * * * (9h sáng nhắc luyện nói + ôn từ).
6. Verify preview deployment trên 1 branch test.
7. Có thể đề xuất MCP server `next-devtools-mcp@latest` cho session upgrade Next.js sau này.
</task>

<constraints>
- ĐỪNG tự push lên main.
- ĐỪNG tự promote production.
- Env phải tách rõ: NEXT_PUBLIC_SUPABASE_URL/ANON_KEY (prod), SUPABASE_SERVICE_ROLE_KEY (chỉ cron + admin), CRON_SECRET (random 32 ký tự).
</constraints>
```

---

## 10. Escalate khi medium thinking không ra

> **Khi dùng:** đã thử Opus 4.7 medium 2 lần thất bại. **Model:** `claude-opus-4-7` effort `high` hoặc `ultrathink`.

```
ultrathink

Tôi đã thử medium thinking 2 lần không ra. Vấn đề:

<problem>
STT Web Speech API có latency ~5-8 giây khi user nói câu dài > 30s ở mobile Safari iOS. Whisper fallback qua Replicate có cost cao + thêm 3-5s network. UC7 yêu cầu phản hồi < 3s sau khi user nói xong để giữ flow luyện nói.
</problem>

<request>
Đọc lại docs/USE_CASES.md §UC7 + docs/ARCHITECTURE.md §<phần STT/realtime>. Đề xuất 2-3 hướng giải pháp với trade-off rõ ràng:
- Cost (USD/1000 attempt)
- Latency P95
- Browser support
- Complexity setup

KHÔNG implement, chỉ phân tích.
</request>
```

---

## 11. Snippet ngắn — task cơ học (CLI mode)

> **Khi dùng:** task nhỏ + rõ ràng, dùng model nhẹ qua CLI flag.

```bash
# Fix tsc errors
claude --model claude-sonnet-4-6 "Fix all tsc errors in src/lib/speech. Run pnpm typecheck after."

# Sinh commit message từ staged diff (Conventional Commits, tiếng Việt)
claude --model claude-haiku-4-5 "git diff --staged → suggest 1 Conventional Commits message tiếng Việt, scope=speak hoặc read."

# Rename file + update imports
claude --model claude-sonnet-4-6 "Rename src/components/app/word-popup.tsx → vocab-popup.tsx và update mọi import."

# Đặt tên biến/file
claude --model claude-haiku-4-5 "Đặt tên cho component hiển thị từng câu trong roleplay (theo convention Lumio: kebab-case file, PascalCase component)."
```

---

## 12. `/feature UC14` — Conversation roleplay

> **Khi dùng:** triển khai luyện giao tiếp qua roleplay. **Model:** `claude-opus-4-7` effort `medium`.

```
/feature 14

Bạn là kỹ sư senior triển khai UC14 "Luyện giao tiếp qua roleplay AI" cho Lumio.

<context>
- Người dùng chọn 1 kịch bản: "Đặt cà phê", "Phỏng vấn xin việc", "Small talk sân bay", "Hỏi đường", "Khám bệnh".
- AI đóng vai NPC (barista, interviewer, stranger, …). User nói qua mic → STT → AI trả lời + feedback ngắn về ngữ pháp/từ vựng/độ tự nhiên ở turn user vừa nói.
- Lịch sử conversation lưu trong roleplay_sessions + roleplay_turns.
- Streaming AI response qua /api/ai/stream (Edge runtime cho LLM streaming).
- Đọc docs/USE_CASES.md §UC14 và docs/DATABASE.md §<roleplay_*> trước.
</context>

<constraints>
- Streaming: dùng ReadableStream từ @google/genai (gemini-3-flash, nhanh + cost thấp cho conversation turn).
- Server Action chỉ để save turn xong (mutation), `updateTag('roleplay:'+sessionId)`.
- Mỗi turn user nói: validate length 1-200 từ (Zod).
- Mọi UI string qua useTranslations('roleplay').
- Voice AI: TTS qua window.speechSynthesis (client only), giọng "Google US English" mặc định.
- Prompt LLM:
  - System role: "Bạn đóng vai <npc>. Nói tự nhiên, không gò bó. Sau câu trả lời, ngắt dòng và thêm <feedback>...</feedback> bằng tiếng Việt, NGẮN GỌN (1-2 câu), chỉ ra 1 điểm tốt + 1 điểm cải thiện ở turn user vừa nói."
  - User input wrap trong <user-turn>...</user-turn>.
  - Conversation history wrap trong <history>...</history>.
</constraints>

<deliverable>
1. Liệt kê file (dừng nếu > 3 file mới).
2. Schema bảng roleplay_sessions + roleplay_turns (nếu chưa có trong docs/DATABASE.md → gọi /migration trước).
3. Streaming API route handler signature.
4. Component <RoleplayBubble role="user|assistant" feedback={}> design.
</deliverable>
```

---

## 13. Anti-prompt + Checklist trước khi gửi

### Anti-prompt (đừng làm)

- "Hãy code toàn bộ Lumio cho tôi" — quá rộng, tốn token, không kiểm soát được chất lượng.
- "Sửa hết bug đi" — không có bug list cụ thể, không reproducible.
- "Làm cho nó đẹp hơn" — không actionable, không criteria.
- "Đọc tất cả file trong repo" — không bao giờ; dùng Grep/Glob hẹp.
- "Tự deploy lên production" — KHÔNG BAO GIỜ; user phải confirm prod deploy.
- "Tạo skill mới cho mỗi tính năng" — skill chỉ tạo khi pattern lặp lại > 3 lần.

### Checklist trước khi gửi prompt

- [ ] Đã nêu rõ use case (UC1–UC20)?
- [ ] Đã wrap user input bằng XML delimiter chưa (`<target>`, `<repro>`, `<diff>`)?
- [ ] Đã nêu file path cụ thể nếu sửa file có sẵn?
- [ ] Đã giới hạn phạm vi (không > 5 file mới)?
- [ ] Đã có `<deliverable>` rõ ràng cuối prompt?
- [ ] Đã chỉ định model cho task cơ học (`--model claude-sonnet-4-6` / `claude-haiku-4-5`)?
- [ ] Đã nói "ĐỪNG commit" / "ĐỪNG push" nếu chưa muốn auto?
- [ ] Đã yêu cầu `ultrathink` nếu task phức tạp + medium đã thử thất bại?
