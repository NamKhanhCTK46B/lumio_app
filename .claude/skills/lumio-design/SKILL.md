---
name: lumio-design
description: Skill này dùng để tạo các giao diện và tài sản (asset) được đóng đúng thương hiệu cho Lumio — website học tiếng Anh ứng dụng AI cho người Việt (Next.js + Supabase + Vercel). Bao gồm hướng dẫn thiết kế, màu sắc, typography, font, asset, kiến trúc hệ thống, schema database, UI kit để prototype hoặc viết code production.
user-invocable: true
---

# Lumio design skill

Đọc file `README.md` trong skill này trước tiên, rồi khám phá các file khác.

- Với **artifact trực quan** (slide, mockup, prototype throwaway, trang marketing): copy asset ra ngoài và tạo file HTML tĩnh để user xem. Dùng `colors_and_type.css` trực tiếp, tham chiếu logo từ `assets/`, lấy pattern component từ `ui_kits/web/`.
- Với **code production** (Next.js + Supabase thật): copy asset và đọc kỹ:
  1. `README.md` — brand voice + visual foundations
  2. `ARCHITECTURE.md` — kiến trúc
  3. `DATABASE.md` — schema
  4. `DESIGN_PATTERNS.md` — pattern phần mềm
  5. `USE_CASES.md` — luồng tính năng
  6. `TECH_STACK.md` — phiên bản package
  7. `CONTENT_SOURCES.md` — nguồn dữ liệu
  8. `AGENT.md` — quy ước CỨNG cho coding agent

Nếu user gọi skill mà chưa nói rõ, hỏi họ muốn build gì, hỏi vài câu định hướng (màn nào / luồng nào / cần variation gì), rồi đóng vai một designer chuyên nghiệp trả ra HTML artifact *hoặc* code production tuỳ nhu cầu.

## Tra cứu nhanh

- **Tông giọng:** thân thiện, ấm áp, khuyến khích. UI tiếng Việt mặc định; gọi "bạn", không gọi "quý khách". Không emoji trong UI sản phẩm.
- **Font:** Plus Jakarta Sans (display + UI), Lora (long-form reading), JetBrains Mono (điểm số, IPA, mã CEFR).
- **Màu:** primary amber ấm (`#E8A33D`). Daylight (sáng) và Lamplight (tối-ấm) — không bao giờ đen tuyệt đối, không bao giờ tối xanh-lạnh.
- **Radii:** 16 cho card, 12 cho button, 8 cho input, 4 cho chip, 9999 cho avatar/mic.
- **Shadow:** `shadow-soft` cho card, `shadow-pop` cho popover. Hết.
- **Animation:** mềm + ngắn. `ease cubic-bezier(.2,.8,.2,1)`, 180ms mặc định. Chỉ có pulse trên mic khi recording — không có animation chạy liên tục nào khác.
- **Icon:** Lucide (stroke 1.5, outline). Không bao giờ emoji hay ký tự Unicode làm icon.
- **Highlight:** từ vượt trình độ có gạch chân amber dạng chấm + nền nhạt — không khung, không nền đặc.

## File trong skill này

| File | Mục đích |
|---|---|
| `README.md` | Brand, content fundamentals, visual foundations, iconography (tiếng Việt) |
| `ARCHITECTURE.md` | Kiến trúc Next.js + Supabase + Vercel |
| `DATABASE.md` | Schema Postgres đầy đủ với mọi bảng, cột, ràng buộc, RLS |
| `DESIGN_PATTERNS.md` | Pattern phần mềm (Repository, Strategy, Observer, …) |
| `USE_CASES.md` | 7 luồng tính năng kèm sơ đồ |
| `TECH_STACK.md` | Danh sách công cụ + phiên bản cập nhật 05/2026 |
| `CONTENT_SOURCES.md` | Nguồn từ vựng / ngữ pháp / đề bài uy tín |
| `AGENT.md` | Quy ước dành cho coding agent (Cursor, Claude Code, Windsurf) |
| `colors_and_type.css` | CSS variable drop-in — cả hai theme |
| `assets/` | Logo, scribble illustration |
| `preview/` | Các thẻ design system nhỏ (Type, Colors, Spacing, Components, Brand) |
| `ui_kits/web/` | React click-thru hi-fi của app thực tế |

## Khi cần thêm màn / artifact mới

1. Import `colors_and_type.css` (đường relative).
2. Set `<html lang="vi" data-theme="light">` (hoặc `"dark"`).
3. Tái sử dụng pattern component có sẵn trong `ui_kits/web/components.jsx` — đừng phát minh lại button, card, chip, icon. Copy và điều chỉnh.
4. Dùng voice Lumio: microcopy tiếng Việt cụ thể, số liệu thay vì hô khẩu hiệu, không emoji.
5. Nếu cần icon Lucide không có, hỏi user — đừng tự vẽ SVG.

## Khi user yêu cầu code production

1. Đọc `AGENT.md` trước.
2. Bám sát stack đã khoá trong `TECH_STACK.md` — không tự thay package.
3. Cấu trúc thư mục theo §11 của `TECH_STACK.md`.
4. Mọi mutation đi qua Server Action; mọi query trong Server Component đi qua repository.
5. Tin tưởng RLS — không tự `where user_id = ...`.
