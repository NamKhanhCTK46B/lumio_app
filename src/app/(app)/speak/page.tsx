import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { speakingRepo } from "@/lib/repositories/speaking.repo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="lm-h2">Luyện nói với AI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chọn một nhân vật và luyện nói qua các tình huống giao tiếp thực tế
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                <Card className="transition-all hover:shadow-sm">
                  <CardContent className="flex items-center gap-3 py-3 px-4">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.nhan_vat?.url_avatar ?? ""} />
                      <AvatarFallback>
                        {session.nhan_vat?.ten?.charAt(0) ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.nhan_vat?.ten ?? "Nhân vật"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session.boi_canh ?? "Tự do"} · {session.tong_luot} lượt
                      </p>
                    </div>
                    <HistoryIcon className="h-4 w-4 text-muted-foreground" />
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
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-2xl font-bold text-lm-primary">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function CharacterCard({ character }: { character: { id: string; ten: string; url_avatar: string | null; giong: string | null; nhan: string[] | null; mo_ta?: string; cefr_toi_thieu: string | null } }) {
  return (
    <Card className="group cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5">
      <CardContent className="pt-6 pb-4 px-5">
        <div className="flex flex-col items-center text-center gap-3">
          <Avatar className="h-16 w-16 ring-2 ring-border group-hover:ring-primary transition-all">
            <AvatarImage src={character.url_avatar ?? ""} alt={character.ten} />
            <AvatarFallback className="text-xl font-bold">
              {character.ten.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{character.ten}</h3>
            {character.giong && (
              <p className="text-xs text-muted-foreground">{character.giong}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1 justify-center">
            {character.nhan?.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-lm-bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </CardContent>
      <div className="h-1 w-full bg-lm-primary opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg" />
    </Card>
  );
}

function EmptyCharacters() {
  return (
    <div className="rounded-lg border border-dashed border-border p-12 text-center">
      <MicIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
      <p className="mt-4 text-sm text-muted-foreground">
        Chưa có nhân vật nào. Nhân vật sẽ được thêm khi seed database.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Nhân vật mẫu: Sophie (British), Marcus (American), Linh (Vietnamese ESL).
      </p>
    </div>
  );
}
