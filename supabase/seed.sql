-- Lumio — seed data v2 (tiếng Việt)
-- Chạy sau khi 12 migration apply xong qua `supabase db reset`.
-- Bao gồm: 5 user demo + catalog (nhân vật, bộ từ hệ thống, đề bài) + lịch sử giả 7 ngày.
--
-- Password chung cho mọi user demo: Demo2026!
-- Đăng nhập tại /login bằng email + password trên.

set client_min_messages to warning;

-- ============================================================================
-- 1. AUTH USERS — 5 user demo trải nhiều profile
-- ============================================================================
-- Insert trực tiếp vào auth.users + auth.identities. Trigger on_auth_user_created
-- sẽ tự insert vào public.ho_so qua function tao_ho_so_khi_dang_ky.
--
-- Dùng UUID cố định để các bảng con refer được. Hash password bằng pgcrypto.

create extension if not exists pgcrypto;

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  (
    '11111111-1111-1111-1111-111111111111'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'an.demo@lumio.vn',
    crypt('Demo2026!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Nguyễn Minh An', 'provider', 'email'),
    now() - interval '30 days', now() - interval '30 days',
    '', '', '', ''
  ),
  (
    '22222222-2222-2222-2222-222222222222'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'chau.demo@lumio.vn',
    crypt('Demo2026!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Trần Bảo Châu', 'provider', 'email'),
    now() - interval '20 days', now() - interval '20 days',
    '', '', '', ''
  ),
  (
    '33333333-3333-3333-3333-333333333333'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'phuc.demo@lumio.vn',
    crypt('Demo2026!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Lê Hoàng Phúc', 'provider', 'email'),
    now() - interval '45 days', now() - interval '45 days',
    '', '', '', ''
  ),
  (
    '44444444-4444-4444-4444-444444444444'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'linh.demo@lumio.vn',
    crypt('Demo2026!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Phạm Diệu Linh', 'provider', 'email'),
    now() - interval '7 days', now() - interval '7 days',
    '', '', '', ''
  ),
  (
    '55555555-5555-5555-5555-555555555555'::uuid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated',
    'huy.demo@lumio.vn',
    crypt('Demo2026!', gen_salt('bf')),
    now(),
    jsonb_build_object('full_name', 'Đỗ Quang Huy', 'provider', 'email'),
    now() - interval '90 days', now() - interval '90 days',
    '', '', '', ''
  );

-- Identity records cho từng user. Supabase Auth 2024+ yêu cầu identity_data
-- chứa "email" + "email_verified". provider_id format: dùng chính user.id cho
-- email provider (Supabase convention).
insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  u.created_at,
  u.created_at
from auth.users u
where u.email like '%@lumio.vn'
on conflict (provider_id, provider) do nothing;

-- ============================================================================
-- 1.b OWNER USER — Nam Khánh (admin / personal account)
-- ============================================================================
-- Password gốc: '#NgNamkhanh!1109' (KHÔNG commit plaintext vào git).
-- Hash bcrypt cost 10 dưới được tạo trước qua:
--   docker exec supabase_db_lumio psql -U postgres -d postgres -At \
--     -c "select crypt('#NgNamkhanh!1109', gen_salt('bf', 10))"
-- Để rotate: chạy lại lệnh trên với password mới, dán hash mới vào.

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values (
  '99999999-9999-9999-9999-999999999999'::uuid,
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated',
  'khanh51024@gmail.com',
  '$2a$10$bJl5OTLatkkdC0qbgOhtReol6g3MQgx.Q4Wuq/1EpROBJUczaLJUO',
  now(),
  jsonb_build_object('full_name', 'Nam Khánh', 'provider', 'email'),
  now() - interval '1 day', now() - interval '1 day',
  '', '', '', ''
)
on conflict (id) do update set
  encrypted_password = excluded.encrypted_password,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
values (
  '99999999-9999-9999-9999-999999999999',
  '99999999-9999-9999-9999-999999999999'::uuid,
  jsonb_build_object(
    'sub', '99999999-9999-9999-9999-999999999999',
    'email', 'khanh51024@gmail.com',
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now() - interval '1 day',
  now() - interval '1 day'
)
on conflict (provider_id, provider) do nothing;

-- Cập nhật ho_so (trigger đã insert hàng cơ bản — bổ sung trinh_do, mục tiêu UX).
update public.ho_so set
  trinh_do_cefr = 'A2', do_tin_cefr = 0.78, mui_gio = 'Asia/Ho_Chi_Minh',
  phut_moi_ngay = 20, hoan_tat_onboard_luc = now() - interval '29 days',
  so_dien_thoai = '+84 901 234 567'
  where id = '11111111-1111-1111-1111-111111111111';
update public.ho_so set
  trinh_do_cefr = 'B1', do_tin_cefr = 0.82, phut_moi_ngay = 30,
  hoan_tat_onboard_luc = now() - interval '19 days',
  so_dien_thoai = '+84 902 345 678'
  where id = '22222222-2222-2222-2222-222222222222';
update public.ho_so set
  trinh_do_cefr = 'B2', do_tin_cefr = 0.88, phut_moi_ngay = 45,
  hoan_tat_onboard_luc = now() - interval '44 days',
  so_dien_thoai = '+84 903 456 789'
  where id = '33333333-3333-3333-3333-333333333333';
update public.ho_so set
  trinh_do_cefr = 'A1', do_tin_cefr = 0.70, phut_moi_ngay = 10,
  hoan_tat_onboard_luc = now() - interval '6 days',
  so_dien_thoai = '+84 904 567 890'
  where id = '44444444-4444-4444-4444-444444444444';
update public.ho_so set
  trinh_do_cefr = 'C1', do_tin_cefr = 0.92, phut_moi_ngay = 60,
  hoan_tat_onboard_luc = now() - interval '89 days',
  so_dien_thoai = '+84 905 678 901'
  where id = '55555555-5555-5555-5555-555555555555';

-- Owner user — pre-onboarded, sẵn sàng vào dashboard
update public.ho_so set
  ten_hien_thi = 'Nam Khánh',
  trinh_do_cefr = 'B2', do_tin_cefr = 0.85,
  phut_moi_ngay = 30, mui_gio = 'Asia/Ho_Chi_Minh',
  hoan_tat_onboard_luc = now() - interval '1 day'
  where id = '99999999-9999-9999-9999-999999999999';

-- ============================================================================
-- 2. MUC_TIEU_ND — Mục tiêu chính cho mỗi user
-- ============================================================================
insert into public.muc_tieu_nd (nguoi_dung_id, muc_tieu, diem_muc_tieu, han_chot, la_muc_tieu_chinh)
values
  ('11111111-1111-1111-1111-111111111111', 'ielts',     6.0, '2026-12-31', true),
  ('22222222-2222-2222-2222-222222222222', 'du_lich',   null, '2026-08-15', true),
  ('22222222-2222-2222-2222-222222222222', 'giao_tiep', null, null,         false),
  ('33333333-3333-3333-3333-333333333333', 'toeic',     800,  '2026-10-30', true),
  ('44444444-4444-4444-4444-444444444444', 'giao_tiep', null, null,         true),
  ('55555555-5555-5555-5555-555555555555', 'hoc_thuat', null, '2027-03-01', true),
  ('99999999-9999-9999-9999-999999999999', 'ielts',     7.0,  '2026-12-31', true);

-- ============================================================================
-- 3. NHAN_VAT — Catalog persona roleplay (public)
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
  );

-- ============================================================================
-- 4. BO_TU — 6 bộ từ hệ thống (la_he_thong=true, nguoi_dung_id=null)
-- ============================================================================
insert into public.bo_tu (id, nguoi_dung_id, ten, mo_ta, mau_bia, la_he_thong, chu_de, cefr_phu_hop)
values
  ('bbbbbbbb-0000-0000-0000-000000000001', null, 'Travel A2',       'Từ vựng cơ bản cho du lịch — đặt vé, sân bay, khách sạn.',   '#E8A33D', true, 'travel',   'A2'),
  ('bbbbbbbb-0000-0000-0000-000000000002', null, 'Daily Life B1',   'Từ vựng giao tiếp hằng ngày — gia đình, công việc, sở thích.', '#3B82F6', true, 'daily',    'B1'),
  ('bbbbbbbb-0000-0000-0000-000000000003', null, 'Business B2',     'Từ vựng văn phòng + email + meeting.',                        '#10B981', true, 'business', 'B2'),
  ('bbbbbbbb-0000-0000-0000-000000000004', null, 'Movies B1',       'Từ vựng phim ảnh + TV series + critique.',                    '#EF4444', true, 'movies',   'B1'),
  ('bbbbbbbb-0000-0000-0000-000000000005', null, 'Academic C1',     'Từ vựng học thuật + paper + thesis.',                         '#8B5CF6', true, 'academic', 'C1'),
  ('bbbbbbbb-0000-0000-0000-000000000006', null, 'TOEIC Workplace', 'Từ vựng TOEIC reading + listening.',                          '#06B6D4', true, 'toeic',    'B2');

-- ============================================================================
-- 5. DE_BAI_VIET — 10 đề bài catalog
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
    30, 200, 'Lumio', null);

-- ============================================================================
-- 6. NGUON_NOI_DUNG — Mỗi user 1 nguồn YouTube + 3 đoạn transcript
-- ============================================================================
do $$
declare
  v_user_id uuid;
  v_source_id uuid;
  v_emails text[] := array[
    'an.demo@lumio.vn','chau.demo@lumio.vn','phuc.demo@lumio.vn',
    'linh.demo@lumio.vn','huy.demo@lumio.vn'
  ];
  v_email text;
begin
  foreach v_email in array v_emails loop
    select id into v_user_id from auth.users where email = v_email;
    v_source_id := gen_random_uuid();

    insert into public.nguon_noi_dung (id, nguoi_dung_id, loai, url, ma_bam_url, tieu_de, tac_gia, thoi_luong_giay, ngon_ngu, ban_ghi_loi)
    values (
      v_source_id, v_user_id, 'youtube',
      'https://www.youtube.com/watch?v=demo_' || left(v_user_id::text, 8),
      encode(digest('https://www.youtube.com/watch?v=demo_' || left(v_user_id::text, 8), 'sha256'), 'hex'),
      'TED-Ed: Why do we dream?',
      'TED-Ed',
      280, 'en',
      'Have you ever wondered why we dream? Scientists have been trying to answer this question for decades. One theory is that dreams help us process emotions...'
    );

    insert into public.doan_noi_dung (nguon_id, thu_tu_doan, giay_bat_dau, giay_ket_thuc, noi_dung) values
      (v_source_id, 1, 0.0,   12.5,  'Have you ever wondered why we dream?'),
      (v_source_id, 2, 12.5,  35.0,  'Scientists have been trying to answer this question for decades.'),
      (v_source_id, 3, 35.0,  62.0,  'One theory is that dreams help us process emotions and consolidate memories.');
  end loop;
end $$;

-- ============================================================================
-- 7. TU_DA_LUU — 5 từ mỗi user (mix bộ hệ thống + cá nhân, sample)
-- ============================================================================
-- Bộ từ cá nhân "Từ của tôi" cho từng user
insert into public.bo_tu (nguoi_dung_id, ten, mo_ta, mau_bia, la_he_thong)
select id, 'Từ của tôi', 'Từ cá nhân bạn tự lưu khi học.', '#F59E0B', false
from auth.users where email like '%@lumio.vn';

-- Sample 5 từ cho user "An" (A2). Tương tự pattern cho 4 user còn lại.
do $$
declare
  v_user uuid;
  v_my_deck uuid;
  v_word_id uuid;
  v_words jsonb := '[
    {"tu":"itinerary","loai":"noun","ipa":"/aɪˈtɪnəˌrɛri/","vi":"lịch trình","en":"travel plan or schedule","cefr":"B1"},
    {"tu":"boarding","loai":"noun","ipa":"/ˈbɔːrdɪŋ/","vi":"việc lên máy bay","en":"act of getting on a plane","cefr":"A2"},
    {"tu":"vacancy","loai":"noun","ipa":"/ˈveɪkənsi/","vi":"chỗ trống","en":"an unfilled position or room","cefr":"B1"},
    {"tu":"reservation","loai":"noun","ipa":"/ˌrɛzərˈveɪʃən/","vi":"sự đặt chỗ","en":"booking made in advance","cefr":"A2"},
    {"tu":"departure","loai":"noun","ipa":"/dɪˈpɑːrtʃər/","vi":"sự khởi hành","en":"the act of leaving","cefr":"A2"},
    {"tu":"feasible","loai":"adj","ipa":"/ˈfiːzəbəl/","vi":"khả thi","en":"possible to do","cefr":"B2"},
    {"tu":"underestimate","loai":"verb","ipa":"/ˌʌndərˈɛstɪmeɪt/","vi":"đánh giá thấp","en":"to think something is less than it really is","cefr":"B2"},
    {"tu":"prevalent","loai":"adj","ipa":"/ˈprɛvələnt/","vi":"phổ biến","en":"widespread","cefr":"C1"}
  ]'::jsonb;
  v_word jsonb;
  v_emails text[] := array['an.demo@lumio.vn','chau.demo@lumio.vn','phuc.demo@lumio.vn','linh.demo@lumio.vn','huy.demo@lumio.vn'];
  v_email text;
  v_idx int;
begin
  foreach v_email in array v_emails loop
    select id into v_user from auth.users where email = v_email;
    select id into v_my_deck from public.bo_tu where nguoi_dung_id = v_user and la_he_thong = false limit 1;

    v_idx := 0;
    for v_word in select * from jsonb_array_elements(v_words) loop
      v_idx := v_idx + 1;
      if v_idx > 5 then exit; end if;
      v_word_id := gen_random_uuid();

      insert into public.tu_da_luu (
        id, nguoi_dung_id, bo_tu_id, tu_goc, loai_tu, phien_am,
        nghia_en, nghia_vi, vi_du, cefr_phu_hop, trang_thai, da_danh_dau
      ) values (
        v_word_id, v_user, v_my_deck,
        v_word->>'tu', v_word->>'loai', v_word->>'ipa',
        v_word->>'en', v_word->>'vi',
        jsonb_build_array(
          jsonb_build_object('en', 'I love this ' || (v_word->>'tu') || '.', 'vi', 'Tôi rất thích ' || (v_word->>'vi') || '.')
        ),
        (v_word->>'cefr')::trinh_do_cefr,
        (case v_idx when 1 then 'thuoc' when 2 then 'on_tap' when 3 then 'dang_hoc' else 'moi' end)::trang_thai_tu,
        (v_idx = 1)
      );

      -- lịch ôn tương ứng
      insert into public.lich_on_tap (tu_id, nguoi_dung_id, he_so_de, so_ngay_cach, so_lan_lap, on_tap_ke_luc, on_tap_cuoi_luc, chat_luong_cuoi)
      values (
        v_word_id, v_user,
        2.5 + (v_idx * 0.1),
        v_idx * 2,
        v_idx,
        now() + (v_idx * interval '1 day'),
        now() - (v_idx * interval '1 day'),
        case when v_idx <= 3 then 4 else null end
      );
    end loop;
  end loop;
end $$;

-- ============================================================================
-- 8. PHIEN_NOI + LUOT_NOI — 1 phiên speaking mỗi user, 4 lượt nói
-- ============================================================================
do $$
declare
  v_user uuid;
  v_phien uuid;
  v_emails text[] := array['an.demo@lumio.vn','chau.demo@lumio.vn','phuc.demo@lumio.vn','linh.demo@lumio.vn','huy.demo@lumio.vn'];
  v_email text;
begin
  foreach v_email in array v_emails loop
    select id into v_user from auth.users where email = v_email;
    v_phien := gen_random_uuid();

    insert into public.phien_noi (id, nguoi_dung_id, nhan_vat_id, boi_canh, bat_dau_luc, ket_thuc_luc, tong_luot, diem_phat_am_tb, tom_tat)
    values (
      v_phien, v_user,
      'aaaaaaaa-0000-0000-0000-000000000002',  -- Marcus
      'Ordering coffee at a cafe',
      now() - interval '2 days', now() - interval '2 days' + interval '10 minutes',
      4, 7.6,
      'Good practice ordering. Watch pronunciation of "espresso" — stress first syllable.'
    );

    insert into public.luot_noi (phien_id, thu_tu_luot, vai, noi_dung, diem_phat_am, sua_loi, tao_luc) values
      (v_phien, 1, 'ai',         'Hi! What can I get you?',                                   null, null,                                                                                                          now() - interval '2 days'),
      (v_phien, 2, 'nguoi_dung', 'Hi, I would like a medium latte please.',                   7.5,
        '[{"phrase":"a medium latte","fix":"a medium latte","reason":"OK, natural"}]'::jsonb,
        now() - interval '2 days' + interval '20 seconds'),
      (v_phien, 3, 'ai',         'Sure! Hot or iced?',                                        null, null,                                                                                                          now() - interval '2 days' + interval '30 seconds'),
      (v_phien, 4, 'nguoi_dung', 'Iced, please. And can I have it less sweet?',               7.8,
        '[{"phrase":"less sweet","fix":"less sweet","reason":"natural"}]'::jsonb,
        now() - interval '2 days' + interval '50 seconds');
  end loop;
end $$;

-- ============================================================================
-- 9. BAI_VIET + CHU_THICH_BAI_VIET — 1 bài viết hoàn chỉnh mỗi user
-- ============================================================================
do $$
declare
  v_user uuid;
  v_bai uuid;
  v_de uuid;
  v_emails text[] := array['an.demo@lumio.vn','chau.demo@lumio.vn','phuc.demo@lumio.vn','linh.demo@lumio.vn','huy.demo@lumio.vn'];
  v_email text;
begin
  select id into v_de from public.de_bai_viet where loai_de = 'email' and cefr_phu_hop = 'A2' limit 1;

  foreach v_email in array v_emails loop
    select id into v_user from auth.users where email = v_email;
    v_bai := gen_random_uuid();

    insert into public.bai_viet (
      id, nguoi_dung_id, de_bai_id, loai_de, de_bai_snapshot, noi_dung,
      thoi_gian_lam_giay, nop_luc, diem_tong,
      score_task_achievement, score_coherence, score_lexical, score_grammar,
      tom_tat_phan_hoi
    ) values (
      v_bai, v_user, v_de, 'email',
      'Viết email cho bạn mời họ đến ăn tối cuối tuần.',
      'Hi Lan, How are you? I want to invite you to dinner this Saturday at 7pm. We will eat at home, my mum is cooking pho. Please come and bring your sister. See you soon. Best, Minh',
      900,
      now() - interval '5 days',
      6.5, 6.5, 7.0, 6.5, 6.0,
      'Bài viết rõ ràng đủ thông tin. Cần đa dạng cấu trúc câu hơn và thêm chi tiết cụ thể.'
    );

    insert into public.chu_thich_bai_viet (bai_viet_id, vi_tri_bat_dau, vi_tri_ket_thuc, phan_loai, muc_do, doan_goc, goi_y_sua, giai_thich) values
      (v_bai,   0,   10, 'grammar',  'nhe',  'Hi Lan, How', 'Hi Lan,\nHow',          'Sau dấu phẩy ở lời chào nên xuống dòng.'),
      (v_bai,  45,   60, 'lexical',  'nhe',  'I want to',   'I would like to',       'Trong văn viết, "would like" lịch sự hơn "want".'),
      (v_bai, 110,  130, 'coherence','nhe',  'See you soon','I look forward to seeing you.', 'Câu kết trang trọng hơn phù hợp văn phong email.');
  end loop;
end $$;

-- ============================================================================
-- 10. PHIEN_HOC — Activity log 7 ngày gần nhất cho mỗi user
-- ============================================================================
do $$
declare
  v_user uuid;
  v_emails text[] := array['an.demo@lumio.vn','chau.demo@lumio.vn','phuc.demo@lumio.vn','linh.demo@lumio.vn','huy.demo@lumio.vn'];
  v_email text;
  v_activities loai_hoat_dong[] := array['noi','on_tu','doc','viet','quiz']::loai_hoat_dong[];
  v_i int;
begin
  foreach v_email in array v_emails loop
    select id into v_user from auth.users where email = v_email;

    -- 7 ngày * 1-2 phiên = ~10 hàng phien_hoc
    for v_i in 0..6 loop
      insert into public.phien_hoc (nguoi_dung_id, loai_hoat_dong, bat_dau_luc, ket_thuc_luc, thoi_luong_giay, chi_so)
      values (
        v_user,
        v_activities[1 + (v_i % 5)],
        now() - (v_i * interval '1 day') - interval '8 hours',
        now() - (v_i * interval '1 day') - interval '8 hours' + interval '15 minutes',
        900,
        jsonb_build_object('words_reviewed', 12 + v_i, 'note', 'phiên hằng ngày')
      );
    end loop;
  end loop;
end $$;

-- ============================================================================
-- 11. THONG_BAO — 2 thông báo mẫu mỗi user (1 unread + 1 read)
-- ============================================================================
insert into public.thong_bao (nguoi_dung_id, loai, tieu_de, noi_dung, url_hanh_dong, doc_luc, lich_gui_luc)
select
  u.id,
  'nhac_on'::loai_thong_bao,
  'Bạn có 5 từ cần ôn',
  'Chỉ vài phút để giữ chuỗi học của bạn.',
  '/vocab/review',
  null,
  now() - interval '1 hour'
from auth.users u
where u.email like '%@lumio.vn';

insert into public.thong_bao (nguoi_dung_id, loai, tieu_de, noi_dung, url_hanh_dong, doc_luc, lich_gui_luc)
select
  u.id,
  'thanh_tich'::loai_thong_bao,
  'Chúc mừng! Đạt streak 7 ngày',
  'Bạn đã học liên tục 7 ngày. Giữ vững nhịp độ này!',
  '/dashboard',
  now() - interval '12 hours',
  now() - interval '1 day'
from auth.users u
where u.email like '%@lumio.vn';

-- ============================================================================
-- Refresh MV ngay để dashboard có dữ liệu sau seed
-- ============================================================================
refresh materialized view public.mv_thong_ke_nguoi_dung;

-- ============================================================================
-- Sanity check (in vào output supabase db reset để dev biết seed chạy đúng)
-- ============================================================================
do $$
declare
  v_users      int;
  v_words      int;
  v_essays     int;
  v_sessions   int;
begin
  select count(*) into v_users    from public.ho_so;
  select count(*) into v_words    from public.tu_da_luu;
  select count(*) into v_essays   from public.bai_viet;
  select count(*) into v_sessions from public.phien_hoc;
  raise notice 'SEED OK — ho_so: %, tu_da_luu: %, bai_viet: %, phien_hoc: %',
    v_users, v_words, v_essays, v_sessions;
end $$;
