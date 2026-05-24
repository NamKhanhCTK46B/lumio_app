import { PasswordForm } from "./_components/password-form";

/** Trang đổi mật khẩu. Auth check do (app)/layout đảm nhận. */
type Props = { searchParams: Promise<{ ok?: string; error?: string }> };

export default async function PasswordPage({ searchParams }: Props) {
  const { ok, error } = await searchParams;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Đổi mật khẩu</h1>
        <p className="text-sm text-slate-600">
          Vì lý do bảo mật, bạn cần nhập mật khẩu hiện tại để xác nhận.
        </p>
      </header>

      {ok ? (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {decodeURIComponent(ok)}
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {decodeURIComponent(error)}
        </div>
      ) : null}

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <PasswordForm />
      </section>
    </div>
  );
}
