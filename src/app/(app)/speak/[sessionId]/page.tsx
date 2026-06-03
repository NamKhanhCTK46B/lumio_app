import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { speakingRepo } from "@/lib/repositories/speaking.repo";
import { SpeakingSessionClient } from "../_components/speaking-session-client";

export default async function SpeakingSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const phien = await speakingRepo.layPhienNoi(supabase, sessionId);
  if (!phien) {
    notFound();
  }

  const [nhanVat, lichSu] = await Promise.all([
    speakingRepo.layNhanVat(supabase, phien.nhan_vat_id),
    speakingRepo.layLichSuPhien(supabase, sessionId),
  ]);

  if (!nhanVat) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <SpeakingSessionClient
        nhanVatId={nhanVat.id}
        nhanVatTen={nhanVat.ten}
        nhanVatAvatar={nhanVat.url_avatar ?? null}
        nhanVatSlug={nhanVat.slug}
        nhanVatGiong={nhanVat.giong}
        phienId={sessionId}
        initialScenario={phien.boi_canh ?? ""}
        initialTurns={lichSu.map((turn) => ({
          vai: turn.vai,
          noi_dung: turn.noi_dung,
        }))}
      />
    </div>
  );
}
