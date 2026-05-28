import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { baiVietRepo, type BaiVietRow } from "@/lib/repositories/bai_viet.repo";
import { LineChart, BarChart } from "../_components/charts";

/**
 * UC15 — biểu đồ tiến độ viết essay.
 *
 * Hai chart:
 *  1. Line chart: band tổng theo thời gian (mỗi điểm = 1 bài đã nộp).
 *  2. Bar chart: trung bình TA/CC/LR/GR của 10 bài gần nhất.
 *
 * Dùng SVG tự render (không thêm dependency Recharts) — dataset nhỏ
 * (< 100 points), không cần animations / tooltips phức tạp. Khi cần
 * tính năng nâng cao, migrate sang Recharts sau.
 */

export default async function WriteProgressPage() {
  const supabase = await createClient();
  const danh_sach: BaiVietRow[] = await baiVietRepo.layLichSuChamDiem(supabase, 30);

  if (danh_sach.length === 0) {
    return (
      <div className="space-y-4">
        <Header />
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Bạn chưa có bài nào được chấm. <Link href="/write" className="underline">Viết bài đầu tiên →</Link>
        </p>
      </div>
    );
  }

  const line_data = danh_sach
    .filter((b) => b.diem_tong != null && b.nop_luc)
    .map((b) => ({
      x: new Date(b.nop_luc!).getTime(),
      y: Number(b.diem_tong!),
      label: new Date(b.nop_luc!).toLocaleDateString("vi-VN"),
    }));

  // Bar: trung bình 4 tiêu chí của 10 bài gần nhất.
  const lay_10 = danh_sach.slice(-10);
  const trung_binh = {
    TA: trungBinh(lay_10.map((b) => Number(b.score_task_achievement ?? 0))),
    CC: trungBinh(lay_10.map((b) => Number(b.score_coherence ?? 0))),
    LR: trungBinh(lay_10.map((b) => Number(b.score_lexical ?? 0))),
    GR: trungBinh(lay_10.map((b) => Number(b.score_grammar ?? 0))),
  };

  return (
    <div className="space-y-6">
      <Header />

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-medium text-slate-700">Band tổng theo thời gian</h2>
        <p className="text-xs text-slate-500">{line_data.length} bài đã nộp</p>
        <div className="mt-3">
          <LineChart data={line_data} max_y={9} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-medium text-slate-700">Trung bình 4 tiêu chí (10 bài gần nhất)</h2>
        <div className="mt-3">
          <BarChart
            data={[
              { label: "TA · Nội dung", value: trung_binh.TA },
              { label: "CC · Liên kết", value: trung_binh.CC },
              { label: "LR · Từ vựng", value: trung_binh.LR },
              { label: "GR · Ngữ pháp", value: trung_binh.GR },
            ]}
            max_value={9}
          />
        </div>
      </section>
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Tiến độ viết</h1>
        <p className="mt-1 text-sm text-slate-600">
          Theo dõi band score qua từng bài nộp.
        </p>
      </div>
      <Link href="/write" className="text-sm text-amber-700 hover:underline">
        ← Quay lại danh sách đề
      </Link>
    </header>
  );
}

function trungBinh(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sum = xs.reduce((a, b) => a + b, 0);
  return Math.round((sum / xs.length) * 10) / 10;
}
