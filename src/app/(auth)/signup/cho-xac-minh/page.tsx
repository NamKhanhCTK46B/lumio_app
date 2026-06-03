import Link from "next/link";
import Image from "next/image";

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
    <main className="relative flex min-h-screen items-center justify-center bg-[#FBF9F5] dark:bg-[#0E1626] px-4">
      {/* Radial glow decoration */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(232,163,61,.12), transparent 60%)'
        }}
      />

      <div className="w-full max-w-md space-y-8 rounded-2xl border border-amber-100 dark:border-amber-900/20 bg-white dark:bg-slate-900 p-8 sm:p-10 shadow-md">
        {/* Logo */}
        <div className="flex justify-center">
          <Image
            src="/logo-wordmark.svg"
            alt="Lumio"
            width={120}
            height={32}
            className="h-8 w-auto dark:invert"
            priority
          />
        </div>

        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/20 mx-auto">
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
            className="text-amber-600 dark:text-amber-400"
            aria-hidden
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        <header className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Kiểm tra email của bạn</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Lumio đã gửi liên kết xác minh đến{" "}
            <strong className="font-semibold text-slate-900 dark:text-slate-50">{emailDisplay}</strong>.
            Vui lòng mở email và click vào liên kết để kích hoạt tài khoản.
          </p>
        </header>

        <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 text-xs text-slate-600 dark:text-slate-400">
          <p className="mb-1 font-medium text-slate-700 dark:text-slate-300">Đang chạy local dev?</p>
          <p>
            Mở Mailpit tại{" "}
            <a
              href="http://127.0.0.1:54324"
              target="_blank"
              rel="noreferrer"
              className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400"
            >
              http://127.0.0.1:54324
            </a>{" "}
            để xem mọi email được gửi.
          </p>
        </div>

        <p className="text-center text-sm">
          <Link href="/login" className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
