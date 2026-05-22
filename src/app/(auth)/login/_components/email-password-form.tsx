import { dangNhapEmailAction } from "../actions";

/**
 * Form đăng nhập bằng email + password. Server Component thuần —
 * action chạy trên server, không cần Client Component cho form basic.
 *
 * Dùng cho user owner/admin tạo từ seed (vd. khanh51024@gmail.com).
 * User thông thường được khuyến khích đăng nhập qua OAuth ở trên.
 */
export function EmailPasswordForm() {
  return (
    <form action={dangNhapEmailAction} className="flex flex-col gap-3">
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
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-10 w-full rounded-md border border-slate-300 px-3 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
        />
      </label>

      <button
        type="submit"
        className="h-11 rounded-md bg-amber-500 text-sm font-medium text-white transition hover:bg-amber-600"
      >
        Đăng nhập
      </button>
    </form>
  );
}
