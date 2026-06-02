-- Fix authenticated privileges for Reader content import.
-- RLS owner policies already enforce row-level access.

grant select, insert, update, delete on table public.nguon_noi_dung to authenticated;
