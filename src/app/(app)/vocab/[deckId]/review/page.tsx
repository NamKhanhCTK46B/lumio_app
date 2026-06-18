import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { vocabRepo } from "@/lib/repositories/vocab.repo";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, BookOpenIcon } from "lucide-react";
import { ReviewSessionClient } from "../../review/_components/review-session-client";

/**
 * Trang ôn từ — hiển thị danh sách từ cần ôn hoặc redirect
 * nếu deckId được truyền.
 */
export default async function VocabReviewPage({
  params,
}: {
  params: Promise<{ deckId?: string }>;
}) {
  const { deckId } = await params;
  const supabase = await createClient();

  let deckName: string | null = null;
  const tuCanOn = await vocabRepo.layTuCanOn(supabase, 20, deckId);

  if (deckId) {
    const deck = await vocabRepo.layBoTu(supabase, deckId);
    if (!deck) notFound();
    deckName = deck.ten;
  }

  const tongSo = tuCanOn.length;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        {deckId ? (
          <Link href={`/vocab/${deckId}`}>
            <Button variant="ghost" size="icon" aria-label="Quay lại">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/vocab">
            <Button variant="ghost" size="icon" aria-label="Quay lại">
              <ArrowLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <div>
          <h1 className="lm-h3">Ôn từ vựng</h1>
          <p className="text-sm text-muted-foreground">
            {tongSo > 0
              ? `${tongSo} từ cần ôn${deckName ? ` trong ${deckName}` : " hôm nay"}`
              : "Không có từ nào cần ôn hôm nay!"}
          </p>
        </div>
      </div>

      {tongSo === 0 ? (
        <div className="py-16 text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-lm-success" />
          <p className="mt-4 text-lg font-medium">Tuyệt vời!</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Bạn đã ôn hết từ cần ôn hôm nay.
          </p>
          <Link href="/vocab" className="mt-6 inline-block">
            <Button variant="outline" size="sm">
              Quay lại từ vựng
            </Button>
          </Link>
        </div>
      ) : (
        <ReviewSessionClient words={tuCanOn} backHref={`/vocab/${deckId}`} />
      )}
    </div>
  );
}
