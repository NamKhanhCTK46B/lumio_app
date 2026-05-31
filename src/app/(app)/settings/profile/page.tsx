import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hoSoRepo } from "@/lib/repositories/ho_so.repo";
import { ProfileForm } from "./_components/profile-form";
import { AvatarUploader } from "./_components/avatar-uploader";

/**
 * Trang chỉnh sửa hồ sơ cá nhân. Server Component — fetch hồ sơ qua
 * repository, truyền pre-fill cho form. Mutation đi qua Server Action.
 */
type Props = { searchParams: Promise<{ ok?: string; error?: string }> };

export default async function ProfilePage({ searchParams }: Props) {
  const supabase = await createClient();
  const hoSo = await hoSoRepo.layHoSoHienTai(supabase);

  // Defensive: nếu trigger on_auth_user_created chưa chạy (hiếm), redirect login.
  if (!hoSo) {
    redirect("/login?error=" + encodeURIComponent("Không tìm thấy hồ sơ. Vui lòng đăng nhập lại."));
  }

  const { ok, error } = await searchParams;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Hồ sơ cá nhân</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý thông tin hiển thị và tuỳ chỉnh học tập.
        </p>
      </header>

      {ok ? (
        <div
          role="status"
          className="rounded-lg border border-lm-success/30 bg-lm-success-soft px-4 py-3 text-sm text-lm-success-ink"
        >
          {decodeURIComponent(ok)}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-lm-danger/30 bg-lm-danger-soft px-4 py-3 text-sm text-lm-danger-ink"
        >
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground">
        <h2 className="mb-4 text-base font-medium text-card-foreground">Ảnh đại diện</h2>
        <AvatarUploader
          hientai_url={hoSo.url_avatar}
          ten_hien_thi={hoSo.ten_hien_thi ?? hoSo.email ?? ""}
        />
      </section>

      <section className="rounded-lg border border-border bg-card p-6 text-card-foreground">
        <h2 className="mb-4 text-base font-medium text-card-foreground">Thông tin cá nhân</h2>
        <ProfileForm hoSo={hoSo} />
      </section>

      <p className="text-xs text-muted-foreground">
        Email: <strong>{hoSo.email}</strong> · Để thay đổi email, liên hệ hỗ trợ.
      </p>
    </div>
  );
}
