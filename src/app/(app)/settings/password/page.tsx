import { PasswordForm } from "./_components/password-form";

/** Trang đổi mật khẩu. Auth check do (app)/layout đảm nhận. */
type Props = { searchParams: Promise<{ ok?: string; error?: string }> };

export default async function PasswordPage({ searchParams }: Props) {
  const { ok, error } = await searchParams;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">Đổi mật khẩu</h1>
        <p className="text-sm text-muted-foreground">
          Vì lý do bảo mật, bạn cần nhập mật khẩu hiện tại để xác nhận.
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
        <PasswordForm />
      </section>
    </div>
  );
}
