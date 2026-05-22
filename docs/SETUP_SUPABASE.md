# Setup Supabase cho Lumio

Hướng dẫn cài đặt từ máy mới đến chạy được local DB + đẩy migration lên cloud.

## 1. Cài Docker Desktop

Local Supabase chạy trong Docker.

**Windows:**
1. Tải [Docker Desktop](https://www.docker.com/products/docker-desktop/).
2. Trong cài đặt, bật **WSL2 backend** (sẽ nhanh hơn Hyper-V).
3. Mở Docker Desktop → đợi icon dưới khay hệ thống chuyển xanh.

**macOS:** `brew install --cask docker` → mở app.

Kiểm tra: `docker --version` phải hiện số phiên bản.

## 2. Cài Supabase CLI

Đã có trong `devDependencies`, chạy:

```bash
pnpm install
```

CLI sẽ ở `node_modules/.bin/supabase`. Các script `pnpm supabase:*` đã wrap sẵn.

**Cách khác (cài global)** trên Windows:
```powershell
scoop install supabase
# hoặc
winget install Supabase.CLI
```

Trên macOS: `brew install supabase/tap/supabase`.

Kiểm tra: `pnpm supabase:start --help` không lỗi.

## 3. Khởi động local DB

```bash
pnpm supabase:start
```

Lần đầu sẽ tải ~5 image Docker (~10 phút). Output cuối cùng in:

```
API URL:    http://127.0.0.1:54321
DB URL:     postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
anon key:   eyJ...
service_role key: eyJ...
```

Sao chép `anon key` + `service_role key` vào `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service_role key>
```

Mở Supabase Studio tại http://127.0.0.1:54323 — đây là GUI để duyệt bảng, chạy SQL.

## 4. Apply migrations + seed

`pnpm supabase:start` đã tự chạy 12 migration + `seed.sql`. Nếu cần reset:

```bash
pnpm supabase:reset
```

Lệnh này drop tất cả + chạy lại migrations theo thứ tự + seed. Cuối cùng in `SEED OK — ho_so: 5, tu_da_luu: 25, ...`.

## 5. Đăng nhập với user demo

5 user mẫu (xem `supabase/seed.sql` §1):

| Email                  | Password    | Trình độ |
|------------------------|-------------|----------|
| an.demo@lumio.vn       | `Demo2026!` | A2       |
| chau.demo@lumio.vn     | `Demo2026!` | B1       |
| phuc.demo@lumio.vn     | `Demo2026!` | B2       |
| linh.demo@lumio.vn     | `Demo2026!` | A1       |
| huy.demo@lumio.vn      | `Demo2026!` | C1       |

Mở `pnpm dev` → http://localhost:3000/login → dán email + password.

> Login email/password hiện chưa có UI trong Lumio MVP — chỉ OAuth Google/Facebook.
> Để test bằng user demo, dùng Supabase Studio SQL editor:
> ```sql
> select auth.sign_in_with_password('an.demo@lumio.vn', 'Demo2026!');
> ```

## 6. Sinh types TypeScript từ schema

```bash
pnpm supabase:types
```

Tạo `src/types/supabase.ts` để TypeScript biết shape của mọi bảng. Chạy lại sau mỗi migration mới.

## 7. Setup remote project (cho production)

1. Tạo project tại https://app.supabase.com.
2. Lấy `Project ref` từ URL Dashboard (vd. `abcdefghijklmnop`).
3. Tạo access token tại https://app.supabase.com/account/tokens.
4. Điền vào `.env.local`:
   ```
   SUPABASE_ACCESS_TOKEN=sbp_...
   SUPABASE_PROJECT_REF=abcdefghijklmnop
   SUPABASE_DB_PASSWORD=<DB password từ Settings → Database>
   ```
5. Link project:
   ```bash
   pnpm supabase:link
   ```
6. Push migration lên cloud:
   ```bash
   pnpm supabase:push     # apply tất cả migration mới
   ```

## 8. Push migration qua GitHub Actions

Vào tab **Actions** của repo → chọn workflow **"DB push (remote)"** → nút **Run workflow**:

- `environment`: `production` (mặc định) hoặc `staging`
- `dry_run`: `true` (preview) → chạy thử trước → nếu OK thì rerun với `false`

Workflow yêu cầu GitHub secrets sau (Settings → Secrets and variables → Actions):

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_REF`

## 9. Cấu hình OAuth provider

Sau khi link remote project, **vẫn cần bật OAuth thủ công** trên Supabase Dashboard:

- **Authentication → Providers → Google** → bật → dán Client ID + Secret.
- **Authentication → Providers → Facebook** → bật → dán App ID + App Secret.

Chi tiết cách lấy keys từ Google/Facebook console: xem [docs/SETUP_OAUTH.md](SETUP_OAUTH.md).

## 10. Lệnh hằng ngày

```bash
pnpm supabase:start         # khởi động Docker stack
pnpm supabase:stop          # tắt
pnpm supabase:reset         # apply migrations + seed lại từ đầu
pnpm supabase:diff -f xyz   # sinh migration mới từ thay đổi schema trong Studio
pnpm supabase:types         # regenerate src/types/supabase.ts
pnpm supabase:push          # push lên remote (cẩn thận!)
```

## Troubleshooting

**`Cannot connect to the Docker daemon`** — Docker Desktop chưa bật. Mở app, đợi icon xanh.

**`port 54321 already in use`** — đã có Supabase chạy. `pnpm supabase:stop` rồi start lại.

**Migration apply thất bại** — đọc lỗi cụ thể. Thường do:
- Thiếu extension → kiểm tra migration 01 đã chạy chưa.
- Syntax SQL sai → fix file migration tương ứng, `pnpm supabase:reset`.

**Cron job không chạy local** — `pg_cron` chạy nhưng Supabase local mặc định không trigger được background job. Đó là chuyện bình thường cho dev — chỉ test cron job trên cloud.

**Seed.sql lỗi `permission denied for schema auth`** — Supabase CLI phải chạy với postgres role. `pnpm supabase:reset` thay vì psql trực tiếp.
