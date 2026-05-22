-- Migration 13: Helper bcrypt password hashing — chuẩn OWASP 2024.
--
-- Function này cho phép admin script + seed file hash mật khẩu nhất quán.
-- App code KHÔNG dùng function này — Supabase Auth (GoTrue) tự xử lý hashing
-- khi gọi supabase.auth.signUp() / signInWithPassword(). Helper này chỉ
-- cần thiết khi insert vào auth.users trực tiếp (vd. seed user dev).

-- pgcrypto cần cho crypt() + gen_salt(). seed.sql có create extension này,
-- nhưng đặt ở migration để mọi môi trường mới đều có sẵn.
create extension if not exists pgcrypto;

/*
 * Hash plaintext password bằng bcrypt cost 10.
 *
 * Vì sao bcrypt cost 10:
 *   - OWASP Password Storage Cheat Sheet 2024 khuyến nghị bcrypt
 *     work factor 10-12 cho server hiện đại.
 *   - Supabase Auth (GoTrue) mặc định dùng bcrypt cost 10 - khớp với
 *     hash từ helper này, nên user login bằng Auth API hoạt động bình thường.
 *   - Cost 10 ≈ 100 ms / hash trên CPU hiện đại - đủ chậm để chống
 *     brute force, đủ nhanh cho login UX.
 *
 * KHÔNG dùng MD5/SHA1/SHA256 cho password — không có salt, không có
 * work factor → vỡ trong vài giờ với GPU hiện đại.
 *
 * Function VOLATILE vì gen_salt() trả salt random — gọi 2 lần cùng
 * plaintext cho ra 2 hash khác nhau (đúng, để chống rainbow table).
 */
create or replace function public.bam_mat_khau(plaintext text)
returns text
language sql
volatile
strict
security invoker
as $$
  select crypt(plaintext, gen_salt('bf', 10));
$$;

comment on function public.bam_mat_khau(text) is
  'Bcrypt cost 10 hash. Theo OWASP Password Storage Cheat Sheet 2024.';

/*
 * Verify plaintext khớp với hash đã lưu. Dùng cho admin script
 * (vd. kiểm tra password validity trước khi rotate).
 */
create or replace function public.kiem_tra_mat_khau(plaintext text, hash text)
returns boolean
language sql
immutable
strict
security invoker
as $$
  select crypt(plaintext, hash) = hash;
$$;

comment on function public.kiem_tra_mat_khau(text, text) is
  'So sánh plaintext với bcrypt hash. Constant-time qua crypt().';
