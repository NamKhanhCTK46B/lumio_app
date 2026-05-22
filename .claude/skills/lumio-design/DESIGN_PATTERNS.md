# Lumio — Các mẫu thiết kế phần mềm

> Các mẫu thiết kế (design pattern) được dùng trong codebase Lumio và **lý do** mỗi mẫu phù hợp.
> Pattern không phải mục tiêu — nó là cách diễn đạt sạch nhất cho một ràng buộc thực tế. Mỗi pattern dưới đây map vào một ràng buộc trong bộ tính năng.

---

## 1. Repository pattern — ranh giới truy cập dữ liệu

**Ở đâu:** `lib/repositories/*.repo.ts`
**Ràng buộc:** Server Components, Server Actions, cron jobs, và API routes đều đọc cùng các bảng. Không có ranh giới → query shape trôi dạt và N+1 rò rỉ khắp nơi.
**Hình dạng:** Mỗi nhóm bảng có một repository với method tường minh.

```ts
// lib/repositories/vocab.repo.ts
export const vocabRepo = {
  async listByDeck(supabase: SupabaseClient, deckId: string) {
    const { data, error } = await supabase
      .from('vocab_words')
      .select('id, lemma, pos, definition_vi, status, vocab_reviews(next_review_at)')
      .eq('deck_id', deckId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  async save(supabase: SupabaseClient, input: SaveVocabInput) { /* ... */ },
  async dueForReview(supabase: SupabaseClient, limit = 20) { /* ... */ },
};
```

**Lợi ích.** Tất cả query shape sống trong một file mỗi concern; RLS đã lo auth nên method không cần tham số `userId`; test mock một module duy nhất.

---

## 2. Strategy + Adapter — trừu tượng hoá LLM provider

**Ở đâu:** `lib/ai/provider.ts`, `lib/ai/gemini.ts`, `lib/ai/openrouter.ts`
**Ràng buộc:** Free tier của Gemini rate-limit chặt; cần fallback sang model free của OpenRouter mà **không** khoá tính năng vào một vendor.
**Pattern:** **Strategy** — các thuật toán khác nhau (provider) sau cùng interface `LLMProvider`. **Adapter** — wrap SDK từng vendor để các đặc thù (message format, streaming protocol, error shape) không rò ra.

```ts
export interface LLMProvider {
  chat(messages: Message[], opts?: ChatOpts): Promise<string>;
  chatStream(messages: Message[], opts?: ChatOpts): AsyncIterable<string>;
}

export class GeminiAdapter implements LLMProvider { /* map sang @google/genai */ }
export class OpenRouterAdapter implements LLMProvider { /* map sang OpenAI-compat */ }

export function llm(): LLMProvider {
  if (rateLimit.allow('gemini')) return new GeminiAdapter();
  return new OpenRouterAdapter('deepseek/deepseek-chat-v3');
}
```

**Lợi ích.** Thêm provider thứ ba = một file, không cần đụng feature.

---

## 3. Factory — chọn extractor cho từng loại nội dung

**Ở đâu:** `lib/content/extractor.ts`
**Ràng buộc:** YouTube, bài báo, podcast — mỗi loại cần thuật toán extract khác nhau, nhưng feature chỉ gọi một API duy nhất "trích nội dung từ URL này".

```ts
export interface ContentExtractor {
  canHandle(url: string): boolean;
  extract(url: string): Promise<ExtractedContent>;
}

const extractors: ContentExtractor[] = [
  new YouTubeExtractor(),
  new PodcastRssExtractor(),
  new ArticleExtractor(),   // catch-all qua Readability
];

export function extractorFor(url: string): ContentExtractor {
  const ex = extractors.find(e => e.canHandle(url));
  if (!ex) throw new UnsupportedSourceError(url);
  return ex;
}
```

**Lợi ích.** Thêm Spotify support = thêm 1 extractor, push vào mảng.

---

## 4. Observer (qua Supabase Realtime) — thông báo + presence

**Ở đâu:** `components/app/notifications-tray.tsx`, `lib/supabase/client.ts`
**Ràng buộc:** Khi `pg_cron` enqueue một hàng `notifications`, tab đang mở của user phải bật ngay. Không thể polling.

```ts
useEffect(() => {
  const channel = supabase
    .channel(`notifications:user:${userId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      payload => addToTray(payload.new),
    )
    .subscribe();
  return () => { supabase.removeChannel(channel); };
}, [userId]);
```

**Lợi ích.** Push channel miễn phí (Supabase Realtime). DB là nguồn sự thật — không cần event bus riêng.

---

## 5. State machine — vòng đời placement test + writing editor

**Ở đâu:** `components/app/level-assessment/machine.ts`, `components/app/essay-editor/machine.ts` (XState)
**Ràng buộc:** Placement test có pha rõ ràng (`intro → question[i] → grading → result`) và cấm back-transition; editor essay có `draft / submitting / scored / revising`. Bug ở chỗ này *cực kỳ tệ* (mất bài, chấm sai).
**Pattern:** Finite state machine — dùng XState API gọn `createMachine`.

```ts
const essayMachine = createMachine({
  id: 'essay',
  initial: 'draft',
  states: {
    draft:      { on: { SUBMIT: 'submitting' } },
    submitting: { invoke: { src: scoreEssayActor, onDone: 'scored', onError: 'draft' } },
    scored:     { on: { REVISE: 'draft' } },
  },
});
```

**Lợi ích.** Trạng thái bất hợp lệ không biểu diễn được; UI chỉ render theo state hiện tại.

---

## 6. Spaced-repetition algorithm — SM-2 (biến thể Strategy)

**Ở đâu:** `lib/srs/sm2.ts`
**Ràng buộc:** Ôn từ vựng phải giãn cách hợp lý mà không lưu nhiều hơn vài int trên mỗi từ.
**Pattern:** Thuật toán SuperMemo-2, cô lập trong function pure để dễ test.

```ts
export function sm2Next(prev: ReviewState, quality: 0|1|2|3|4|5): ReviewState {
  if (quality < 3) {
    return { repetition: 0, intervalDays: 1, easeFactor: prev.easeFactor };
  }
  const ef = Math.max(1.3,
    prev.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
  const rep = prev.repetition + 1;
  const interval =
    rep === 1 ? 1 :
    rep === 2 ? 6 :
    Math.round(prev.intervalDays * ef);
  return { repetition: rep, intervalDays: interval, easeFactor: ef };
}
```

Cô lập SRS strategy → có thể chuyển sang **FSRS** sau này mà không đụng UI review.

---

## 7. Server Action + Zod schema — validate ngay tại biên giới

**Ở đâu:** `app/.../actions.ts`, `lib/schemas/*.ts`
**Ràng buộc:** Form submit và gọi AJAX có thể mang bất cứ gì. Cần một lớp validation duy nhất throw thông báo có nghĩa trước khi đụng DB.

```ts
// lib/schemas/vocab.ts
export const SaveVocabSchema = z.object({
  lemma: z.string().trim().min(1).max(64),
  deckId: z.string().uuid().optional(),
  sourceId: z.string().uuid().optional(),
});
export type SaveVocabInput = z.infer<typeof SaveVocabSchema>;

// actions.ts
export async function saveVocabAction(raw: unknown) {
  const data = SaveVocabSchema.parse(raw);
  return vocabRepo.save(await createClient(), data);
}
```

**Lợi ích.** Type suy ra từ schema (một nguồn sự thật); lỗi thân thiện cho user.

---

## 8. CQRS-lite — read path không đi qua mutation

**Ở đâu:** Ngầm khắp `app/`
**Ràng buộc:** Server Component đọc trực tiếp Supabase (nhanh, RLS-protected). Mutation đi qua Server Action. Không giả vờ read & write dùng chung infrastructure.
**Pattern:** Command (Server Action) và Query (Server Component fetch) tách nhau. Server Action gọi `revalidateTag()` để invalidate query cache.

---

## 9. Optimistic UI qua React Transitions

**Ở đâu:** Nút save vocab, toggle star, drag reorder deck
**Ràng buộc:** Tính năng AI nặng nề; thao tác nhỏ phải có cảm giác tức thì.
**Pattern:** `useOptimistic` + `useTransition` — cập nhật UI trước khi Server Action xong; reconcile ở response.

```tsx
const [optimisticWords, addOptimistic] = useOptimistic(words, /* reducer */);
const [pending, start] = useTransition();

function onSave(lemma: string) {
  start(async () => {
    addOptimistic({ lemma, status: 'new' });
    await saveVocabAction({ lemma });
  });
}
```

---

## 10. Compound Component — `WordPopup`, `EssayEditor`

**Ở đâu:** `components/app/word-popup/*`
**Ràng buộc:** Popup có nhiều sub-part (định nghĩa, ví dụ, nút lưu, player phát âm) chia state. Prop-drilling tệ; context nội bộ trong một component family thì sạch.
**Pattern:** Compound components với context nội bộ.

```tsx
<WordPopup word={w}>
  <WordPopup.Header />
  <WordPopup.Phonetic />
  <WordPopup.Definitions />
  <WordPopup.Examples />
  <WordPopup.Actions />
</WordPopup>
```

---

## 11. Hexagonal-lite — core thuần, edges bẩn

Codebase Lumio đặt **function thuần** (SRS scheduler, CEFR estimator, transcript parser, IELTS band aggregator) trong `lib/` với **zero** import Supabase hay Next.js. Nhận primitive, trả primitive. Edges "bẩn" (HTTP, DB, LLM) compose pure logic thành pipeline.

**Lợi ích.** Lớp khó-test (HTTP, DB) wrap quanh core trivial-to-test. CI nhanh.

---

## 12. Token-driven theming — design token là CSS var

**Ở đâu:** `colors_and_type.css`, Tailwind `@theme` block
**Ràng buộc:** Hai theme (sáng + tối), một codebase, không bùng nổ `dark:` class cho mọi primitive.
**Pattern:** CSS custom property là *nguồn duy nhất* cho theme value. Tailwind v4 `@theme {}` đọc từ chúng.

```css
:root { --lm-fg: #0E1A2B; --lm-primary: #E8A33D; /* ... */ }
[data-theme="dark"] { --lm-fg: #F5EFE3; /* ... */ }
```

Component chỉ viết `text-fg`, `bg-primary` — không bao giờ hex thô. Dark mode lật bằng cách đặt `data-theme` trên `<html>`.

---

## Anti-pattern Lumio cố tình tránh

| ❌ | Vì sao |
|---|---|
| Gọi SDK Gemini trực tiếp từ Server Component | Khoá UI vào một vendor; không fallback được; không rate-limit được |
| `where user_id = $1` trong query | RLS đã enforce; viết thủ công sinh thêm bug surface |
| Lưu JWT trong `localStorage` | Bị XSS lấy; dùng cookie HTTP-only qua `@supabase/ssr` |
| Global store Zustand/Redux | Server Components đã là store; phần lớn nơi không cần client state |
| File CSS riêng cho từng component | Đã có một file token + Tailwind — không scatter CSS |
| Spinner ở mọi action | Optimistic UI + Suspense làm phần lớn spinner trở nên không cần thiết |
