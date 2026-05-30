-- Chỉ từ mẫu hệ thống (`nguoi_dung_id is null`) được public-read trong bộ hệ thống.
-- Từ user lưu vào bộ hệ thống vẫn chỉ owner đọc được.

drop policy if exists "tu_da_luu_read" on public.tu_da_luu;

create policy "tu_da_luu_read" on public.tu_da_luu
  for select using (
    auth.uid() = nguoi_dung_id
    or (
      nguoi_dung_id is null
      and exists (
        select 1
        from public.bo_tu
        where bo_tu.id = tu_da_luu.bo_tu_id
          and bo_tu.la_he_thong = true
      )
    )
  );
