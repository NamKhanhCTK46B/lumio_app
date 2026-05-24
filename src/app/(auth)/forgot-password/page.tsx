import Link from "next/link";
import { ForgotForm } from "./_components/forgot-form";

/** Trang yêu cầu reset password. */
type Props = { searchParams: Promise<{ error?: string }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Quên mật khẩu?</h1>
          <p className="text-sm text-slate-600">
            Nhập email tài khoản, Lumio sẽ gửi liên kết để đặt lại mật khẩu.
          </p>
        </header>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {decodeURIComponent(error)}
          </div>
        ) : null}

        <ForgotForm />

        <p className="text-center text-sm">
          <Link href="/login" className="text-amber-600 hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
