-- Fix vocab deck words:
-- - Cho phép bộ từ hệ thống có từ mẫu không thuộc user cụ thể.
-- - Giữ RLS chặt cho mutation của từ cá nhân.
-- - Seed từ mẫu để trang chi tiết bộ hệ thống không rỗng.

alter table public.tu_da_luu
  alter column nguoi_dung_id drop not null;

drop index if exists public.idx_tu_da_luu_unique;

create unique index if not exists idx_tu_da_luu_user_unique
  on public.tu_da_luu (nguoi_dung_id, tu_goc)
  where nguoi_dung_id is not null;

create unique index if not exists idx_tu_da_luu_system_deck_unique
  on public.tu_da_luu (bo_tu_id, tu_goc)
  where nguoi_dung_id is null;

drop policy if exists "tu_da_luu_owner_select" on public.tu_da_luu;
drop policy if exists "tu_da_luu_owner_insert" on public.tu_da_luu;
drop policy if exists "tu_da_luu_owner_update" on public.tu_da_luu;
drop policy if exists "tu_da_luu_owner_delete" on public.tu_da_luu;

create policy "tu_da_luu_read" on public.tu_da_luu
  for select using (
    auth.uid() = nguoi_dung_id
    or exists (
      select 1
      from public.bo_tu
      where bo_tu.id = tu_da_luu.bo_tu_id
        and bo_tu.la_he_thong = true
    )
  );

create policy "tu_da_luu_owner_insert" on public.tu_da_luu
  for insert with check (
    auth.uid() = nguoi_dung_id
    and (
      bo_tu_id is null
      or exists (
        select 1
        from public.bo_tu
        where bo_tu.id = tu_da_luu.bo_tu_id
          and (bo_tu.nguoi_dung_id = auth.uid() or bo_tu.la_he_thong = true)
      )
    )
  );

create policy "tu_da_luu_owner_update" on public.tu_da_luu
  for update using (auth.uid() = nguoi_dung_id)
  with check (
    auth.uid() = nguoi_dung_id
    and (
      bo_tu_id is null
      or exists (
        select 1
        from public.bo_tu
        where bo_tu.id = tu_da_luu.bo_tu_id
          and (bo_tu.nguoi_dung_id = auth.uid() or bo_tu.la_he_thong = true)
      )
    )
  );

create policy "tu_da_luu_owner_delete" on public.tu_da_luu
  for delete using (auth.uid() = nguoi_dung_id);

insert into public.tu_da_luu (
  id, nguoi_dung_id, bo_tu_id, tu_goc, loai_tu, phien_am,
  nghia_en, nghia_vi, vi_du, cefr_phu_hop, trang_thai
)
values
  ('cccccccc-0000-0000-0000-000000000001', null, 'bbbbbbbb-0000-0000-0000-000000000001', 'itinerary', 'noun', '/aɪˈtɪnəˌrɛri/', 'travel plan or schedule', 'lịch trình', '[{"en":"Our itinerary includes three days in Da Nang.","vi":"Lịch trình của chúng tôi gồm ba ngày ở Đà Nẵng."}]'::jsonb, 'B1', 'moi'),
  ('cccccccc-0000-0000-0000-000000000002', null, 'bbbbbbbb-0000-0000-0000-000000000001', 'boarding pass', 'noun', null, 'a document that lets you get on a plane', 'thẻ lên máy bay', '[{"en":"Please show your boarding pass at the gate.","vi":"Vui lòng xuất trình thẻ lên máy bay tại cổng."}]'::jsonb, 'A2', 'moi'),
  ('cccccccc-0000-0000-0000-000000000003', null, 'bbbbbbbb-0000-0000-0000-000000000002', 'routine', 'noun', '/ruːˈtiːn/', 'the usual way of doing things', 'thói quen hằng ngày', '[{"en":"Reading for ten minutes is part of my routine.","vi":"Đọc mười phút là một phần thói quen hằng ngày của tôi."}]'::jsonb, 'B1', 'moi'),
  ('cccccccc-0000-0000-0000-000000000004', null, 'bbbbbbbb-0000-0000-0000-000000000002', 'errand', 'noun', '/ˈerənd/', 'a short trip to do a necessary task', 'việc vặt cần đi làm', '[{"en":"I need to run an errand after work.","vi":"Tôi cần đi làm một việc vặt sau giờ làm."}]'::jsonb, 'B1', 'moi'),
  ('cccccccc-0000-0000-0000-000000000005', null, 'bbbbbbbb-0000-0000-0000-000000000003', 'agenda', 'noun', '/əˈdʒendə/', 'a list of things to discuss in a meeting', 'chương trình họp', '[{"en":"The first item on the agenda is the budget.","vi":"Mục đầu tiên trong chương trình họp là ngân sách."}]'::jsonb, 'B2', 'moi'),
  ('cccccccc-0000-0000-0000-000000000006', null, 'bbbbbbbb-0000-0000-0000-000000000003', 'deadline', 'noun', '/ˈdedlaɪn/', 'the latest time or date to finish something', 'hạn chót', '[{"en":"The deadline for the report is Friday.","vi":"Hạn chót cho báo cáo là thứ Sáu."}]'::jsonb, 'B1', 'moi'),
  ('cccccccc-0000-0000-0000-000000000007', null, 'bbbbbbbb-0000-0000-0000-000000000004', 'plot', 'noun', '/plɒt/', 'the main events of a story', 'cốt truyện', '[{"en":"The plot becomes more interesting in the second half.","vi":"Cốt truyện trở nên thú vị hơn ở nửa sau."}]'::jsonb, 'B1', 'moi'),
  ('cccccccc-0000-0000-0000-000000000008', null, 'bbbbbbbb-0000-0000-0000-000000000004', 'scene', 'noun', '/siːn/', 'a part of a film or play', 'cảnh phim', '[{"en":"My favorite scene happens near the ending.","vi":"Cảnh phim tôi thích nhất xảy ra gần đoạn kết."}]'::jsonb, 'A2', 'moi'),
  ('cccccccc-0000-0000-0000-000000000009', null, 'bbbbbbbb-0000-0000-0000-000000000005', 'hypothesis', 'noun', '/haɪˈpɒθəsɪs/', 'an idea tested by research', 'giả thuyết', '[{"en":"The study supports the original hypothesis.","vi":"Nghiên cứu ủng hộ giả thuyết ban đầu."}]'::jsonb, 'C1', 'moi'),
  ('cccccccc-0000-0000-0000-000000000010', null, 'bbbbbbbb-0000-0000-0000-000000000005', 'evidence', 'noun', '/ˈevɪdəns/', 'facts that show something is true', 'bằng chứng', '[{"en":"The paper presents strong evidence for this claim.","vi":"Bài nghiên cứu đưa ra bằng chứng mạnh cho nhận định này."}]'::jsonb, 'B2', 'moi'),
  ('cccccccc-0000-0000-0000-000000000011', null, 'bbbbbbbb-0000-0000-0000-000000000006', 'invoice', 'noun', '/ˈɪnvɔɪs/', 'a document asking for payment', 'hóa đơn thanh toán', '[{"en":"The supplier sent an invoice yesterday.","vi":"Nhà cung cấp đã gửi hóa đơn thanh toán hôm qua."}]'::jsonb, 'B2', 'moi'),
  ('cccccccc-0000-0000-0000-000000000012', null, 'bbbbbbbb-0000-0000-0000-000000000006', 'shipment', 'noun', '/ˈʃɪpmənt/', 'goods sent from one place to another', 'lô hàng', '[{"en":"The shipment arrived two days late.","vi":"Lô hàng đến muộn hai ngày."}]'::jsonb, 'B2', 'moi')
on conflict (id) do update set
  tu_goc = excluded.tu_goc,
  loai_tu = excluded.loai_tu,
  phien_am = excluded.phien_am,
  nghia_en = excluded.nghia_en,
  nghia_vi = excluded.nghia_vi,
  vi_du = excluded.vi_du,
  cefr_phu_hop = excluded.cefr_phu_hop,
  cap_nhat_luc = now();

update public.bo_tu
set so_tu = counted.so_tu
from (
  select bo_tu_id, count(*)::int as so_tu
  from public.tu_da_luu
  where bo_tu_id is not null
  group by bo_tu_id
) counted
where bo_tu.id = counted.bo_tu_id;
