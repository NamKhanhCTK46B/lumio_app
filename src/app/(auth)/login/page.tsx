import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OAuthButtons } from "./_components/oauth-buttons";
import { EmailPasswordForm } from "./_components/email-password-form";
import { AuthLayout } from "../_components/auth-layout";

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
    <AuthLayout
      title="Chào mừng tới Lumio"
      description="Đăng nhập để bắt đầu học tiếng Anh với AI."
      error={error}
      info={info}
    >
      <OAuthButtons />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Hoặc</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      <EmailPasswordForm />

      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400">
          Quên mật khẩu?
        </Link>
        <Link href="/signup" className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400">
          Tạo tài khoản
        </Link>
      </div>

      <p className="text-center text-xs text-slate-500 dark:text-slate-400">
        Bằng việc đăng nhập, bạn đồng ý với Điều khoản dịch vụ và Chính sách quyền riêng tư của Lumio.
      </p>
    </AuthLayout>
  );
}
