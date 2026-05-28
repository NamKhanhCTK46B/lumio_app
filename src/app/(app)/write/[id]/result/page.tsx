import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { baiVietRepo, type ChuThichRow } from "@/lib/repositories/bai_viet.repo";
import { EssayFeedback } from "../../_components/essay-feedback";

/**
 * UC14 — Result page. Hiển thị:
 *  - 4 band score + tổng (UC14).
 *  - Nội dung gốc highlight inline theo `chu_thich_bai_viet`.
 *  - Tóm tắt phản hồi + bản viết lại.
 *
 * Tách rendering nặng (highlight + tooltip) vào client component
 * <EssayFeedback> để có thể tương tác (hover annotation).
 */
export default async function EssayResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const bai = await baiVietRepo.layBai(supabase, id);
  if (!bai) notFound();

  const chuThich: ChuThichRow[] = await baiVietRepo.layChuThich(supabase, id);

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Kết quả chấm bài</h1>
          <p className="mt-1 text-sm text-slate-600">{bai.de_bai_snapshot}</p>
        </div>
        <Link href="/write" className="text-sm text-amber-700 hover:underline">
          ← Viết bài mới
        </Link>
      </header>

      {bai.diem_tong != null ? (
        <EssayFeedback
          noi_dung={bai.noi_dung}
          diem_tong={Number(bai.diem_tong)}
          score_task_achievement={Number(bai.score_task_achievement ?? 0)}
          score_coherence={Number(bai.score_coherence ?? 0)}
          score_lexical={Number(bai.score_lexical ?? 0)}
          score_grammar={Number(bai.score_grammar ?? 0)}
          tom_tat_phan_hoi={bai.tom_tat_phan_hoi ?? ""}
          ban_viet_lai={bai.ban_viet_lai ?? ""}
          chu_thich={chuThich.map((c) => ({
            vi_tri_bat_dau: c.vi_tri_bat_dau,
            vi_tri_ket_thuc: c.vi_tri_ket_thuc,
            phan_loai: c.phan_loai,
            muc_do: c.muc_do,
            goi_y_sua: c.goi_y_sua ?? "",
            giai_thich: c.giai_thich ?? "",
          }))}
        />
      ) : (
        <p className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Bài chưa được chấm.
        </p>
      )}
    </div>
  );
}
