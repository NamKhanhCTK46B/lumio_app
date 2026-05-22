# Lumio — Use case & các luồng chính

> 7 nhóm tính năng, 8 actor, mô tả đầy đủ từng luồng.
> Sơ đồ dạng ASCII để đọc được trên mọi editor.

---

## Actors

| Actor | Vai trò |
|---|---|
| **Khách (Guest)** | Người chưa xác thực, truy cập trang marketing |
| **Học viên (Learner)** | User đã xác thực — actor chính |
| **Hệ thống (System)** | Bản thân app Lumio (cron job, nhắc nhở tự động) |
| **AI (LLM)** | Gemini / OpenRouter — sinh phản hồi, quiz, hội thoại |
| **Speech engine** | Web Speech API (STT/TTS) trong browser |
| **Content extractor** | Dịch vụ trích xuất YouTube / báo / podcast |
| **Supabase Auth** | Identity provider |
| **Vercel cron** | Trình chạy job theo lịch |

---

## Bản đồ use case

```
                                ┌─────────────────────────────┐
                                │           LUMIO             │
                                │                             │
   ┌─────────┐                  │   UC1  Đăng ký              │
   │ Khách   │──────────────────▶  UC2  Đăng nhập             │
   └─────────┘                  │   UC3  Đặt lại mật khẩu     │
                                │                             │
   ┌─────────┐    UC4  Chỉnh sửa hồ sơ              ─┐         │
   │         │    UC5  Làm bài đánh giá trình độ      │        │
   │         │    UC6  Đặt mục tiêu học               │        │
   │         │                                        │        │
   │         │    UC7  Luyện nói với AI character     │        │
   │         │    UC8  Import YouTube/báo/podcast     │        │
   │         │    UC9  Lưu từ vựng từ nội dung        │        │
   │ Học viên├────UC10 Ôn từ (SRS hằng ngày)          │        │
   │         │    UC11 Làm quiz AI sinh ra            │        │
   │         │    UC12 Duyệt deck chủ đề hệ thống     │        │
   │         │                                        │        │
   │         │    UC13 Viết essay/email               │        │
   │         │    UC14 Nhận phản hồi kiểu IELTS       │        │
   │         │    UC15 Xem biểu đồ tiến độ            │        │
   │         │                                        │        │
   │         │    UC16 Nhận thông báo                 │        │
   │         │    UC17 Đổi theme / ngôn ngữ UI        │        │
   └─────────┘                                        │        │
                                                      │        │
   ┌─────────┐    UC18 Enqueue nhắc ôn hằng ngày      │        │
   │ Hệ thống├────UC19 Enqueue tổng kết tuần          │        │
   └─────────┘    UC20 Backfill embedding (hằng đêm)  │        │
                                                      │        │
                                └─────────────────────────────┘
```

---

## Tính năng 1 — Xác thực (UC1–4)

### UC1: Đăng ký
**Actor:** Khách
**Tiền điều kiện:** Chưa đăng nhập
**Luồng chính**

1. Khách mở `/signup`.
2. Nhập email + mật khẩu (hoặc bấm **Tiếp tục với Google**).
3. Frontend validate bằng Zod (`email`, password ≥ 8 ký tự, có ít nhất 1 số).
4. `signupAction` gọi `supabase.auth.signUp({...})`.
5. Supabase gửi email xác minh; trigger `on_auth_user_created` insert hàng default vào `ho_so`.
6. UI hiển thị "Kiểm tra email để xác minh / Check your email."
7. Sau khi click, Supabase verify → redirect tới `/onboarding`.

**Luồng phụ**
- 3a. Validation fail → lỗi inline dưới input.
- 4a. Email đã tồn tại → toast "Email này đã đăng ký. Đăng nhập?"
- 5a. Email không gửi được → nút fallback "Gửi lại email".

### UC2: Đăng nhập
1. `/login` → email + mật khẩu HOẶC Google OAuth.
2. `signinAction` → `supabase.auth.signInWithPassword(...)`.
3. Set cookie session HTTP-only.
4. Redirect tới `/dashboard` (hoặc trang vừa truy cập).

### UC3: Đặt lại mật khẩu
1. `/forgot` → nhập email.
2. `supabase.auth.resetPasswordForEmail(...)` gửi magic link.
3. User click → `/reset-password?token=...` → đặt mật khẩu mới.

### UC4: Chỉnh sửa hồ sơ
1. `/settings` → cập nhật `display_name`, `avatar_url`, `daily_goal_minutes`, `timezone`, `ngon_ngu_giao_dien`, `theme`.
2. Server action validate & update `ho_so`. RLS đảm bảo chỉ self update được.

---

## Tính năng 2 — Đánh giá trình độ & mục tiêu (UC5–6)

### UC5: Làm bài đánh giá trình độ
**Actor:** Học viên (thường ngay sau đăng ký; có thể làm lại sau 60 ngày)

```
Học viên       UI                     Server Action              AI
  │   /onboarding/test                       │                       │
  │──────────────────────▶                   │                       │
  │                       startAssessment()  │                       │
  │                       ────────────────▶  │                       │
  │                                          │── sinh Q1 ────────────▶
  │                                          │◀── câu hỏi + level ───│
  │  ◀──── câu 1 (text + audio TTS) ─────────│                       │
  │                                          │                       │
  │  nói / gõ câu trả lời                    │                       │
  │── submit answer ─────▶                   │                       │
  │                                          │── chấm + Q tiếp ──────▶
  │                                          │◀──────────────────────│
  │  ◀──── feedback + câu tiếp theo ─────────│                       │
  │                                          │                       │
  │     (lặp 10–12 câu, adaptive)                                    │
  │                                          │                       │
  │  ◀──── kết quả: CEFR B1, confidence 0.84 │                       │
  │     → lưu trinh_do_ket_qua vào ho_so      │                       │
```

**Logic adaptive.** Trả lời đúng, câu tiếp lên 1 mức (hoặc giữ); sai, xuống. Dừng khi 3 câu cùng mức ổn định.

### UC6: Đặt mục tiêu học
1. Sau test → `/onboarding/goals`.
2. Multi-select: IELTS, TOEIC, communication, business, travel, movies, academic.
3. Tuỳ chọn: điểm mục tiêu + deadline.
4. Insert vào `muc_tieu_nd`; đánh dấu một mục tiêu `la_muc_tieu_chinh`.

---

## Tính năng 3 — Luyện nói với AI (UC7)

```
Học viên             Client                Server (/api/ai/stream)         Gemini
   │   /speak  → chọn nhân vật: "Sophie · British"
   │ ─────────────────▶                                                       │
   │                   load nhân vật từ DB                                    │
   │   ◀──────────────                                                        │
   │                                                                          │
   │   chọn tình huống: "Ordering coffee"                                     │
   │ ─────────────────▶                                                       │
   │                   POST /api/ai/stream  (scenario, characterId)           │
   │                   ───────────────────────────▶                           │
   │                                       build system prompt từ             │
   │                                       nhan_vat.prompt_nhan_vat │
   │                                       ──── stream chat ────────────────▶│
   │                                       ◀──────── tokens ─────────────────│
   │                   ◀── SSE tokens ─────                                   │
   │   ◀── text trực tiếp ────                                                │
   │                                                                          │
   │   TTS đọc tin nhắn                                                       │
   │                                                                          │
   │   user giữ mic → STT transcribe → submit turn                            │
   │ ─────────────────▶ POST /api/ai/stream (next turn)                       │
   │                   ─── + các turn trước ──────▶                           │
   │                                       phân tích turn user (lỗi)          │
   │                                       ──────────────────────────────────▶│
   │                                       ◀── { reply, corrections[] } ─────│
   │   ◀── reply + panel sửa lỗi ─────                                        │
   │                                                                          │
   │   user kết thúc → lưu phien_noi + luot_noi
```

**Edge case**
- Browser chặn mic → banner trong trang "Cho phép microphone trong trình duyệt"
- Web Speech STT không hỗ trợ → server upload audio đã ghi tới `/api/transcribe` (Whisper).
- LLM rate-limit → fallback OpenRouter (Strategy pattern).

---

## Tính năng 4 — Học từ vựng từ nội dung (UC8–9, UC11)

### UC8: Import nguồn nội dung

```
Học viên   /read           ContentExtractor factory
   │  paste URL ─────────▶
   │                       canHandle?  YouTubeExtractor → yes
   │                       fetch transcript (youtube-transcript npm)
   │                       nếu không có caption → Edge → Whisper
   │                       lưu nguon_noi_dung + doan_noi_dung
   │                       compute embedding (gemini-embedding-2)
   │  ◀──── reader view ──
```

### UC9: Lưu một từ
1. Khi đang đọc, click vào từ bất kỳ.
2. Client mở `WordPopup` → fetch định nghĩa (cache `vocab_lookups` hoặc gọi Free Dictionary API).
3. Nút **Lưu** gọi `saveVocabAction({ lemma, sourceId, context })`.
4. Server insert vào `tu_da_luu` + `lich_on_tap` (với `on_tap_ke_luc = now()` cho ôn lần đầu).
5. Optimistic UI: từ chuyển sang gạch chân amber ngay lập tức.

### UC11: Làm quiz do AI sinh
1. Cuối reader → nút "Quiz từ vựng từ bài này".
2. Server action gọi LLM với danh sách từ user đã lưu + transcript → sinh 5–8 câu hỏi pha tạp.
3. Lưu trong `cau_hoi_tu_vung`; client render từng câu.
4. Khi user trả lời, cập nhật `lich_on_tap` qua SM-2 với quality grade.

---

## Tính năng 5 — Quản lý từ vựng (UC10, UC12)

### UC10: Ôn hằng ngày
```
Học viên  /vocab/review           Server                           Client
   │ ───────────────────▶  query lich_on_tap
   │                       where user_id = me
   │                         and on_tap_ke_luc <= now()
   │                       order by on_tap_ke_luc
   │                       limit 20
   │  ◀── các từ cần ôn ──                                         │
   │                                                                │
   │  với mỗi card:
   │     hiện lemma, ẩn nghĩa
   │     user grade "Lại / Khó / Tốt / Dễ" (4 nút)
   │     ────────────▶ sm2Next(prev, quality) → state mới
   │     update lich_on_tap + insert phien_hoc
```

### UC12: System topic bo_tu
- Hàng `bo_tu` read-only với `la_he_thong = true`.
- Duyệt chúng → thêm hàng vào `tu_da_luu` của user với `bo_tu_id` clone nhưng `lich_on_tap` mới cho từng user.

### Vocab dashboard
- Số liệu: tổng từ đã lưu, mastered (`status='mastered'`), learning, đến hạn hôm nay.
- Biểu đồ (Recharts): từ đã ôn / ngày trong 30 ngày qua từ `phien_hoc`.

---

## Tính năng 6 — Luyện viết (UC13–15)

### UC13: Viết essay
```
Học viên   /write                          Server
   │  chọn đề (IELTS Task 2 / email / free)  ← từ de_bai_viet
   │  bắt đầu bộ đếm thời gian
   │  draft autosave mỗi 10s ─────▶ upsert bai_viet (chưa nop_luc)
   │
   │  bấm Submit ──────────────────▶ scoreEssayAction(essayId)
   │                                   │
   │                                   │ (tuỳ chọn) pre-check qua LanguageTool API
   │                                   │
   │                                   │── LLM: build prompt với
   │                                   │   rubric (TA, CC, LR, GR)
   │                                   │── stream response
   │                                   │   { overall, breakdown,
   │                                   │     annotations[],
   │                                   │     rewritten_version,
   │                                   │     summary }
   │                                   ▼
   │  ◀─ panel điểm streaming ───     update bai_viet + insert
   │                                   chu_thich_bai_viet
   │
   │  hover annotation → tooltip inline (category, giải thích, gợi ý)
   │  click "Hiện bản viết lại" → diff view
```

### UC14: Nhận phản hồi kiểu IELTS
Cùng luồng với UC13 (bước submit). Bốn band score + tổng + highlight inline.

### UC15: Biểu đồ tiến độ
- `/write` hiển thị biểu đồ đường: band tổng theo thời gian (mỗi lần submit).
- Bar chart theo tiêu chí: trung bình TA / CC / LR / GR của 10 essay gần nhất.

---

## Tính năng 7 — Thông báo (UC16, UC18–20)

### UC18 (Hệ thống): Enqueue nhắc ôn hằng ngày
Job `pg_cron` chạy hằng đêm 03:00 ICT:

```sql
insert into thong_bao (user_id, type, title, body, action_url)
select vr.user_id, 'review_due', ..., '/vocab/review'
from lich_on_tap vr
where vr.on_tap_ke_luc <= now() + interval '1 day'
group by vr.user_id
having count(*) >= 1;
```

### UC16: Nhận thông báo (Học viên)
1. Client đã subscribe channel Realtime `thong_bao:nguoi_dung:<uid>`.
2. INSERT mới → toast hiện + bell icon hiển thị số unread.
3. Click bell → dropdown 20 thông báo gần nhất.
4. Click một item → đánh dấu `read_at = now()`, navigate tới `action_url`.

### UC19: Tổng kết tiến độ tuần
Cron Chủ nhật 01:00 UTC → tổng hợp `phien_hoc` trong tuần → enqueue thông báo `type='progress'`.

### UC20: Backfill embedding
Cron hằng đêm → tìm `tu_da_luu` / `nguon_noi_dung` có `embedding is null` → batch tới `gemini-embedding-2-preview` → update.

---

## Luồng cross-cutting: Onboarding (hợp thành)

```
[signup] → email verify → /onboarding/welcome
        → /onboarding/test          (UC5: placement test)
        → /onboarding/goals         (UC6: khảo sát mục tiêu)
        → /onboarding/preferences   (timezone, mục tiêu hằng ngày, theme)
        → /dashboard                (set ho_so.hoan_tat_onboard_luc)
```

Nếu `hoan_tat_onboard_luc IS NULL` trên request đã auth, middleware redirect về bước còn thiếu.

---

## Luồng cross-cutting: Đổi theme & ngôn ngữ (UC17)

- `<html data-theme="light" lang="vi">` set từ `ho_so.theme` và `ho_so.ngon_ngu_giao_dien` ở server (SSR-safe, không flash).
- Toggle trong `/settings` update `ho_so` + `document.documentElement.dataset.theme` ngay lập tức (optimistic).
- Attribute `data-theme` điều khiển tất cả CSS var màu trong `colors_and_type.css`.
