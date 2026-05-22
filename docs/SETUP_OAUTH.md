# Setup OAuth Google + Facebook cho Lumio

Hướng dẫn từng bước cấu hình OAuth trên web console (Google Cloud + Facebook Developers) và Supabase để user có thể đăng nhập bằng tài khoản Google/Facebook.

> ⏱ Mất ~30 phút lần đầu (chủ yếu đợi consent screen review trong Facebook nếu lên production).

---

## Bước 1 — Lấy callback URL từ Supabase

Supabase chấp nhận callback theo format:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

Trong đó `<project-ref>` lấy ở **Dashboard → Project Settings → General → Reference ID**.

**Local:**
```
http://127.0.0.1:54321/auth/v1/callback
```

URL này sẽ dán vào cả Google Console và Facebook Developer Console ở các bước sau. Copy đầy đủ kèm protocol (`https://`), không thêm `/` cuối.

---

## Bước 2 — Cấu hình Google OAuth

### 2.1 Tạo Google Cloud Project

1. Mở https://console.cloud.google.com/.
2. Góc trên trái → **"Select a project"** → **"New Project"**.
3. Project name: `lumio-prod` (hoặc tên tuỳ ý). Tổ chức: cá nhân.
4. Click **Create**, đợi project được tạo (vài giây).
5. Chuyển sang project vừa tạo (chọn từ dropdown góc trên).

### 2.2 Bật API + cấu hình OAuth consent screen

1. Sidebar trái → **APIs & Services → OAuth consent screen**.
2. **User Type:** chọn **External** → Create.
3. **App information:**
   - **App name:** `Lumio`
   - **User support email:** email của bạn
   - **App logo:** (tuỳ chọn) upload logo Lumio 120×120 px
4. **App domain (tuỳ chọn):** chỉ điền khi đã có domain prod.
5. **Authorized domains:** thêm `lumio.vn` (hoặc domain prod thật của bạn) — *không cần khi đang local-only*.
6. **Developer contact information:** lại email của bạn.
7. Click **Save and continue**.

### 2.3 Khai báo scopes

1. Click **Add or remove scopes**.
2. Chọn 3 scope:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
3. Click **Update** → **Save and continue**.

### 2.4 Thêm test users (chỉ giai đoạn dev)

1. Click **Add users**.
2. Thêm 5 email demo của Lumio (`an.demo@lumio.vn`, `chau.demo@lumio.vn`, …) + email cá nhân của bạn.
3. **Save and continue** → quay về dashboard.

> Trong **Testing mode**, chỉ user trong danh sách test mới đăng nhập được. Khi sẵn sàng production: vào trang OAuth consent screen → **Publish app** → Google sẽ verify (vài ngày).

### 2.5 Tạo OAuth Client ID

1. Sidebar → **APIs & Services → Credentials → + Create Credentials → OAuth client ID**.
2. **Application type:** **Web application**.
3. **Name:** `Lumio Web Client`.
4. **Authorized JavaScript origins:** thêm cả 2:
   - `http://localhost:3000`
   - `https://lumio.vn` (nếu đã có)
5. **Authorized redirect URIs:** **dán callback URL ở Bước 1** — cả local lẫn prod nếu đã có:
   - `http://127.0.0.1:54321/auth/v1/callback`
   - `https://<project-ref>.supabase.co/auth/v1/callback`
6. Click **Create**. Popup hiện **Client ID** + **Client secret**.
7. Copy 2 giá trị, dán vào `.env.local`:
   ```
   SUPABASE_AUTH_GOOGLE_CLIENT_ID=<client-id>.apps.googleusercontent.com
   SUPABASE_AUTH_GOOGLE_SECRET=GOCSPX-<secret>
   ```

### 2.6 Bật Google provider trên Supabase

**Local:** `config.toml` đã đọc từ env, không cần làm gì thêm — restart `pnpm supabase:stop && supabase:start`.

**Production (Supabase Dashboard):**
1. Mở project Supabase cloud → **Authentication → Providers**.
2. Tìm **Google** → bật toggle.
3. Dán **Client ID** + **Client Secret**.
4. **Callback URL** Supabase hiện sẵn — copy nó và đảm bảo đã thêm vào danh sách "Authorized redirect URIs" ở Google Console (Bước 2.5).
5. Click **Save**.

---

## Bước 3 — Cấu hình Facebook OAuth

### 3.1 Tạo Facebook App

1. Mở https://developers.facebook.com/apps.
2. Click **Create App** (góc trên phải).
3. **Use case:** chọn **"Authenticate and request data from users with Facebook Login"** → Next.
4. **App type:** chọn **Consumer** → Next.
5. **App details:**
   - **App name:** `Lumio`
   - **App contact email:** email của bạn
   - **Business portfolio:** (để trống nếu cá nhân)
6. Click **Create app**. Có thể cần nhập lại password Facebook để xác thực.

### 3.2 Thêm Facebook Login product

1. Dashboard của app vừa tạo → sidebar trái → **Add products to your app**.
2. Tìm **"Facebook Login"** → click **Set up**.
3. **Platform:** chọn **Web**.
4. **Site URL:** `http://localhost:3000` (dev) hoặc `https://lumio.vn` (prod).
5. Click **Save** → **Continue**. Bỏ qua các bước "Test your changes" — chỉ cần config.

### 3.3 Khai báo redirect URI

1. Sidebar → **Facebook Login → Settings**.
2. **Valid OAuth Redirect URIs:** dán callback URL ở Bước 1:
   ```
   http://127.0.0.1:54321/auth/v1/callback
   https://<project-ref>.supabase.co/auth/v1/callback
   ```
3. Bật cả 2 toggle:
   - **Client OAuth Login**
   - **Web OAuth Login**
4. **Save changes**.

### 3.4 Lấy App ID + App Secret

1. Sidebar → **Settings → Basic**.
2. **App ID** hiển thị sẵn.
3. **App Secret** ẩn — click **Show** → nhập lại password Facebook → copy.
4. Dán vào `.env.local`:
   ```
   SUPABASE_AUTH_FACEBOOK_CLIENT_ID=<app-id>
   SUPABASE_AUTH_FACEBOOK_SECRET=<app-secret>
   ```

### 3.5 Chuyển sang Live mode (khi production)

Đầu app dashboard có toggle **App Mode: Development / Live**.

- **Development:** chỉ admin + tester (Roles → Roles → Testers) login được.
- **Live:** mọi user. Cần điền:
  - **Privacy Policy URL** (Settings → Basic)
  - **Data Deletion URL** hoặc **Data Deletion Instructions URL**

Chuyển sang Live khi đã có 2 URL trên.

### 3.6 Bật Facebook provider trên Supabase

Tương tự Google:

- **Local:** dùng env trong `config.toml`, restart Supabase.
- **Production:** Dashboard → Authentication → Providers → Facebook → bật → dán App ID + App Secret → Save.

---

## Bước 4 — Test login flow

### 4.1 Local

```bash
pnpm supabase:start
pnpm dev
```

Mở http://localhost:3000/login → click **"Đăng nhập với Google"** → consent screen → redirect về `/auth/callback` → nhảy sang `/dashboard` (hoặc `/onboarding` nếu lần đầu).

Lặp lại với **"Đăng nhập với Facebook"**.

### 4.2 Verify trong DB

```bash
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
  -c "select email, raw_app_meta_data->>'provider' from auth.users order by created_at desc limit 5;"
```

Output phải có `google` hoặc `facebook` ở cột provider.

### 4.3 Verify ho_so được tự tạo

```bash
psql -c "select email, ten_hien_thi, url_avatar from public.ho_so order by tao_luc desc limit 3;"
```

Phải có hàng mới với `ten_hien_thi` lấy từ provider metadata.

---

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Fix |
|---|---|---|
| `redirect_uri_mismatch` (Google) | URI trong Google Console không khớp callback Supabase | Copy đúng URL Bước 1, **không thêm `/` cuối**, save → đợi 5 phút Google propagate |
| `Error: Forbidden` (Google) khi consent screen | App đang Testing, user chưa trong test users | Thêm user vào danh sách Test users (Bước 2.4) |
| `URL Blocked` (Facebook) | App ở Development mode, user chưa là tester | Add user vào "Roles → Testers" hoặc Live mode (3.5) |
| Login xong mà `ho_so` không có row | Trigger `on_auth_user_created` chưa apply | Migration 02 chưa chạy. Kiểm tra: `\df public.tao_ho_so_khi_dang_ky` |
| Cookie không persist sau OAuth | `additional_redirect_urls` trong `config.toml` thiếu URL | Thêm vào → restart `pnpm supabase:stop && supabase:start` |
| `invalid_client` (Facebook) | App Secret sai hoặc env không load | Check `.env.local`, restart `pnpm dev` |
| Provider button không hiện | Provider chưa enable trong Supabase Dashboard | Dashboard → Authentication → Providers → bật |

---

## Tham khảo

- [Supabase Auth — OAuth providers](https://supabase.com/docs/guides/auth/social-login)
- [Google OAuth 2.0 setup](https://developers.google.com/identity/protocols/oauth2)
- [Facebook Login for Web](https://developers.facebook.com/docs/facebook-login/web)
