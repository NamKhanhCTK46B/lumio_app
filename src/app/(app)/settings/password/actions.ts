"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { DoiMatKhauSchema } from "@/lib/schemas/auth";

/**
 * Đổi mật khẩu user đang đăng nhập.
 *
 * Re-auth bằng signInWithPassword với current_password trước khi update.
 * Bước này KHÔNG dùng kiem_tra_mat_khau() ở DB vì:
 *  - encrypted_password sống ở `auth.users` (schema Supabase quản lý) —
 *    không truy cập trực tiếp được từ RLS-context client.
 *  - signInWithPassword đi qua GoTrue, an toàn + log audit.
 *
 * Nếu re-auth fail → trả lỗi "mật khẩu hiện tại sai".
 * Nếu re-auth OK → updateUser({ password: new }) → revalidate.
 */
export async function doiMatKhauAction(formData: FormData): Promise<void> {
  const parsed = DoiMatKhauSchema.safeParse({
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
    new_password_confirm: formData.get("new_password_confirm"),
  });

  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ";
    redirect(`/settings/password?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    throw new Error("Không có thông tin email user");
  }

  // Re-auth — verify current password đúng. signInWithPassword sẽ set
  // session mới nếu OK, nhưng session đó cùng user nên không gây issue.
  const verify = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  });

  if (verify.error) {
    redirect(
      "/settings/password?error=" +
        encodeURIComponent("Mật khẩu hiện tại không đúng."),
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.new_password,
  });

  if (error) {
    redirect(`/settings/password?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings/password");
  redirect(
    "/settings/password?ok=" + encodeURIComponent("Đã đổi mật khẩu thành công."),
  );
}
