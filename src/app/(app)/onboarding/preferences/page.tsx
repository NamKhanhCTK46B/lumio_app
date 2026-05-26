import { createClient } from "@/lib/supabase/server";
import { hoSoRepo } from "@/lib/repositories/ho_so.repo";
import { OnboardingSteps } from "../_components/steps";
import { luuSoThichVaHoanTatAction } from "./actions";

/**
 * Bước cuối onboarding — đặt mục tiêu phút/ngày, múi giờ, theme. Pre-fill
 * múi giờ từ Intl API qua input default value sẽ là một fallback `Asia/Ho_Chi_Minh`
 * (server không có timezone client → để user tự chọn nếu khác).
 */
export default async function OnboardingPreferencesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const hoSo = await hoSoRepo.layHoSoHienTai(supabase);

  return (
    <div className="space-y-8">
      <OnboardingSteps current={3} />

      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Thiết lập học tập</h1>
        <p className="mt-2 text-sm text-slate-600">
          Bước cuối — đặt mục tiêu thời gian học mỗi ngày và lựa chọn giao diện.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={luuSoThichVaHoanTatAction} className="space-y-5">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">Mục tiêu hằng ngày (phút)</span>
          <input
            type="number"
            name="phut_moi_ngay"
            min={0}
            max={240}
            defaultValue={hoSo?.phut_moi_ngay ?? 15}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Lumio sẽ nhắc bạn duy trì học mỗi ngày để giữ streak.
          </span>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Múi giờ</span>
          <input
            type="text"
            name="mui_gio"
            defaultValue={hoSo?.mui_gio ?? "Asia/Ho_Chi_Minh"}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">Giao diện</span>
          <select
            name="chu_de_giao_dien"
            defaultValue={hoSo?.chu_de_giao_dien ?? "system"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          >
            <option value="system">Theo hệ thống</option>
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </select>
        </label>

        <div className="flex items-center justify-between pt-2">
          <a href="/onboarding/goals" className="text-sm text-slate-600 hover:text-slate-900">
            ← Quay lại mục tiêu
          </a>
          <button
            type="submit"
            className="rounded-md bg-amber-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
          >
            Hoàn tất, vào ứng dụng
          </button>
        </div>
      </form>
    </div>
  );
}
