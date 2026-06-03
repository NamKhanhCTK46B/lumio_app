import Link from "next/link";
import { ForgotForm } from "./_components/forgot-form";
import { AuthLayout } from "../_components/auth-layout";

/** Trang yêu cầu reset password. */
type Props = { searchParams: Promise<{ error?: string }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <AuthLayout
      title="Quên mật khẩu?"
      description="Nhập email tài khoản, Lumio sẽ gửi liên kết để đặt lại mật khẩu."
      error={error}
    >
      <ForgotForm />

      <p className="text-center text-sm">
        <Link href="/login" className="text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400">
          ← Quay lại đăng nhập
        </Link>
      </p>
    </AuthLayout>
  );
}
