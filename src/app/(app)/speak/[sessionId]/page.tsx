import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { speakingRepo } from "@/lib/repositories/speaking.repo";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { SpeakingSessionClient } from "../_components/speaking-session-client";

export default async function SpeakingSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  const [phien, nhanVat] = await Promise.all([
    speakingRepo.layPhienNoi(supabase, sessionId),
    // Lấy nhân vật từ phien hoặc từ danh sách nếu mới
    speakingRepo.danhSachNhanVat(supabase).then((chars) => chars[0] ?? null),
  ]);

  // Nếu phien tồn tại → lấy nhân vật
  let nhanVatData: typeof nhanVat | null = nhanVat;
  if (phien) {
    nhanVatData = await speakingRepo.layNhanVat(supabase, phien.nhan_vat_id);
  }

  // Placeholder nếu chưa có nhân vật
  const char = nhanVatData ?? {
    id: "placeholder",
    ten: "Sophie",
    url_avatar: null,
    giong: "British",
    prompt_nhan_vat: "You are a friendly British teacher. Help the learner practice everyday English conversation.",
    nhan: null,
    cefr_toi_thieu: "A2",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <SpeakingSessionClient
        nhanVatId={char.id}
        nhanVatTen={char.ten}
        nhanVatAvatar={char.url_avatar ?? null}
        nhanVatPrompt={char.prompt_nhan_vat}
        phienId={sessionId}
      />
    </div>
  );
}
