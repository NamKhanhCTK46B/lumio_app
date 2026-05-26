import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { vocabRepo } from "@/lib/repositories/vocab.repo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusIcon, BookOpenIcon } from "lucide-react";
import { TaoBoTuDialog } from "./_components/tao-bo-tu-dialog";

/**
 * Trang danh sách bộ từ vựng.
 * Server Component — fetch trực tiếp, RLS tự filter.
 */
export default async function VocabPage() {
  const supabase = await createClient();
  const [boTuList, thongKe] = await Promise.all([
    vocabRepo.danhSachBoTu(supabase),
    vocabRepo.thongKe(supabase),
  ]);

  const userDecks = boTuList.filter((d) => !d.la_he_thong);
  const systemDecks = boTuList.filter((d) => d.la_he_thong);

  return (
    <div className="space-y-8">
      {/* Header + Stats */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="lm-h2">Từ vựng</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Học và ôn từ vựng với spaced repetition
          </p>
        </div>
        <Link href="/vocab/review">
          <Button variant="default" size="sm" className="gap-2">
            <BookOpenIcon className="h-4 w-4" />
            Ôn hôm nay
          </Button>
        </Link>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Tổng" value={thongKe.tong} color="bg-lm-primary-soft" />
        <StatCard label="Mới" value={thongKe.moi} color="bg-lm-info-soft" />
        <StatCard label="Đang học" value={thongKe.dang_hoc} color="bg-lm-warning-soft" />
        <StatCard label="Đã thuộc" value={thongKe.thuoc} color="bg-lm-success-soft" />
      </div>

      {/* Deck list */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="lm-h4">Bộ từ của tôi</h2>
          <TaoBoTuButton />
        </div>

        {userDecks.length === 0 ? (
          <EmptyState type="personal" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {userDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </section>

      {/* System decks */}
      <section className="space-y-3">
        <h2 className="lm-h4">Bộ từ hệ thống</h2>
        {systemDecks.length === 0 ? (
          <EmptyState type="system" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {systemDecks.map((deck) => (
              <DeckCard key={deck.id} deck={deck} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="py-3 px-4">
      <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${color} mb-2`}>
        <span className="text-lg font-bold">{value}</span>
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

function DeckCard({ deck }: { deck: { id: string; ten: string; mo_ta: string | null; so_tu: number; mau_bia: string | null; la_he_thong: boolean; chu_de: string | null } }) {
  const colorBg = deck.mau_bia ?? "#E8A33D";

  return (
    <Link href={`/vocab/${deck.id}`}>
      <Card className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="lm-h4 line-clamp-1">{deck.ten}</CardTitle>
            {deck.la_he_thong && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Hệ thống
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {deck.mo_ta && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {deck.mo_ta}
            </p>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{deck.so_tu} từ</span>
            {deck.chu_de && <Badge variant="outline">{deck.chu_de}</Badge>}
          </div>
        </CardContent>
        {/* Color strip */}
        <div
          className="h-1 w-full rounded-b-lg transition-all group-hover:h-1.5"
          style={{ backgroundColor: colorBg }}
        />
      </Card>
    </Link>
  );
}

function TaoBoTuButton() {
  // Client component for modal — imported dynamically
  return (
    <TaoBoTuDialog />
  );
}

function EmptyState({ type }: { type: "personal" | "system" }) {
  if (type === "personal") {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center">
        <BookOpenIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">
          Bạn chưa có bộ từ nào.{" "}
          <Link href="/vocab/new" className="text-primary hover:underline">
            Tạo bộ từ đầu tiên
          </Link>{" "}
          hoặc thêm từ bộ hệ thống bên dưới.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center">
      <p className="text-sm text-muted-foreground">
        Không có bộ từ hệ thống. Bộ từ hệ thống sẽ được thêm khi seed database.
      </p>
    </div>
  );
}
