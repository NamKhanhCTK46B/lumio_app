import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ResetForm } from "./_components/reset-form";
import { AuthLayout } from "../_components/auth-layout";

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
    <AuthLayout
      title="Đặt lại mật khẩu"
      description={`Chọn mật khẩu mới cho tài khoản ${user.email}.`}
      error={error}
    >
      <ResetForm />
    </AuthLayout>
  );
}
