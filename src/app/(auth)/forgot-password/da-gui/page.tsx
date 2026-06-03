import Link from "next/link";
import Image from "next/image";

/**
 * Trang xác nhận đã gửi liên kết reset.
 * KHÔNG hiển thị email (để chống user enumeration — page này hiển thị
 * giống nhau dù email có tồn tại trong DB hay không).
 */
export default function DaGuiPage() {
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

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/20">
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
            className="text-emerald-600 dark:text-emerald-400"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <header className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Đã gửi liên kết</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Nếu email bạn nhập có tài khoản tại Lumio, chúng tôi đã gửi liên kết
            đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (cả mục Spam).
          </p>
        </header>

        <p className="text-center text-sm">
          <Link href="/login" className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
