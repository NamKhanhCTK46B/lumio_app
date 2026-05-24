import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OAuthButtons } from "./_components/oauth-buttons";
import { EmailPasswordForm } from "./_components/email-password-form";

/**
 * Trang đăng nhập. Mặc định là Server Component — kiểm tra session sẵn có,
 * đẩy thẳng vào dashboard nếu user đã đăng nhập trước đó.
 *
 * Hỗ trợ ?error=... từ /auth/callback để hiển thị message lỗi rõ ràng.
 */
type Props = {
  searchParams: Promise<{ error?: string; info?: string; next?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const { error, info } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Chào mừng tới Lumio</h1>
          <p className="text-sm text-slate-600">
            Đăng nhập để bắt đầu học tiếng Anh với AI.
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

        {info ? (
          <div
            role="status"
            className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            {decodeURIComponent(info)}
          </div>
        ) : null}

        <OAuthButtons />

        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs uppercase tracking-wide text-slate-400">Hoặc</span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <EmailPasswordForm />

        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-amber-600 hover:underline">
            Quên mật khẩu?
          </Link>
          <Link href="/signup" className="text-amber-600 hover:underline">
            Tạo tài khoản
          </Link>
        </div>

        <p className="text-center text-xs text-slate-500">
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của Lumio.
        </p>
      </div>
    </main>
  );
}
