-- Lumio — seed CATALOG-ONLY cho remote/production project.
--
-- KHÁC vớii seed.sql: KHÔNG có 5 user demo, KHÔNG có lịch sử giả.
-- Chỉ seed dữ liệu công cộng (nhân vật roleplay, bộ từ hệ thống, đề bài viết)
-- — cần thiết để app hoạt động khi user thật đăng ký.
--
-- Cách chạy:
--   psql "$DATABASE_URL" -f supabase/seed.remote.sql
-- Trong đó $DATABASE_URL là connection string của Supabase remote project
-- (Dashboard → Settings → Database → Connection string → URI).
--
-- Idempotent: dùng ON CONFLICT DO NOTHING, chạy nhiều lần an toàn.

set client_min_messages to warning;

-- ============================================================================
-- 1. NHAN_VAT — 3 nhân vật catalog
-- ============================================================================
insert into public.nhan_vat (id, slug, ten, giong, prompt_nhan_vat, cefr_toi_thieu, nhan)
values
  (
    'aaaaaaaa-0000-0000-0000-000000000001',
    'sophie-business',
    'Sophie',
    'British',
    'You are Sophie, a friendly British business consultant from London. You speak with a clear RP accent. Help the learner practice professional English: meetings, emails, negotiations. Always reply in 2-3 short sentences. Correct major errors gently after your reply.',
    'B1',
    array['business','formal','rp']
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000002',
    'marcus-casual',
    'Marcus',
    'American GA',
    'You are Marcus, a casual American friend from California. Speak with General American accent, use everyday expressions. Help the learner with daily conversation: hobbies, food, weekend plans. Keep replies short and natural. Correct only if errors block understanding.',
    'A2',
    array['casual','daily','ga']
  ),
  (
    'aaaaaaaa-0000-0000-0000-000000000003',
    'mei-travel',
    'Mei',
    'Australian',
    'You are Mei, an Australian travel guide based in Sydney. Use Aussie expressions naturally. Help learner roleplay travel scenarios: ordering food, asking directions, checking in hotels. Keep replies clear and supportive.',
    'A2',
    array['travel','aussie']
  )
on conflict (id) do update set
  ten = excluded.ten,
  giong = excluded.giong,
  prompt_nhan_vat = excluded.prompt_nhan_vat,
  cefr_toi_thieu = excluded.cefr_toi_thieu,
  nhan = excluded.nhan,
  cap_nhat_luc = now();

-- ============================================================================
-- 2. BO_TU — 6 bộ từ hệ thống
-- ============================================================================
insert into public.bo_tu (id, nguoi_dung_id, ten, mo_ta, mau_bia, la_he_thong, chu_de, cefr_phu_hop)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', null, 'Travel A2',       'Từ vựng cơ bản cho du lịch — đặt vé, sân bay, khách sạn.',   '#E8A33D', true, 'travel',   'A2'),
  ('bbbbbbbb-0000-0000-0000-000000000002', null, 'Daily Life B1',   'Từ vựng giao tiếp hằng ngày — gia đình, công việc, sở thích.', '#3B82F6', true, 'daily',    'B1'),
  ('bbbbbbbb-0000-0000-0000-000000000003', null, 'Business B2',     'Từ vựng văn phòng + email + meeting.',                        '#10B981', true, 'business', 'B2'),
  ('bbbbbbbb-0000-0000-0000-000000000004', null, 'Movies B1',       'Từ vựng phim ảnh + TV series + critique.',                    '#EF4444', true, 'movies',   'B1'),
  ('bbbbbbbb-0000-0000-0000-000000000005', null, 'Academic C1',     'Từ vựng học thuật + paper + thesis.',                         '#8B5CF6', true, 'academic', 'C1'),
  ('bbbbbbbb-0000-0000-0000-000000000006', null, 'TOEIC Workplace', 'Từ vựng TOEIC reading + listening.',                          '#06B6D4', true, 'toeic',    'B2')
on conflict (id) do update set
  ten = excluded.ten,
  mo_ta = excluded.mo_ta,
  chu_de = excluded.chu_de,
  cefr_phu_hop = excluded.cefr_phu_hop,
  cap_nhat_luc = now();

-- ============================================================================
-- 3. DE_BAI_VIET — 10 đề bài catalog
-- ============================================================================
insert into public.de_bai_viet (loai_de, cefr_phu_hop, chu_de, de_bai, gioi_han_phut, so_tu_toi_thieu, nguon, url_nguon)
values
  ('ielts_task2','B2','environment',
    'Some people think that the best way to reduce traffic in cities is to provide free public transport. To what extent do you agree or disagree?',
    40, 250, 'IELTS Liz', 'https://ieltsliz.com/'),
  ('ielts_task2','B2','education',
    'Many people believe that universities should focus on academic skills only. Others argue that universities should also prepare students for their future careers. Discuss both views and give your opinion.',
    40, 250, 'British Council', 'https://learnenglish.britishcouncil.org/'),
  ('ielts_task2','C1','technology',
    'AI is replacing many human jobs. Is this a positive or negative development?',
    40, 250, 'Cambridge IELTS 17', null),
  ('ielts_task2','B1','health',
    'Some people prefer to exercise alone. Others enjoy exercising with a group. Discuss both views.',
    40, 250, 'IELTS Simon', null),
  ('ielts_task1','B2','chart',
    'The chart below shows the number of international students studying in three English-speaking countries from 2010 to 2020. Summarise the information.',
    20, 150, 'Cambridge IELTS 16', null),
  ('ielts_task1','B2','process',
    'The diagram shows the process of producing chocolate. Describe the stages.',
    20, 150, 'IELTS Liz', null),
  ('ielts_task1','B1','map',
    'The maps show the layout of a village in 1990 and now. Describe the changes.',
    20, 150, 'British Council', null),
  ('email','A2','daily',
    'Viết email cho bạn mời họ đến ăn tối cuối tuần. Bao gồm: thời gian, địa điểm, lời chào kết.',
    20, 80, 'Lumio', null),
  ('email','B1','workplace',
    'Write an email to your manager requesting two days of leave next week. Include reason, dates, and handover plan.',
    25, 120, 'Lumio', null),
  ('tu_do','B1','any',
    'Viết về một kỷ niệm đáng nhớ trong tuổi thơ của bạn (free writing — không có yêu cầu cấu trúc).',
    30, 200, 'Lumio', null)
on conflict do nothing;

-- ============================================================================
-- Sanity check
-- ============================================================================
do $$
declare
  v_nhan_vat int;
  v_bo_tu    int;
  v_de_bai   int;
begin
  select count(*) into v_nhan_vat from public.nhan_vat;
  select count(*) into v_bo_tu    from public.bo_tu where la_he_thong;
  select count(*) into v_de_bai   from public.de_bai_viet;
  raise notice 'REMOTE SEED OK — nhan_vat: %, bo_tu hệ thống: %, de_bai_viet: %',
    v_nhan_vat, v_bo_tu, v_de_bai;
end $$;
