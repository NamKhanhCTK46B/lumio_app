import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { baiVietRepo } from "@/lib/repositories/bai_viet.repo";
import { taoNhapAction } from "./actions";

/**
 * UC13 — trang /write index. Liệt kê:
 *  1. Đề bài catalog để bắt đầu mới (theo loai_de).
 *  2. Bài viết gần đây (nháp + đã nộp) để tiếp tục.
 *  3. Link sang biểu đồ tiến độ (UC15).
 */

const NHAN_LOAI_DE: Record<"ielts_task1" | "ielts_task2" | "email" | "tu_do", string> = {
  ielts_task1: "IELTS Task 1",
  ielts_task2: "IELTS Task 2",
  email: "Email",
  tu_do: "Tự do",
};

export default async function WriteIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [danhSachDe, ganDay] = await Promise.all([
    baiVietRepo.layDanhSachDe(supabase),
    baiVietRepo.layGanDay(supabase, 5),
  ]);

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Luyện viết</h1>
          <p className="mt-1 text-sm text-slate-600">
            Viết essay theo đề IELTS hoặc email. AI sẽ chấm theo rubric IELTS Writing.
          </p>
        </div>
        <Link
          href="/write/progress"
          className="text-sm text-amber-700 hover:text-amber-900 hover:underline"
        >
          Xem biểu đồ tiến độ →
        </Link>
      </header>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {ganDay.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-slate-700">Tiếp tục bài gần đây</h2>
          <ul className="mt-3 grid gap-2">
            {ganDay.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-4 py-3"
              >
                <Link
                  href={b.nop_luc ? `/write/${b.id}/result` : `/write/${b.id}`}
                  className="min-w-0 flex-1 truncate text-sm text-slate-800 hover:text-amber-700"
                >
                  <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                    {NHAN_LOAI_DE[b.loai_de as keyof typeof NHAN_LOAI_DE] ?? b.loai_de}
                  </span>
                  {b.de_bai_snapshot}
                </Link>
                <div className="ml-3 shrink-0 text-xs text-slate-500">
                  {b.nop_luc ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                      Band {b.diem_tong?.toFixed(1) ?? "?"}
                    </span>
                  ) : (
                    <span>Nháp · {b.so_tu} từ</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium text-slate-700">Chọn đề mới</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {danhSachDe.map((de) => (
            <li
              key={de.id}
              className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-amber-50 px-2 py-0.5 text-amber-700">
                  {NHAN_LOAI_DE[de.loai_de] ?? de.loai_de}
                </span>
                {de.cefr_phu_hop && (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-600">
                    {de.cefr_phu_hop}
                  </span>
                )}
                {de.chu_de && <span className="text-slate-500">· {de.chu_de}</span>}
              </div>
              <p className="text-sm text-slate-800">{de.de_bai}</p>
              <form action={taoNhapAction} className="mt-1">
                <input type="hidden" name="de_bai_id" value={de.id} />
                <input type="hidden" name="loai_de" value={de.loai_de} />
                <button
                  type="submit"
                  className="text-xs font-medium text-amber-700 hover:text-amber-900 hover:underline"
                >
                  Bắt đầu viết →
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-md border border-dashed border-slate-300 bg-white p-4">
        <h2 className="text-sm font-medium text-slate-700">Hoặc viết theo đề tự do</h2>
        <form action={taoNhapAction} className="mt-3 space-y-3">
          <input type="hidden" name="loai_de" value="tu_do" />
          <textarea
            name="de_bai_tu_do"
            placeholder="Nhập đề bài bạn muốn viết..."
            rows={3}
            required
            minLength={10}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600"
          >
            Bắt đầu
          </button>
        </form>
      </section>
    </div>
  );
}
