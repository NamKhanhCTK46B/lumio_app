import { datLaiMatKhauAction } from "../actions";

/** Form đặt mật khẩu mới sau khi click link từ email. */
export function ResetForm() {
  return (
    <form action={datLaiMatKhauAction} className="flex flex-col gap-3">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">Mật khẩu mới</span>
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
        <span className="mb-1 block text-slate-700">Nhập lại mật khẩu mới</span>
        <input
          type="password"
          name="password_confirm"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </label>

      <button
        type="submit"
        className="mt-2 h-11 rounded-md bg-amber-500 text-sm font-medium text-white transition hover:bg-amber-600"
      >
        Đặt lại mật khẩu
      </button>
    </form>
  );
}
