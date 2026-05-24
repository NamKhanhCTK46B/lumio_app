import { quenMatKhauAction } from "../actions";

/** Form 1 input email — gửi link reset. */
export function ForgotForm() {
  return (
    <form action={quenMatKhauAction} className="flex flex-col gap-3">
      <label className="block text-sm">
        <span className="mb-1 block text-slate-700">Email tài khoản</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="ban@email.com"
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </label>

      <button
        type="submit"
        className="h-11 rounded-md bg-amber-500 text-sm font-medium text-white transition hover:bg-amber-600"
      >
        Gửi liên kết đặt lại
      </button>
    </form>
  );
}
