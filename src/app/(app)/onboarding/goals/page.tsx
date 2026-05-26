import { createClient } from "@/lib/supabase/server";
import { mucTieuRepo } from "@/lib/repositories/muc_tieu.repo";
import { LOAI_MUC_TIEU_VALUES, NHAN_MUC_TIEU } from "@/lib/schemas/muc_tieu";
import { luuMucTieuAction } from "./actions";
import { OnboardingSteps } from "../_components/steps";

/**
 * UC6 — page chọn mục tiêu học. Hiển thị 8 loại mục tiêu kèm radio chọn
 * mục chính + ô điểm/deadline tuỳ chọn. Pre-fill nếu user đã chọn trước
 * (cho phép quay lại sửa).
 */
export default async function OnboardingGoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const danhSach = await mucTieuRepo.layDanhSach(supabase);
  const daChon = new Set(danhSach.map((m) => m.muc_tieu));
  const mucChinh = danhSach.find((m) => m.la_muc_tieu_chinh);

  return (
    <div className="space-y-8">
      <OnboardingSteps current={2} />

      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Mục tiêu học của bạn</h1>
        <p className="mt-2 text-sm text-slate-600">
          Chọn 1 hoặc nhiều mục tiêu để Lumio cá nhân hoá lộ trình. Đánh dấu
          1 mục là <strong>mục tiêu chính</strong>.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <form action={luuMucTieuAction} className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700">Chọn mục tiêu (1 trở lên)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {LOAI_MUC_TIEU_VALUES.map((mt) => (
              <label
                key={mt}
                className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 transition hover:border-amber-300"
              >
                <input
                  type="checkbox"
                  name="muc_tieu"
                  value={mt}
                  defaultChecked={daChon.has(mt)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-slate-800">{NHAN_MUC_TIEU[mt]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700">Mục tiêu chính</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {LOAI_MUC_TIEU_VALUES.map((mt) => (
              <label key={mt} className="flex items-center gap-3 text-sm text-slate-700">
                <input
                  type="radio"
                  name="muc_tieu_chinh"
                  value={mt}
                  defaultChecked={mucChinh?.muc_tieu === mt}
                  required
                />
                {NHAN_MUC_TIEU[mt]}
              </label>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            Mục chính phải nằm trong danh sách đã chọn ở trên.
          </p>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Điểm mục tiêu (tuỳ chọn)</span>
            <input
              type="number"
              name="diem_muc_tieu"
              min={0}
              max={990}
              step={0.5}
              defaultValue={mucChinh?.diem_muc_tieu ?? ""}
              placeholder="6.5 cho IELTS, 700 cho TOEIC..."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-slate-700">Hạn chót (tuỳ chọn)</span>
            <input
              type="date"
              name="han_chot"
              defaultValue={mucChinh?.han_chot ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <a
            href="/onboarding/test"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Quay lại bài đánh giá
          </a>
          <button
            type="submit"
            className="rounded-md bg-amber-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
          >
            Tiếp theo →
          </button>
        </div>
      </form>
    </div>
  );
}
