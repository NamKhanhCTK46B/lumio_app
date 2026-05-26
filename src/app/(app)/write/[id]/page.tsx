import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { baiVietRepo } from "@/lib/repositories/bai_viet.repo";
import { EssayEditor } from "../_components/essay-editor";

/**
 * UC13 — editor page. Server Component fetch bài viết, đẩy nội dung
 * khởi tạo + de_bai vào client component <EssayEditor>.
 *
 * Nếu bài đã nộp (`nop_luc` không null) → redirect tới /result để user
 * không vô tình edit + nộp lại (sẽ overwrite điểm cũ).
 */
export default async function EssayEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const bai = await baiVietRepo.layBai(supabase, id);

  if (!bai) notFound();
  if (bai.nop_luc) redirect(`/write/${id}/result`);

  return (
    <EssayEditor
      bai_viet_id={bai.id}
      loai_de={bai.loai_de}
      de_bai={bai.de_bai_snapshot}
      noi_dung_ban_dau={bai.noi_dung}
      thoi_gian_ban_dau={bai.thoi_gian_lam_giay ?? 0}
      error={error}
    />
  );
}
