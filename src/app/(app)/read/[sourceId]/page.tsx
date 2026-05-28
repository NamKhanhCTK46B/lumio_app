import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { contentRepo } from "@/lib/repositories/nguon_noi_dung.repo";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, BookOpenIcon } from "lucide-react";
import { ReaderClient } from "./_components/reader-client";

/**
 * Trang đọc nội dung — hiển thị transcript/đoạn văn,
 * cho phép click từ để lưu vào vocab.
 */
export default async function ReaderPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  const supabase = await createClient();

  const [nguon, doans] = await Promise.all([
    contentRepo.layNguon(supabase, sourceId),
    contentRepo.layDoan(supabase, sourceId),
  ]);

  if (!nguon) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/read">
          <Button variant="ghost" size="icon" aria-label="Quay lại">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="lm-h3 line-clamp-2">{nguon.tieu_de ?? "Đang đọc..."}</h1>
          <div className="flex flex-wrap gap-2 mt-1">
            {nguon.tac_gia && (
              <span className="text-sm text-muted-foreground">{nguon.tac_gia}</span>
            )}
            {nguon.ngon_ngu && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-lm-bg-muted">
                {nguon.ngon_ngu}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <ReaderClient
        sourceId={sourceId}
        content={doans.length > 0 ? doans.map((doan) => doan.noi_dung).join("\n\n") : nguon.ban_ghi_loi ?? ""}
      />
    </div>
  );
}
