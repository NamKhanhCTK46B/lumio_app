import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { OnboardingSteps } from "../../_components/steps";

/**
 * Trang kết quả placement test. Đọc kết quả từ bài kiểm tra mới nhất
 * (đã hoàn tất) của user. Hiển thị CEFR + confidence + nút sang
 * /onboarding/goals.
 */
export default async function KetQuaPage() {
  const supabase = await createClient();

  // Lấy bài hoàn tất gần nhất — RLS đảm bảo chỉ của user hiện tại.
  const { data: bai } = await supabase
    .from("bai_kiem_tra_trinh_do")
    .select("trinh_do_ket_qua, do_tin_ket_qua, diem_tho, hoan_thanh_luc")
    .not("hoan_thanh_luc", "is", null)
    .order("hoan_thanh_luc", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="space-y-8">
      <OnboardingSteps current={1} />

      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Kết quả đánh giá</h1>
        <p className="mt-2 text-sm text-slate-600">
          Dựa trên các câu trả lời của bạn, Lumio đề xuất trình độ:
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-700">CEFR</p>
          <p className="mt-1 text-3xl font-semibold text-amber-900">
            {bai?.trinh_do_ket_qua ?? "—"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Độ tin cậy</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {bai?.do_tin_ket_qua != null
              ? `${Math.round(bai.do_tin_ket_qua * 100)}%`
              : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Điểm thô</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">
            {bai?.diem_tho ?? "—"}/100
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-600">
        Bạn có thể làm lại bài đánh giá sau 60 ngày để cập nhật trình độ.
      </p>

      <div className="flex justify-end">
        <Link
          href="/onboarding/goals"
          className="rounded-md bg-amber-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
        >
          Tiếp theo: Đặt mục tiêu →
        </Link>
      </div>
    </div>
  );
}
