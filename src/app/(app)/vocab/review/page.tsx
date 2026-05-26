import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { vocabRepo } from "@/lib/repositories/vocab.repo";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, BookOpenIcon } from "lucide-react";
import { ReviewSessionClient } from "./_components/review-session-client";

/**
 * Trang ôn từ tổng hợp — tất cả từ cần ôn (không lọc theo deck).
 */
export default async function VocabReviewPage() {
  const supabase = await createClient();
  const tuCanOn = await vocabRepo.layTuCanOn(supabase, 20);
  const tongSo = tuCanOn.length;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/vocab">
          <Button variant="ghost" size="icon" aria-label="Quay lại">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="lm-h3">Ôn từ vựng</h1>
          <p className="text-sm text-muted-foreground">
            {tongSo > 0
              ? `${tongSo} từ cần ôn hôm nay`
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
        <ReviewSessionClient words={tuCanOn} />
      )}
    </div>
  );
}
