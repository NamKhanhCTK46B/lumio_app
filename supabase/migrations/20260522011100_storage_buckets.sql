-- Migration 12: Storage buckets + policies
-- 2 bucket: avatars (public read, owner write) + audio (private, owner full).

-- 1. avatars — ảnh đại diện hồ sơ -----------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,                                     -- public read
  5 * 1024 * 1024,                          -- 5 MB
  array['image/png','image/jpeg','image/webp']
)
on conflict (id) do nothing;

-- Owner upload: chỉ vào folder mang tên user_id của họ (vd. avatars/<uid>/avatar.png).
create policy "avatars_owner_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Owner select: Cần thiết khi thực hiện upload/upsert qua Storage SDK để kiểm tra sự tồn tại của file.
create policy "avatars_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 2. audio — file ghi âm phát âm + roleplay -------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio',
  'audio',
  false,                                     -- private
  25 * 1024 * 1024,                          -- 25 MB
  array['audio/webm','audio/mp4','audio/mpeg','audio/wav','audio/ogg']
)
on conflict (id) do nothing;

create policy "audio_owner_select"
  on storage.objects for select
  using (
    bucket_id = 'audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "audio_owner_upload"
  on storage.objects for insert
  with check (
    bucket_id = 'audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "audio_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "audio_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'audio'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Convention path: <user_id>/<feature>/<filename>
-- Vd: avatars/<uid>/avatar.png, audio/<uid>/speaking/<turn-id>.webm
-- (Không thể `comment on column storage.objects.name` vì bảng do Supabase quản lý.)
