import Link from "next/link";

/**
 * Trang xác nhận đã gửi liên kết reset.
 * KHÔNG hiển thị email (để chống user enumeration — page này hiển thị
 * giống nhau dù email có tồn tại trong DB hay không).
 */
export default function DaGuiPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
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
            className="text-emerald-600"
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <header className="space-y-2 text-center">
          <h1 className="text-xl font-semibold text-slate-900">Đã gửi liên kết</h1>
          <p className="text-sm text-slate-600">
            Nếu email bạn nhập có tài khoản tại Lumio, chúng tôi đã gửi liên kết
            đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (cả mục Spam).
          </p>
        </header>

        <p className="text-center text-sm">
          <Link href="/login" className="text-amber-600 hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
