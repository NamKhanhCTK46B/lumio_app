import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./_components/signup-form";
import { AuthLayout } from "../_components/auth-layout";

/**
 * Trang đăng ký tài khoản. Nếu user đã đăng nhập sẵn → /dashboard
 * (cùng pattern với /login để tránh re-signup).
 */
type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function SignupPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <AuthLayout
      title="Tạo tài khoản Lumio"
      description="Bắt đầu hành trình học tiếng Anh cùng AI."
      error={error}
    >
      <SignupForm />

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Đã có tài khoản?{" "}
        <Link href="/login" className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400">
          Đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
