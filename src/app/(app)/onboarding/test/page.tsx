import { createClient } from "@/lib/supabase/server";
import { danhGiaRepo } from "@/lib/repositories/danh_gia.repo";
import { parseCauHoi, SO_CAU_TOI_DA } from "@/lib/ai/placement-grading";
import { OnboardingSteps } from "../_components/steps";
import {
  batDauHoacTiepTucAction,
  boQuaPlacementAction,
  traLoiCauHoiAction,
} from "./actions";

/**
 * UC5 — Placement test page. Hiển thị câu hỏi hiện tại (chưa trả lời),
 * progress dạng "Câu X/12", form 4 radio + submit.
 *
 * Nếu bài chưa có câu nào → render form "Bắt đầu". Server Action sinh
 * câu đầu rồi reload page.
 */
export default async function PlacementTestPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const bai = await danhGiaRepo.layBaiDangLam(supabase);
  const danhSach = bai ? await danhGiaRepo.layCauHoi(supabase, bai.id) : [];
  const cauChuaTraLoi = danhSach.find((c) => c.la_dap_an_dung === null);
  const cauHoi = cauChuaTraLoi ? parseCauHoi(cauChuaTraLoi.cau_hoi) : null;

  return (
    <div className="space-y-8">
      <OnboardingSteps current={1} />

      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Bài đánh giá trình độ</h1>
        <p className="mt-2 text-sm text-slate-600">
          Lumio sẽ hỏi 8–12 câu trắc nghiệm tiếng Anh để đề xuất lộ trình phù
          hợp với bạn. Chọn đáp án bạn thấy đúng nhất — không có giới hạn
          thời gian.
        </p>
      </header>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!bai || danhSach.length === 0 ? (
        <div className="space-y-3">
          <form action={batDauHoacTiepTucAction}>
            <button
              type="submit"
              className="rounded-md bg-amber-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
            >
              Bắt đầu bài đánh giá
            </button>
          </form>
          <form action={boQuaPlacementAction}>
            <button
              type="submit"
              className="text-xs text-slate-500 underline hover:text-slate-700"
            >
              Bỏ qua, mặc định B1
            </button>
          </form>
        </div>
      ) : cauChuaTraLoi && cauHoi ? (
        <article className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
            <span>
              Câu {cauChuaTraLoi.thu_tu} / tối đa {SO_CAU_TOI_DA}
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
              Mức {cauChuaTraLoi.trinh_do_du_kien}
            </span>
          </div>

          <p className="whitespace-pre-wrap text-sm text-slate-900">{cauHoi.cau_hoi}</p>

          <form action={traLoiCauHoiAction} className="mt-5 space-y-3">
            <input type="hidden" name="cau_hoi_id" value={cauChuaTraLoi.id} />
            {cauHoi.lua_chon.map((option, idx) => (
              <label
                key={idx}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 px-4 py-3 transition hover:border-amber-300"
              >
                <input
                  type="radio"
                  name="dap_an"
                  value={idx}
                  required
                  className="mt-1"
                />
                <span className="text-sm text-slate-800">
                  <strong className="mr-2">{String.fromCharCode(65 + idx)}.</strong>
                  {option}
                </span>
              </label>
            ))}
            <button
              type="submit"
              className="mt-2 rounded-md bg-amber-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
            >
              Trả lời
            </button>
          </form>
        </article>
      ) : (
        // Có bài + có câu, nhưng câu cuối đã trả lời mà chưa có câu kế
        // (LLM lỗi ở action trước). Cho user thử sinh lại.
        <form action={batDauHoacTiepTucAction}>
          <button
            type="submit"
            className="rounded-md bg-amber-500 px-6 py-2 text-sm font-medium text-white"
          >
            Tiếp tục
          </button>
        </form>
      )}
    </div>
  );
}
