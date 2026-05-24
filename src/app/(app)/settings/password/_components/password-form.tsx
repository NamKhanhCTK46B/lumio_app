import { doiMatKhauAction } from "../actions";

/** Form đổi mật khẩu — 3 input + submit. */
export function PasswordForm() {
  return (
    <form action={doiMatKhauAction} className="flex flex-col gap-4">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">Mật khẩu hiện tại</span>
        <input
          type="password"
          name="current_password"
          required
          autoComplete="current-password"
          className={inputCls}
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">Mật khẩu mới</span>
        <input
          type="password"
          name="new_password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className={inputCls}
        />
        <span className="mt-1 block text-xs text-slate-500">
          Tối thiểu 8 ký tự, có chữ cái và số. Phải khác mật khẩu hiện tại.
        </span>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">Nhập lại mật khẩu mới</span>
        <input
          type="password"
          name="new_password_confirm"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className={inputCls}
        />
      </label>

      <div className="flex justify-end">
        <button
          type="submit"
          className="h-10 rounded-md bg-amber-500 px-6 text-sm font-medium text-white transition hover:bg-amber-600"
        >
          Đổi mật khẩu
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200";
