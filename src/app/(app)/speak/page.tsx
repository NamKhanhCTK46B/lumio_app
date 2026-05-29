import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { speakingRepo } from "@/lib/repositories/speaking.repo";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MicIcon, HistoryIcon } from "lucide-react";

/**
 * Trang chọn nhân vật luyện nói.
 */
export default async function SpeakPage() {
  const supabase = await createClient();
  const [nhanVats, thongKe, phienGanDay] = await Promise.all([
    speakingRepo.danhSachNhanVat(supabase),
    speakingRepo.thongKe(supabase),
    speakingRepo.danhSachPhienGanDay(supabase, 5),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="lm-h2">Luyện nói với AI</h1>
        <p className="mt-1 text-sm text-lm-fg-muted">
          Chọn một nhân vật và luyện nói qua các tình huống giao tiếp thực tế
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Phiên đã luyện" value={thongKe.tong_phien} />
        <StatCard label="Điểm TB" value={thongKe.diem_tb ?? "—"} />
        <StatCard
          label="Gần nhất"
          value={thongKe.phien_gan_nhat ? "Có" : "Chưa"}
        />
      </div>

      {/* Character grid */}
      <section className="space-y-3">
        <h2 className="lm-h4">Chọn nhân vật</h2>
        {nhanVats.length === 0 ? (
          <EmptyCharacters />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {nhanVats.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </section>

      {/* Recent sessions */}
      {phienGanDay.length > 0 && (
        <section className="space-y-3">
          <h2 className="lm-h4">Phiên gần đây</h2>
          <div className="space-y-2">
            {phienGanDay.map((session) => (
              <Link key={session.id} href={`/speak/${session.id}`}>
                <Card className="border-lm-border bg-lm-bg-elev-1 transition-all hover:-translate-y-0.5 hover:shadow-sm">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.nhan_vat?.url_avatar ?? ""} />
                      <AvatarFallback>
                        {session.nhan_vat?.ten?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-lm-fg">
                        {session.nhan_vat?.ten ?? "Nhân vật"}
                      </p>
                      <p className="text-xs text-lm-fg-muted">
                        {session.boi_canh ?? "Tự do"} · {session.tong_luot} lượt
                      </p>
                    </div>
                    <HistoryIcon className="h-4 w-4 text-lm-fg-muted" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="border-lm-border bg-lm-bg-elev-1">
      <CardContent className="flex flex-col gap-1">
        <div className="text-2xl font-semibold text-lm-primary">
          <span className="font-mono leading-tight whitespace-nowrap">
            {value}
          </span>
        </div>
        <p className="text-xs text-lm-fg-muted">{label}</p>
      </CardContent>
    </Card>
  );
}

function CharacterCard({
  character,
}: {
  character: {
    id: string;
    ten: string;
    url_avatar: string | null;
    giong: string | null;
    nhan: string[] | null;
    mo_ta?: string;
    cefr_toi_thieu: string | null;
  };
}) {
  return (
    <Card className="group cursor-pointer border-lm-border bg-lm-bg-elev-1 transition-all hover:-translate-y-0.5 hover:shadow-sm">
      <CardContent className="flex items-center gap-4 py-4">
        <Avatar className="h-14 w-14 ring-2 ring-lm-border group-hover:ring-lm-primary transition-all">
          <AvatarImage src={character.url_avatar ?? ""} alt={character.ten} />
          <AvatarFallback className="text-lg font-bold">
            {character.ten.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-lm-fg">
            {character.ten}
          </div>
          {character.giong && (
            <div className="text-xs text-lm-fg-muted">{character.giong}</div>
          )}
          <div className="mt-2 flex flex-wrap gap-1">
            {character.nhan?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyCharacters() {
  return (
    <div className="rounded-lg border border-dashed border-lm-border bg-lm-bg-elev-1 p-12 text-center">
      <MicIcon className="mx-auto h-10 w-10 text-lm-fg-muted/50" />
      <p className="mt-4 text-sm text-lm-fg-muted">
        Chưa có nhân vật nào. Nhân vật sẽ được thêm khi seed database.
      </p>
      <p className="mt-1 text-xs text-lm-fg-muted">
        Nhân vật mẫu: Sophie (British), Marcus (American), Linh (Vietnamese
        ESL).
      </p>
    </div>
  );
}
