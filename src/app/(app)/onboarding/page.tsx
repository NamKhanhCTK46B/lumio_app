import { hoanTatOnboardAction } from "./actions";

/**
 * Onboarding placeholder. UC1 thật sẽ có:
 *  - Khảo sát mục tiêu (chọn loai_muc_tieu + diem_muc_tieu)
 *  - Placement test 10 câu sinh CEFR
 *  - Lưu vào muc_tieu_nd + bai_kiem_tra_trinh_do
 *
 * Hiện tại chỉ có 1 button "Hoàn tất" set timestamp để cho phép user vào app.
 */
export default function OnboardingPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Chào mừng tới Lumio!</h1>
        <p className="mt-2 text-sm text-slate-600">
          Đây là bước thiết lập ban đầu. Phiên bản đầy đủ sẽ có khảo sát mục tiêu
          và bài đánh giá trình độ. Tạm thời, bạn có thể vào ngay để khám phá.
        </p>
      </header>

      <form action={hoanTatOnboardAction}>
        <button
          type="submit"
          className="rounded-md bg-amber-500 px-6 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
        >
          Vào ứng dụng
        </button>
      </form>
    </div>
  );
}
