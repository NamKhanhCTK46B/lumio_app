import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./_components/reset-form";

/**
 * Trang đặt lại mật khẩu sau khi click link reset từ email.
 *
 * Tiền điều kiện: user phải có session "recovery" (Supabase set sau khi
 * /auth/callback exchange code). Nếu không có session → link hết hạn
 * hoặc invalid → redirect /login với thông báo lỗi.
 */
type Props = { searchParams: Promise<{ error?: string }> };

export default async function ResetPasswordPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/login?error=" +
        encodeURIComponent(
          "Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu lại.",
        ),
    );
  }

  const { error } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Đặt lại mật khẩu</h1>
          <p className="text-sm text-slate-600">
            Chọn mật khẩu mới cho tài khoản <strong>{user.email}</strong>.
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

        <ResetForm />
      </div>
    </main>
  );
}
