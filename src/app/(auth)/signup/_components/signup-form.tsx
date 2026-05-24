import { dangKyAction } from "../actions";

/**
 * Form đăng ký tài khoản. Server Component — submit qua Server Action,
 * không cần client state. Validation rendering xảy ra ở server (qua
 * redirect ?error=...).
 */
export function SignupForm() {
  return (
    <form action={dangKyAction} className="flex flex-col gap-3">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">Tên hiển thị</span>
        <input
          type="text"
          name="ten_hien_thi"
          required
          maxLength={64}
          autoComplete="name"
          placeholder="Vd. Nguyễn Văn A"
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="ban@email.com"
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">Mật khẩu</span>
        <input
          type="password"
          name="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Yêu cầu: tối thiểu 8 ký tự, có chữ cái và số.
        </span>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">Nhập lại mật khẩu</span>
        <input
          type="password"
          name="password_confirm"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu vừa rồi"
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </label>

      <button
        type="submit"
        className="mt-2 h-11 rounded-md bg-amber-500 text-sm font-medium text-white transition hover:bg-amber-600"
      >
        Tạo tài khoản
      </button>
    </form>
  );
}
