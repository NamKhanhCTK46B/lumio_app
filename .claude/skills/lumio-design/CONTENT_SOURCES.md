# Lumio — Nguồn dữ liệu nội dung

> Danh sách các **nguồn uy tín, công khai** để lấy từ vựng, ví dụ, đề bài viết, transcript, v.v. Tất cả các nguồn dưới đây đều **đã được kiểm chứng** và đa số có giấy phép mở (open license) hoặc API miễn phí.
>
> ⚠️ Trước khi tích hợp vào production, đọc **điều khoản sử dụng** của từng API/dataset — Lumio chỉ phục vụ mục đích học tập, nhưng nếu mở rộng thương mại, một số nguồn yêu cầu attribution hoặc cấm scrape.

---

## 1. Định nghĩa từ vựng & phát âm

### 🟢 Free Dictionary API — `dictionaryapi.dev`
- **URL:** https://dictionaryapi.dev
- **Endpoint:** `https://api.dictionaryapi.dev/api/v2/entries/en/<word>`
- **Cần API key:** Không
- **Trả về:** definition, phonetics (IPA + audio MP3), examples, synonyms, antonyms
- **Mức dùng:** miễn phí, không giới hạn hợp lý, mã nguồn mở.
- **Vai trò trong Lumio:** nguồn chính cho popup từ vựng (`tu_da_luu.nghia_en`, `phonetic_ipa`, `examples`).

```ts
// lib/dictionary/free.ts
const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
```

### 🟡 Merriam-Webster Developer API
- **URL:** https://dictionaryapi.com
- **Cần đăng ký:** Có (miễn phí, 1000 req/ngày, chỉ cho mục đích phi-thương-mại)
- **Trả về:** Học thuật hơn Free Dictionary; có Learner's Dictionary phù hợp ESL.
- **Khi nào dùng:** dự phòng / cross-check khi Free Dictionary trả về kết quả mỏng.

### 🟡 Datamuse API
- **URL:** https://www.datamuse.com/api
- **Cần API key:** Không (100K req/ngày miễn phí)
- **Trả về:** "Word-finding" API — tìm từ đồng nghĩa, từ vần, từ thường đi kèm (collocation), v.v.
- **Vai trò trong Lumio:** điền `tu_da_luu.tu_dong_nghia`, gợi ý collocation cho writing.

### 🟢 Forvo Pronunciation API
- **URL:** https://api.forvo.com
- **Cần API key:** Có (gói free 500 req/ngày)
- **Trả về:** Audio phát âm bởi người bản xứ thật (không phải TTS robot).
- **Vai trò trong Lumio:** thay thế cho audio MP3 của Free Dictionary nếu cần giọng tự nhiên hơn.

---

## 2. Bộ từ vựng theo trình độ (CEFR & wordlist chuẩn)

### 🟢 CEFR-J Wordlist
- **URL:** https://cefr-j.org/download.html
- **Tác giả:** Project CEFR-J (Tokyo University of Foreign Studies)
- **Giấy phép:** Creative Commons BY-SA — dùng tự do cho phi thương mại.
- **Định dạng:** Excel/CSV với ~7,800 từ phân loại A1, A2, B1, B2, C1.
- **Vai trò:** seed cho thuật toán "highlight từ trên trình độ" — biết user CEFR B1 thì highlight các từ ≥ B2.

### 🟢 English Vocabulary Profile (EVP) / Cambridge
- **URL:** https://www.englishprofile.org/wordlists/evp
- **Mức dùng:** Free để tra cứu trên web (không có API chính thức — phải đăng ký, có thể request bản CSV cho mục đích nghiên cứu/giáo dục).
- **Vai trò:** chuẩn vàng cho CEFR mapping; xác minh CEFR-J.

### 🟢 General Service List (GSL)
- **URL:** https://www.newgeneralservicelist.com (GSL 2013, by Browne, Culligan, Phillips)
- **Bản gốc:** West (1953), public domain.
- **Mức dùng:** Tải miễn phí, đa định dạng (CSV, Excel).
- **Vai trò:** Top ~2,800 từ vựng phổ biến nhất, chiếm 90%+ văn bản đời thường. Là baseline cho người mới (A1–A2).

### 🟢 Academic Word List (AWL) — Coxhead 2000
- **URL:** https://www.wgtn.ac.nz/lals/resources/academicwordlist (Victoria University of Wellington)
- **Mức dùng:** Free, có CSV.
- **Vai trò:** 570 word families thuộc văn phong học thuật. Quan trọng cho IELTS / TOEFL learners (B2+).

### 🟢 BNC / COCA Frequency Lists
- **URL:**
  - BNC: http://www.natcorp.ox.ac.uk
  - COCA: https://www.english-corpora.org/coca/ (Mark Davies)
- **Mức dùng:** Top 5,000 / 20,000 word lists tải miễn phí cho học tập; bản full có phí.
- **Vai trò:** Frequency ranking — dùng để xếp độ khó từ vựng và sinh quiz.

---

## 3. Bộ từ vựng theo chủ đề có sẵn (cho `bo_tu.la_he_thong = true`)

| Chủ đề | Nguồn gợi ý | URL |
|---|---|---|
| IELTS Academic | Cambridge Vocabulary for IELTS (sách) — list từ phổ biến công khai | https://www.cambridge.org |
| TOEIC | ETS sample word lists | https://www.ets.org/toeic |
| Business English | Business English Vocabulary của British Council | https://learnenglish.britishcouncil.org/business-english |
| Travel | Oxford Picture Dictionary topics (public lists có sẵn nhiều nơi) | https://www.oxfordlearnersdictionaries.com |
| Daily conversation | Newgeneralservicelist.com (GSL) | https://www.newgeneralservicelist.com |
| Phim & truyền hình | OpenSubtitles-based frequency lists | https://www.opensubtitles.org |
| Tin tức | VOA Learning English wordlists | https://learningenglish.voanews.com |

> **Khuyến nghị quy trình:** dùng EVP làm "ground truth" cho CEFR; seed 6–8 deck mẫu (`bo_tu.la_he_thong = true`) gồm 40–60 từ mỗi deck; gắn `topic` và `cefr_level` để filter.

---

## 4. Đề bài viết (Essay / Email / Sentence prompts)

### 🟢 IELTS Liz — sample Writing Task 1 & Task 2
- **URL:** https://ieltsliz.com
- **Tác giả:** Liz Ferguson, ex-IELTS examiner
- **Mức dùng:** Đề bài và sample answer công khai, có thể trích dẫn (ghi nguồn).
- **Vai trò:** ~200+ đề Task 2 đã được phân loại (opinion, discussion, problem-solution).

### 🟢 IELTS-Simon
- **URL:** https://ielts-simon.com
- **Tác giả:** Simon Braveheart (ex-examiner)
- **Mức dùng:** Đề + bài mẫu band 9, miễn phí.
- **Vai trò:** Tham chiếu chấm điểm.

### 🟢 British Council — LearnEnglish & Take IELTS
- **URL:**
  - https://learnenglish.britishcouncil.org/skills/writing
  - https://takeielts.britishcouncil.org/take-ielts/prepare/free-ielts-practice-tests/writing
- **Mức dùng:** Free practice tests + sample answers chính thức.
- **Vai trò:** **Nguồn uy tín nhất** cho đề và rubric chính thức.

### 🟢 Cambridge IELTS Past Papers (sách 1–19)
- **URL:** https://www.cambridgeenglish.org/exams-and-tests/ielts/
- **Mức dùng:** Sách giấy / PDF — đề thi thật từ các kỳ trước, có sample answer và band annotation. Không dùng API; có thể import thủ công.
- **Vai trò:** Bộ đề "vàng" — dùng để seed `de_bai_viet` table.

### 🟢 IELTS Writing Sample Answers — IDP Australia
- **URL:** https://ielts.idp.com/prepare/article-ielts-writing-sample-answers
- **Mức dùng:** Free, có band tương đối.

### 🟢 Owl Purdue — Writing Lab
- **URL:** https://owl.purdue.edu/owl/general_writing/index.html
- **Vai trò:** Hướng dẫn academic writing (structure, citation, grammar) — hữu ích cho **prompt** chấm bài và **gợi ý phản hồi**.

### 🟢 Common Email Templates
- **URL:** https://learnenglish.britishcouncil.org/business-english/writing-emails
- **Vai trò:** Mẫu email formal / informal — seed cho `task_type = 'email'`.

---

## 5. Ngữ pháp & cách diễn đạt

### 🟢 LanguageTool API
- **URL:** https://languagetool.org/http-api
- **Self-host:** https://github.com/languagetool-org/languagetool (mã nguồn mở, LGPL)
- **Mức dùng:** API public free (giới hạn 20 req/phút); self-host không giới hạn.
- **Vai trò:** Grammar/spell checker — pre-process essay trước khi gửi qua Gemini, giảm token tiêu tốn cho lỗi đơn giản.

### 🟢 Cambridge English Grammar Today
- **URL:** https://dictionary.cambridge.org/grammar/british-grammar
- **Mức dùng:** Tra cứu trên web, không có API.
- **Vai trò:** Reference cho LLM prompt khi giải thích quy tắc ngữ pháp.

### 🟢 Perfect English Grammar
- **URL:** https://www.perfect-english-grammar.com
- **Mức dùng:** Free quizzes + explanation; có thể tham chiếu.

---

## 6. Nội dung nguồn để học (YouTube / Article / Podcast)

### 🟢 VOA Learning English
- **URL:** https://learningenglish.voanews.com
- **Đặc điểm:** Tin tức tiếng Anh **chậm rãi**, có transcript đầy đủ — lý tưởng cho A2–B1.
- **Giấy phép:** Public domain (sản phẩm chính phủ Mỹ).
- **Cách lấy:** Scrape HTML legal, hoặc dùng RSS feed: https://learningenglish.voanews.com/api/

### 🟢 BBC Learning English
- **URL:** https://www.bbc.co.uk/learningenglish
- **Đặc điểm:** Series "6 Minute English", "English in a Minute" có transcript.
- **Mức dùng:** Public, nhưng giới hạn redistribute — chỉ link, không host lại.

### 🟢 TED-Ed
- **URL:** https://ed.ted.com
- **Đặc điểm:** Video giáo dục 5–10 phút có transcript chính thức.
- **Giấy phép:** TED Talks — CC BY-NC-ND 4.0 (tham chiếu được).

### 🟢 YouTube Transcript API (third-party)
- **Repo:** https://github.com/jdepoix/youtube-transcript-api (Python — gọi gián tiếp)
- **JS alternative:** `youtube-transcript` npm package (https://www.npmjs.com/package/youtube-transcript)
- **Mức dùng:** Free, không cần API key.
- **Vai trò:** Lấy auto-caption / human-caption transcript khi user dán link YouTube. Là **đường chính** trong UC8.

### 🟢 Mercury / Readability — article extraction
- **URL:**
  - Mozilla Readability: https://github.com/mozilla/readability (npm: `@mozilla/readability`)
  - Postlight Parser (Mercury legacy): https://github.com/postlight/parser
- **Mức dùng:** Mã nguồn mở.
- **Vai trò:** Trích plain text + title + author từ URL bài báo.

### 🟢 Podcast Index API
- **URL:** https://podcastindex.org/api
- **Mức dùng:** Free (cần đăng ký lấy API key).
- **Vai trò:** Tìm và lấy metadata podcast.

### 🟢 Listen Notes API
- **URL:** https://www.listennotes.com/api
- **Mức dùng:** Free tier 300 req/tháng.
- **Vai trò:** Tìm podcast theo chủ đề / keyword.

---

## 7. Câu ví dụ & corpus (cho việc xây dataset offline)

### 🟢 Tatoeba — câu song ngữ Anh/Việt
- **URL:** https://tatoeba.org
- **Mức dùng:** CC BY 2.0 FR — tải full dump miễn phí.
- **Vai trò:** Ví dụ câu cặp EN-VI cho mỗi từ vựng.

### 🟢 OpenSubtitles
- **URL:** https://www.opensubtitles.org
- **Mức dùng:** Có dataset OPUS phục vụ NLP (free); raw scrape thì cần tôn trọng robots.txt.
- **Vai trò:** Câu trong context phim ảnh, hữu ích cho mục tiêu "xem phim không cần phụ đề".

### 🟢 Project Gutenberg
- **URL:** https://www.gutenberg.org
- **Mức dùng:** 60,000+ sách public domain.
- **Vai trò:** Trích văn bản literature cho người học C1–C2.

### 🟢 OPUS — open parallel corpora
- **URL:** https://opus.nlpl.eu
- **Vai trò:** Bộ song ngữ EN-VI lớn (Tatoeba, TED Talks, OpenSubtitles…).

---

## 8. Tài nguyên giảng dạy bổ sung

| Mục đích | Nguồn | URL |
|---|---|---|
| IELTS Speaking topics | IELTS-blog, IELTS Liz | https://www.ielts-blog.com |
| Idiom & phrasal verb | The Free Dictionary Idioms | https://idioms.thefreedictionary.com |
| Pronunciation drills | YouGlish (xem từ trong nhiều ngữ cảnh video) | https://youglish.com |
| Slang & informal | Urban Dictionary (cẩn thận, đôi khi NSFW) | https://www.urbandictionary.com |
| Synonym richness | WordNet (Princeton) — free download | https://wordnet.princeton.edu |
| Word frequency in films | SUBTLEX-US | https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus |

---

## 9. Cách Lumio sử dụng các nguồn trên — quy trình đề xuất

### 9.1 Seed bộ từ hệ thống (system bo_tu)
1. Tải CEFR-J wordlist + AWL + GSL.
2. Chia thành 6–8 deck chủ đề (Travel, Business, Movies, IELTS Academic, …) — mỗi deck 40–60 từ.
3. Với mỗi từ, gọi Free Dictionary API → điền `definition_en`, `phonetic_ipa`, `examples`.
4. Gọi Datamuse → điền `synonyms`.
5. Dịch sang tiếng Việt qua Gemini (`gemini-3.1-flash-lite`) → điền `definition_vi`.
6. Embed bằng `gemini-embedding-2-preview` → điền `vector`.
7. `insert into bo_tu (is_system=true, ...)` rồi `insert into tu_da_luu (...)`.

### 9.2 Seed đề bài viết
1. Lấy ~30 đề IELTS Writing Task 2 từ IELTS Liz / British Council / Cambridge Past Papers.
2. Lấy ~10 đề Task 1 (graph/letter).
3. Lấy ~20 mẫu email (formal/informal) từ British Council.
4. Lưu vào table `de_bai_viet (id, loai_de, cefr_phu_hop, chu_de, de_bai, url_nguon)`.

### 9.3 Workflow lấy nội dung user
1. User dán URL → `ContentExtractor.extractorFor(url)` (Factory pattern).
2. YouTube: dùng `youtube-transcript` npm.
3. Article: dùng `@mozilla/readability`.
4. Podcast: lấy metadata qua Podcast Index API; transcript qua Whisper nếu thiếu.
5. Lưu vào `nguon_noi_dung` + `doan_noi_dung`, embed + cache.

### 9.4 Pipeline chấm bài
1. Pre-process bằng LanguageTool API — bắt lỗi cơ bản trước.
2. Gửi cùng essay + LT findings → Gemini với prompt rubric IELTS.
3. Parse JSON response → ghi `chu_thich_bai_viet` + `bai_viet` scores.

---

## 10. Bản quyền & ghi nguồn

| Nguồn | Yêu cầu attribution |
|---|---|
| Free Dictionary API | Không (open source, MIT) |
| CEFR-J | Có — CC BY-SA: ghi "CEFR-J (Tokyo University of Foreign Studies)" trong giao diện |
| Tatoeba | Có — CC BY 2.0 FR: ghi "Examples from Tatoeba.org" |
| VOA | Không (public domain) |
| BBC | Không redistribute — chỉ link/embed |
| TED-Ed | CC BY-NC-ND — ghi "Source: TED-Ed" + không sửa nội dung |
| Cambridge IELTS sách | Bản quyền © Cambridge — chỉ dùng đề mẫu trong khuôn khổ học tập, không nhân bản đại trà |
| AWL (Coxhead) | Có — citation "Academic Word List, Coxhead (2000)" |
| GSL (Browne 2013) | Có — link về newgeneralservicelist.com |
| WordNet | Không (BSD-style license) — nhưng nên ghi nguồn |

> Trong app Lumio, thêm trang `/credits` liệt kê tất cả nguồn theo yêu cầu. Đây là **bắt buộc về mặt đạo đức và pháp lý** — không bỏ qua.

---

## 11. Cảnh báo

- **Không scrape Cambridge / IELTS.org / Cake / ELSA** — vi phạm ToS, có thể bị block IP.
- **Không tự xưng có liên kết với British Council / ETS / IELTS** nếu không có hợp đồng đối tác.
- **Whisper qua OpenAI trực tiếp** có cost — dùng Together / Replicate free tier hoặc self-host nếu có GPU.
- **Gemini chỉ free đến giới hạn AI Studio**; production cần gói trả phí qua Vertex AI.
