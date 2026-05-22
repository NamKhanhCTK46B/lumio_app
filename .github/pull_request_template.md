## Mục đích

<!-- 1–3 câu: thay đổi này giải quyết vấn đề gì, thuộc UC nào trong USE_CASES.md. -->

## Thay đổi

<!-- Bullet list các thay đổi chính theo nhóm (DB / UI / API / docs). -->

- [ ]
- [ ]

## Cách test

<!-- Bước-by-bước để reviewer reproduce trên máy local hoặc preview deploy. -->

1.
2.

## Migration / breaking change

- [ ] Có migration mới — đã chạy `pnpm supabase:reset` local trước khi commit
- [ ] RLS bật trên 100% bảng user-owned + 4 policy
- [ ] Cập nhật `docs/DATABASE.md` (mục bảng + §20 ER) nếu thêm bảng
- [ ] Không có breaking change cho schema cũ (nếu rename cột → migration backfill)

## Checklist trước review

- [ ] `pnpm typecheck` xanh
- [ ] `pnpm lint` xanh
- [ ] `pnpm build` xanh
- [ ] Nếu UI: kèm ảnh chụp screen
- [ ] Commit theo Conventional Commits tiếng Việt (`feat(scope): ...`)

## Refs

UC<n> · Issue #<n>
