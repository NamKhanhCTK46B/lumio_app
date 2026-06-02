import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { vocabRepo } from "@/lib/repositories/vocab.repo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, BookOpenIcon, PlusIcon } from "lucide-react";
import { VocabListClient } from "./_components/vocab-list-client";

/**
 * Trang chi tiết bộ từ — liệt kê từ trong bộ.
 */
export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  const supabase = await createClient();

  const [deck, tuList, soTuTrongBo] = await Promise.all([
    vocabRepo.layBoTu(supabase, deckId),
    vocabRepo.danhSachTu(supabase, deckId),
    vocabRepo.demTuTrongBo(supabase, deckId),
  ]);

  if (!deck) notFound();

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link href="/vocab">
          <Button variant="ghost" size="icon" aria-label="Quay lại">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="lm-h3">{deck.ten}</h1>
          {deck.mo_ta && (
            <p className="text-sm text-muted-foreground">{deck.mo_ta}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href={`/vocab/${deckId}/review`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <BookOpenIcon className="h-3.5 w-3.5" />
              Ôn từ
            </Button>
          </Link>
          <Link href={`/vocab/${deckId}/add`}>
            <Button size="sm" className="gap-1.5">
              <PlusIcon className="h-3.5 w-3.5" />
              Thêm từ
            </Button>
          </Link>
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-2">
        {deck.chu_de && <Badge variant="outline">{deck.chu_de}</Badge>}
        {deck.la_he_thong && <Badge variant="secondary">Bộ hệ thống</Badge>}
        <Badge variant="outline">{soTuTrongBo} từ</Badge>
        {deck.cefr_phu_hop && (
          <Badge
            className="text-white"
            style={{ backgroundColor: `var(--lm-cefr-${deck.cefr_phu_hop.toLowerCase()})` }}
          >
            {deck.cefr_phu_hop}
          </Badge>
        )}
      </div>

      {/* Word list */}
      {tuList.length === 0 ? (
        <Card className="py-12 text-center">
          <CardContent className="space-y-3">
            <p className="text-muted-foreground">Chưa có từ nào trong bộ này.</p>
            <Link href={`/vocab/${deckId}/add`}>
              <Button variant="outline" size="sm">
                <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
                Thêm từ đầu tiên
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <VocabListClient key={deckId} words={tuList} deckId={deckId} />
      )}
    </div>
  );
}
