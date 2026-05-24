import Link from "next/link";

/**
 * Trang chờ xác minh email sau khi signup.
 * Server Component — chỉ hiển thị thông tin tĩnh, không cần fetch session.
 *
 * Local dev: Supabase gửi mail tới Mailpit (port 54324).
 * Production: cấu hình SMTP riêng trong Supabase Dashboard.
 */
type Props = {
  searchParams: Promise<{ email?: string }>;
};

export default async function ChoXacMinhPage({ searchParams }: Props) {
  const { email } = await searchParams;
  const emailDisplay = email ? decodeURIComponent(email) : "địa chỉ email của bạn";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mx-auto">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-600"
            aria-hidden
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <header className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Kiểm tra email của bạn</h1>
          <p className="text-sm text-slate-600">
            Lumio đã gửi liên kết xác minh đến{" "}
            <strong className="font-semibold text-slate-900">{emailDisplay}</strong>.
            Vui lòng mở email và click vào liên kết để kích hoạt tài khoản.
          </p>
        </header>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
          <p className="mb-1 font-medium text-slate-700">Đang chạy local dev?</p>
          <p>
            Mở Mailpit tại{" "}
            <a
              href="http://127.0.0.1:54324"
              target="_blank"
              rel="noreferrer"
              className="text-amber-600 hover:underline"
            >
              http://127.0.0.1:54324
            </a>{" "}
            để xem mọi email được gửi.
          </p>
        </div>

        <p className="text-center text-sm">
          <Link href="/login" className="text-amber-600 hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
