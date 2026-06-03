import { createClient } from "@/lib/supabase/server";
import { hoSoRepo } from "@/lib/repositories/ho_so.repo";
import { OnboardingSteps } from "../_components/steps";
import { luuSoThichVaHoanTatAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

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
        <h1 className="text-2xl font-semibold text-lm-fg">Thiết lập học tập</h1>
        <p className="mt-2 text-sm text-lm-fg-muted">
          Bước cuối — đặt mục tiêu thời gian học mỗi ngày và lựa chọn giao diện.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-lm-danger/30 bg-lm-danger-soft px-4 py-2 text-sm text-lm-danger-ink">
          {error}
        </div>
      )}

      <form action={luuSoThichVaHoanTatAction} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="phut_moi_ngay">Mục tiêu hằng ngày (phút)</Label>
          <Input
            id="phut_moi_ngay"
            type="number"
            name="phut_moi_ngay"
            min={0}
            max={240}
            defaultValue={hoSo?.phut_moi_ngay ?? 15}
            required
          />
          <p className="text-xs text-lm-fg-muted">
            Lumio sẽ nhắc bạn duy trì học mỗi ngày để giữ streak.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="mui_gio">Múi giờ</Label>
          <Input
            id="mui_gio"
            type="text"
            name="mui_gio"
            defaultValue={hoSo?.mui_gio ?? "Asia/Ho_Chi_Minh"}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chu_de_giao_dien">Giao diện</Label>
          <NativeSelect
            id="chu_de_giao_dien"
            name="chu_de_giao_dien"
            defaultValue={hoSo?.chu_de_giao_dien ?? "system"}
          >
            <option value="system">Theo hệ thống</option>
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </NativeSelect>
        </div>

        <div className="flex items-center justify-between pt-2">
          <a href="/onboarding/goals" className="text-sm text-lm-fg-muted hover:text-lm-fg">
            ← Quay lại mục tiêu
          </a>
          <Button type="submit">Hoàn tất, vào ứng dụng</Button>
        </div>
      </form>
    </div>
  );
}
