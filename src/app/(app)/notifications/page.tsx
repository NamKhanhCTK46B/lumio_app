import { createClient } from "@/lib/supabase/server";
import { thongBaoRepo } from "@/lib/repositories/thong_bao.repo";
import { BellIcon, CheckIcon } from "lucide-react";
import { danhDauDaDocAction } from "./actions";

/**
 * UC19 — trang /notifications. Liệt kê thông báo, cho phép đánh dấu đã đọc.
 */
export default async function NotificationsPage() {
  const supabase = await createClient();
  const thongBaos = await thongBaoRepo.layDanhSach(supabase);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Thông báo
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Cập nhật hoạt động học tập và nhắc nhở.
          </p>
        </div>
        {thongBaos.some((t) => !t.doc_luc) && (
          <form action={danhDauDaDocAction}>
            <input type="hidden" name="tatCa" value="true" />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Đánh dấu tất cả đã đọc
            </button>
          </form>
        )}
      </div>

      {thongBaos.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <BellIcon className="mx-auto h-8 w-8 text-slate-400" />
          <p className="mt-2 text-sm text-slate-500">
            Bạn chưa có thông báo nào.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {thongBaos.map((tb) => (
            <li
              key={tb.id}
              className={`rounded-lg border p-4 transition ${
                tb.doc_luc
                  ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {tb.tieu_de}
                  </p>
                  {tb.noi_dung && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      {tb.noi_dung}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    {tb.tao_luc
                      ? new Date(tb.tao_luc).toLocaleDateString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </p>
                </div>
                {!tb.doc_luc && (
                  <form action={danhDauDaDocAction}>
                    <input type="hidden" name="thongBaoId" value={tb.id} />
                    <button
                      type="submit"
                      className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                    >
                      Đã đọc
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
