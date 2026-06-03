import { createClient } from "@/lib/supabase/server";
import { mucTieuRepo, type MucTieuRow } from "@/lib/repositories/muc_tieu.repo";
import { LOAI_MUC_TIEU_VALUES, NHAN_MUC_TIEU } from "@/lib/schemas/muc_tieu";
import { luuMucTieuAction } from "./actions";
import { OnboardingSteps } from "../_components/steps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function OnboardingGoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const danhSach: MucTieuRow[] = await mucTieuRepo.layDanhSach(supabase);
  const daChon = new Set(danhSach.map((m) => m.muc_tieu));
  const mucChinh = danhSach.find((m) => m.la_muc_tieu_chinh);

  return (
    <div className="space-y-8">
      <OnboardingSteps current={2} />

      <header>
        <h1 className="text-2xl font-semibold text-lm-fg">Mục tiêu học của bạn</h1>
        <p className="mt-2 text-sm text-lm-fg-muted">
          Chọn 1 hoặc nhiều mục tiêu để Lumio cá nhân hoá lộ trình. Đánh dấu 1 mục là <strong>mục tiêu chính</strong>.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-lm-danger/30 bg-lm-danger-soft px-4 py-2 text-sm text-lm-danger-ink">
          {error}
        </div>
      )}

      <form action={luuMucTieuAction} className="space-y-6">
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-lm-fg">Chọn mục tiêu (1 trở lên)</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {LOAI_MUC_TIEU_VALUES.map((mt) => (
              <label
                key={mt}
                className="flex items-center gap-3 rounded-md border border-lm-border bg-lm-bg-elev-1 px-4 py-3 transition hover:border-lm-border-strong"
              >
                <input
                  type="checkbox"
                  name="muc_tieu"
                  value={mt}
                  defaultChecked={daChon.has(mt)}
                  className="h-4 w-4"
                />
                <span className="text-sm text-lm-fg">{NHAN_MUC_TIEU[mt]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-lm-fg">Mục tiêu chính</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {LOAI_MUC_TIEU_VALUES.map((mt) => (
              <label key={mt} className="flex items-center gap-3 text-sm text-lm-fg">
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
          <p className="text-xs text-lm-fg-muted">
            Mục chính phải nằm trong danh sách đã chọn ở trên.
          </p>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="diem_muc_tieu">Điểm mục tiêu (tuỳ chọn)</Label>
            <Input
              id="diem_muc_tieu"
              type="number"
              name="diem_muc_tieu"
              min={0}
              max={990}
              step={0.5}
              defaultValue={mucChinh?.diem_muc_tieu ?? ""}
              placeholder="6.5 cho IELTS, 700 cho TOEIC..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="han_chot">Hạn chót (tuỳ chọn)</Label>
            <Input
              id="han_chot"
              type="date"
              name="han_chot"
              defaultValue={mucChinh?.han_chot ?? ""}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <a href="/onboarding/test" className="text-sm text-lm-fg-muted hover:text-lm-fg">
            ← Quay lại bài đánh giá
          </a>
          <Button type="submit">Tiếp theo →</Button>
        </div>
      </form>
    </div>
  );
}
