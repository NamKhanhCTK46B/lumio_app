-- Bật Supabase Realtime cho các bảng vocabulary UI cần theo dõi.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'bo_tu'
  ) then
    alter publication supabase_realtime add table public.bo_tu;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tu_da_luu'
  ) then
    alter publication supabase_realtime add table public.tu_da_luu;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'lich_on_tap'
  ) then
    alter publication supabase_realtime add table public.lich_on_tap;
  end if;
end $$;
