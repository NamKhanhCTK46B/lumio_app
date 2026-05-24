import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./_components/signup-form";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Tạo tài khoản Lumio</h1>
          <p className="text-sm text-slate-600">
            Bắt đầu hành trình học tiếng Anh cùng AI.
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

        <SignupForm />

        <p className="text-center text-sm text-slate-600">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-amber-600 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </main>
  );
}
