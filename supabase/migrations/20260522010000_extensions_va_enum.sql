-- Migration 01: Extensions + enum types + naming convention setup
-- Lumio schema v2 (tiếng Việt). Tham chiếu docs/DATABASE.md §0.

create extension if not exists "uuid-ossp";
create extension if not exists vector;        -- pgvector cho embedding 1536-d
create extension if not exists pg_cron;       -- scheduled jobs nội DB
create extension if not exists pg_trgm;       -- fuzzy text search từ vựng
create extension if not exists pg_jsonschema; -- validate jsonb theo schema

-- Lưu ý: pg_partman KHÔNG có sẵn trong Supabase local Postgres image
-- (chỉ có ở cloud-managed). Đã chuyển luot_noi + phien_hoc sang dạng
-- bảng thường để chạy được ở cả 2 môi trường. Khi scale > 1M rows,
-- migrate sang Postgres native partition bằng migration mới + bảo trì
-- partition bằng plpgsql function thay vì pg_partman.

-- Enum dùng xuyên suốt schema. Đặt tên tiếng Việt, value snake_case không dấu.
create type trinh_do_cefr  as enum ('A1','A2','B1','B2','C1','C2');

create type loai_muc_tieu  as enum (
  'ielts','toeic','giao_tiep','cong_viec','du_lich','phim_anh','hoc_thuat','khac'
);

create type loai_nguon     as enum ('youtube','bai_bao','podcast','thu_cong');

create type trang_thai_tu  as enum ('moi','dang_hoc','on_tap','thuoc');

create type loai_de_viet   as enum ('ielts_task1','ielts_task2','email','tu_do');

create type loai_thong_bao as enum ('nhac_on','tien_do','he_thong','thanh_tich');

create type loai_hoat_dong as enum ('noi','on_tu','doc','viet','quiz');

create type vai_nguoi_noi  as enum ('nguoi_dung','ai');
