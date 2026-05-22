# Lumio — Nền tảng học tiếng Anh ứng dụng AI

> *Học tiếng Anh theo cách của bạn — với một trợ giảng AI luôn lắng nghe.*

Lumio là website học tiếng Anh ứng dụng trí tuệ nhân tạo, dành cho người Việt Nam: học sinh, sinh viên, người đi làm, thí sinh IELTS/TOEIC và người tự học. Khác với các nền tảng có lộ trình cố định, Lumio cho phép người học tự đưa nội dung mình quan tâm vào (video YouTube, podcast, bài báo) và AI sẽ cá nhân hoá từ vựng, luyện nói, chấm bài viết theo trình độ CEFR cùng mục tiêu của từng người.

Đây là sản phẩm của đồ án `2212391_phan-tich-he-thong.docx` — môn *Các công nghệ mới trong phát triển web*.

---

## Trong design system này có gì

Repo này vừa là **tài liệu thiết kế hệ thống**, vừa là **bộ brand kit** đang hoạt động:

| File / thư mục | Mục đích |
|---|---|
| `README.md` | File này — bối cảnh thương hiệu, kiến trúc, nội dung & nền tảng hình ảnh, iconography |
| `ARCHITECTURE.md` | Kiến trúc hệ thống chi tiết: Next.js + Supabase + Vercel, luồng dữ liệu, tích hợp |
| `DATABASE.md` | Schema PostgreSQL đầy đủ — mọi bảng, trường, kiểu, ràng buộc, RLS, kèm giải thích |
| `DESIGN_PATTERNS.md` | Các mẫu thiết kế phần mềm được áp dụng (Repository, Strategy, Observer, Factory, Adapter, …) |
| `USE_CASES.md` | Sơ đồ actor → use case và 7 luồng tính năng chính |
| `TECH_STACK.md` | Danh sách công cụ, thư viện kèm phiên bản hiện hành (đã kiểm tra 05/2026) |
| `CONTENT_SOURCES.md` | Nguồn dữ liệu từ vựng, ngữ pháp, đề bài viết — tất cả là nguồn uy tín, có URL |
| `AGENT.md` | Hướng dẫn dành cho coding agent (Cursor / Claude Code / Windsurf) khi triển khai code thật |
| `SKILL.md` | Bản mô tả skill — tương thích với Claude Code |
| `colors_and_type.css` | Token màu (sáng + tối) và token typography — đem thẳng vào Next.js app |
| `fonts/` | Hướng dẫn font (Plus Jakarta Sans, Lora, JetBrains Mono) |
| `assets/` | Logo, hình minh hoạ |
| `preview/` | Các thẻ HTML nhỏ hiển thị trong tab Design System |
| `ui_kits/web/` | UI kit hi-fi cho web app (click-thru, có thể tương tác) |

---

## Tài liệu nguồn

- **Đề bài:** `uploads/2212391_phan-tich-he-thong.docx` — bản phân tích hệ thống bằng tiếng Việt
- **Trích xuất:** `uploads/document.txt` — bản plain-text để tra cứu nhanh

Thương hiệu **Lumio** (tên, logo, bảng màu, type pairing) là phần do bộ design system này bổ sung — đề bài gốc chỉ mô tả tính năng, không kèm thiết kế thương hiệu.

---

## Đối tượng người dùng

| Persona | Cần gì ở Lumio |
|---|---|
| Học sinh / sinh viên | Cải thiện điểm số, chuẩn bị tiếng Anh đại học, học từ các YouTuber yêu thích |
| Người đi làm | Tự tin trong tiếng Anh công sở — email, họp, thuyết trình |
| Thí sinh IELTS / TOEIC | Phản hồi viết theo rubric band, luyện nói tự tin |
| Người tự học | Học từ nội dung thật (podcast, bài báo, phim) theo nhịp của mình |

---

## Stack công nghệ (tóm tắt — chi tiết ở `TECH_STACK.md`)

| Lớp | Công nghệ | Phiên bản tham chiếu (05/2026) |
|---|---|---|
| Framework | **Next.js** (App Router, Server Components, Server Actions) | 16.2 (LTS hoạt động) |
| Ngôn ngữ | **TypeScript** | 5.7+ |
| UI Framework | **Tailwind CSS** + **shadcn/ui** | Tailwind 4.3, shadcn/ui (latest) |
| Runtime React | **React** | 19.2 (đi kèm Next 16) |
| BaaS | **Supabase** — PostgreSQL 15, Auth, Storage, Realtime, Edge Functions | latest |
| Bảo mật | **Row Level Security (RLS)** trên mọi bảng do user sở hữu | — |
| Vector search | **pgvector** | 0.8+ |
| LLM (chính) | **Google Gemini API** — `gemini-3.1-pro-preview`, `gemini-3-flash`, `gemini-3.1-flash-lite` | latest preview |
| LLM (dự phòng) | **OpenRouter** — DeepSeek V3, Llama 3.3 (free tier) | latest |
| Embedding | **gemini-embedding-2-preview** (1536-d, đa modal) | preview |
| Speech | **Web Speech API** (STT + TTS, miễn phí, trong trình duyệt) | — |
| Triển khai | **Vercel** — Edge Functions, ISR, preview deploys | latest |
| Mã nguồn | Git, GitHub | — |

> **Lưu ý phiên bản.** Tất cả phiên bản nêu trên đã được kiểm tra ngày 13/05/2026 từ trang chính thức (xem `TECH_STACK.md` để có liên kết). Tránh sử dụng Gemini 1.0/1.5/2.0 (đã shutdown hoặc sắp shutdown); tránh Tailwind v3 cho dự án mới.

---

## Bề mặt sản phẩm

Chỉ một sản phẩm duy nhất: **web app Lumio** (responsive, hỗ trợ cả desktop và mobile browser). Không có ứng dụng mobile native trong phạm vi. Web app có 7 nhóm tính năng:

1. **Xác thực** — đăng ký / đăng nhập / quên mật khẩu / hồ sơ
2. **Đánh giá trình độ** — bài kiểm tra placement test (CEFR A1–C2) + khảo sát mục tiêu
3. **Luyện nói với AI** — chọn nhân vật, mic input, phản hồi inline
4. **Học từ vựng từ nội dung** — dán link YouTube / bài báo / podcast, bấm vào từ → popup, lưu vào sổ từ
5. **Quản lý từ vựng** — sổ từ cá nhân, spaced repetition (SM-2), ôn hằng ngày, biểu đồ tiến độ
6. **Luyện viết** — đề essay / email, chấm theo 4 tiêu chí IELTS, highlight lỗi inline
7. **Thông báo** — nhắc ôn từ, tiến độ học, cập nhật hệ thống

Xem `USE_CASES.md` để biết luồng đầy đủ của từng nhóm.

---

## Nền tảng nội dung (Content fundamentals)

**Tông giọng.** Thân thiện, ấm áp, khích lệ — như một gia sư kiên nhẫn thực sự mong người học thành công. Không kẻ cả, không trẻ con kiểu "gamified". Lumio tôn trọng người học như một người trưởng thành có mục tiêu.

**Ngôn ngữ giao diện.** UI hỗ trợ **song ngữ**: tiếng Việt (mặc định) và tiếng Anh (toggle). Trong app, **hướng dẫn** thường là tiếng Việt; **nội dung học** là tiếng Anh.

**Đại từ & cách xưng hô.**
- Tiếng Việt: gọi người dùng là **"bạn"** (thân mật, ngang hàng). Tuyệt đối không dùng *quý khách* — quá xa cách với một app học tập. Lumio tự xưng là **"Lumio"** hoặc **"chúng tôi"**.
- Tiếng Anh: dùng **"you"**. Tiếng nói của sản phẩm là "we" (hạn chế) — phần lớn copy ở dạng mệnh lệnh trực tiếp ("Save to your deck", không phải "We'll save this for you").

**Casing.** Sentence case cho mọi thứ — nút, tiêu đề, menu. Không Title Case In Headings. Không VIẾT HOA TẤT CẢ trừ những nhãn tiện ích siêu nhỏ (ví dụ `CEFR B1`, `TASK 1`) — viết hoa ở đó để báo hiệu "đây là mã danh mục".

**Emoji.** **Không dùng emoji trong UI sản phẩm.** Tất cả icon đi qua Lucide (xem mục Iconography). Emoji nhìn trẻ con bên cạnh phản hồi nghiêm túc mà Lumio đưa ra cho bài viết. Ngoại lệ: trang marketing có thể dùng một emoji-mascot nếu thực sự ấm hơn — nhưng không bao giờ làm icon trang trí cho bullet list.

**Số liệu & phản hồi.** Cụ thể và chi tiết, không hô khẩu hiệu.
- ✅ "Bạn đã ôn 12 từ hôm nay — còn 4 từ cần ôn." / "You reviewed 12 words today — 4 left."
- ❌ "Tuyệt vời! 🎉 Tiếp tục cố lên!"
- ✅ "Band 6.5 · Coherence cao hơn lần trước 0.5 điểm."
- ❌ "Bài viết xuất sắc!"

**Phản hồi lỗi.** Inline, cụ thể và **mang tính dạy học** — không bao giờ chỉ nói "sai". Mỗi chú thích lỗi có ba phần:
1. Lỗi (highlight trong text)
2. **Tại sao sai** (giải thích một dòng)
3. **Gợi ý** (cách viết lại hoặc ví dụ)

**Mẫu microcopy**

| Bề mặt | Tiếng Việt | English |
|---|---|---|
| Nút lưu từ | `Lưu vào sổ từ` | `Save to deck` |
| Sổ từ rỗng | `Sổ từ của bạn còn trống. Dán link YouTube để bắt đầu.` | `Your deck is empty. Paste a YouTube link to start.` |
| Mở mic | `Sẵn sàng nói? Nhấn giữ để ghi âm.` | `Ready? Hold to record.` |
| Điểm rubric | `Coherence & Cohesion · 6.5` | `Coherence & Cohesion · 6.5` |
| Nhắc ôn | `Hôm nay có 8 từ cần ôn — chỉ tốn 3 phút.` | `8 words to review today — 3 minutes.` |

---

## Nền tảng hình ảnh (Visual foundations)

**Mood.** Ấm áp, tập trung, giấy. Lumio nhìn như một góc học bài có ánh sáng tốt — không phải dashboard SaaS neon, không phải app gamified đầy confetti. Thương hiệu nằm ở giao điểm của *Notion's editorial calm*, *Duolingo's friendliness*, *Linear's precision* — nhưng không phải bất kỳ cái nào ở trên.

**Bảng màu.** Hai chế độ, cả hai đều ấm.
- **Sáng** (*Daylight*): nền giấy gần-trắng (`#FBF9F5`), chữ xanh-mực sâu (`#0E1A2B`), và **primary amber-ochre** (`#E8A33D`) — màu của ánh nắng học bài chiều muộn. Phụ trợ: teal (đúng/tích cực), coral (lỗi/cảnh báo).
- **Tối** (*Lamplight*): nền mực sâu (`#0E1626`), chữ kem ấm (`#F5EFE3`), cùng amber primary hơi sáng hơn, cùng teal và coral. Chế độ tối là *tối-ấm* — không bao giờ đen tuyệt đối, không bao giờ xanh-lạnh.
- **Highlight từ vựng.** Các từ vượt CEFR của user được gạch chân amber dạng chấm + nền nhạt — không khung, không nền đặc. Trông như nét bút chì của gia sư.

**Typography.** Hệ ba font:
- **Plus Jakarta Sans** (display + UI) — geometric-humanist hiện đại, hỗ trợ dấu tiếng Việt rất đẹp.
- **Lora** (nội dung đọc dài tiếng Anh, câu ví dụ) — serif báo hiệu "đây là nội dung cần đọc kỹ". Dùng cho câu ví dụ trong popup từ vựng và đề bài viết.
- **JetBrains Mono** (dạng code, mã CEFR, điểm số) — cho mọi hiển thị dữ liệu (band, ngày, ID).

**Spacing.** Lưới 4-pt (`4, 8, 12, 16, 20, 24, 32, 40, 56, 72, 96`). Không gian trắng rộng rãi quanh block nội dung. Thẻ có padding tối thiểu `24px`; khoảng cách giữa các section `56–72px`.

**Nền (background).** Chủ yếu là phẳng — giấy-kem / mực-sâu. Không full-bleed photography. Không gradient mesh. Một motif duy nhất: nét gạch chân vẽ tay để nhấn mạnh từ — xem `assets/scribble-underline.svg`. Trang marketing có thể có một radial-glow amber nhạt sau hero (`radial-gradient(ellipse at 30% 0%, rgba(232,163,61,.18), transparent 60%)`).

**Animation.** Mềm và ngắn. Easing mặc định `cubic-bezier(.2, .8, .2, 1)` ("ease-out-quint"), duration mặc định `180ms` cho state change, `280ms` cho layout transition. Không spring nảy, không parallax. Nút mic recording có *một* pulse nhẹ (`scale(1) → scale(1.04)`) lặp 1.2s khi đang nghe — đó là motion duy nhất chạy liên tục trong app.

**Hover states.** Nền sáng lên ~6% (chế độ sáng) / tối đi ~6% (chế độ tối). Nút thêm inset highlight 1px khi hover. Không transform-scale khi hover.

**Press states.** Nút co lại `scale(.98)` trong `90ms` rồi nhả. Card không co (chỉ CTA bên trong nó co).

**Border.** Đường mảnh (`1px`). Sáng: `#E5DDD0` (taupe ấm). Tối: `#1F2B3D`. Border được dùng tiết kiệm — phần lớn sự phân tách dùng whitespace, không phải đường kẻ.

**Shadow.** Chỉ hai cấp.
- `shadow-soft`: `0 1px 2px rgba(14,26,43,.04), 0 2px 8px rgba(14,26,43,.06)` — card thường.
- `shadow-pop`: `0 4px 16px rgba(14,26,43,.08), 0 12px 32px rgba(14,26,43,.10)` — popover, modal, popup từ vựng.
- Chế độ tối dùng `rgba(0,0,0,.4)` và `.5`.

**Card.** `border-radius: 16px`. `1px` hairline border + `shadow-soft`. Padding trong `24px`. Không dùng coloured left-border (cố tình tránh trope SaaS).

**Bán kính bo góc.**
- `4px` cho chip/tag nhỏ (`CEFR B1`).
- `8px` cho input, button nhỏ.
- `12px` cho button thường.
- `16px` cho card.
- `24px` cho bề mặt lớn (modal, sheet drawer).
- `9999px` cho nút mic ghi âm và avatar.

**Trong suốt & blur.** Chỉ dùng ở đúng hai chỗ:
1. **Popup từ vựng** trong reader — `backdrop-filter: blur(20px)` trên nền `90%` opacity. Phía sau popup nhoè đi, báo hiệu "đã pause đọc".
2. **Toast notification** ở đáy màn hình — cùng kiểu blur.
Ngoài hai chỗ trên, mọi bề mặt đều opaque.

**Quy tắc layout.**
- Max width nội dung: `1200px` cho trang marketing, `1080px` cho trang app, `680px` cho long-form reading (đề bài, editor essay).
- App shell: sidebar trái (`240px`, có thể thu thành `64px`) + topbar (`56px`).
- Mọi nội dung app nằm trong cột giữa với gutter `32px` (desktop) / `16px` (mobile).
- UI ghi âm **luôn ở đáy giữa**, không bao giờ ở cạnh. Đây là affordance quan trọng nhất.

**Tông màu ảnh.** Khi dùng ảnh thật (marketing, blog), tông ấm — hơi ám amber, contrast thấp, hạt mịn. Không bao giờ xanh-lạnh kiểu corporate, không bao giờ ảnh "đa dạng bàn tay trên laptop". Ưu tiên ảnh đồ vật học tập thực tế: sổ tay, post-it, cà phê, đèn thư viện.

---

## Iconography

Lumio dùng **[Lucide](https://lucide.dev)** — bộ icon outline 1.5-stroke, đi rất hợp với Plus Jakarta Sans. Lucide được dùng qua CDN trong UI kit (`https://unpkg.com/lucide@latest`) và `lucide-react` trong Next.js app thực.

**Tại sao Lucide.** Open-source, đầy đủ (1400+ icon), lưới 24×24 nhất quán + stroke 1.5px, có cá tính phù hợp với tông "thân thiện-chính xác" của Lumio. Heroicons (mặc định của Tailwind) outline hơi mỏng, ít cá tính hơn.

**Stroke weight.** Luôn `1.5px`. Không dùng filled variant trừ:
- **Mic đang ghi**: mic filled đỏ.
- **Bookmark đã lưu**: bookmark filled amber.
Filled = "đang bật".

**Kích thước.** `16px` inline với body. `20px` trong button. `24px` trong nav. `32px` trong feature illustration.

**Màu.** Icon thừa kế `currentColor`. Màu trạng thái dành cho icon trạng thái thật (`check-circle` teal, `alert-circle` coral).

**Emoji.** Không dùng trong UI sản phẩm. Avatar nhân vật roleplay là minh hoạ tròn, không phải emoji.

**Ký tự Unicode như icon.** Không bao giờ. Không dùng `▶`, `★`, `✓` đơn lẻ — luôn dùng Lucide tương đương (`play`, `star`, `check`).

**Brand mark.** Wordmark + "Lumio dot" (vòng tròn amber làm dấu chấm trên chữ `i`). Xem `assets/lumio-mark.svg` và `assets/lumio-wordmark.svg`.

---

## Lưu ý về font ⚠️

`fonts/` không chứa file `.ttf`/`.woff2`; `colors_and_type.css` load **Plus Jakarta Sans**, **Lora**, **JetBrains Mono** từ Google Fonts. Cả ba đều mã nguồn mở, dùng tự do. Nếu cần self-host cho production, tải từ:
- https://fonts.google.com/specimen/Plus+Jakarta+Sans
- https://fonts.google.com/specimen/Lora
- https://fonts.google.com/specimen/JetBrains+Mono

Sau đó đặt vào `fonts/` và thay `@import` trong `colors_and_type.css` bằng các quy tắc `@font-face`.

---

## Index — tìm đâu cho cái gì

- **Build một màn hình Lumio?** → `ui_kits/web/index.html` (preview chạy được) + `colors_and_type.css`
- **Setup database?** → `DATABASE.md`
- **Hiểu kiến trúc tổng thể?** → `ARCHITECTURE.md`, `USE_CASES.md`
- **Cài đặt phiên bản công nghệ?** → `TECH_STACK.md`
- **Lấy nguồn từ vựng / đề bài?** → `CONTENT_SOURCES.md`
- **Để Cursor / Claude Code chạy code thật?** → `AGENT.md`
- **Viết copy?** → mục "Nền tảng nội dung" ở trên
- **Chọn token màu/spacing/type?** → `colors_and_type.css` + thẻ preview trong tab Design System
- **Dùng như agent skill?** → `SKILL.md`
