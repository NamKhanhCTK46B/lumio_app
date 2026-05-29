/**
 * POST /api/notifications/read — đánh dấu thông báo đã đọc.
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { thongBaoRepo } from "@/lib/repositories/thong_bao.repo";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const DanhDauDaDocSchema = z.object({
  thongBaoId: z.string().uuid("ID thông báo không hợp lệ").optional(),
  tatCa: z.boolean().default(false),
});

export async function danhDauDaDocAction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Chưa đăng nhập");

  const thongBaoId = formData.get("thongBaoId") as string | null;
  const tatCa = formData.get("tatCa") === "true";

  if (tatCa) {
    await thongBaoRepo.danhDauTatCaDaDoc(supabase);
  } else if (thongBaoId) {
    const parsed = DanhDauDaDocSchema.safeParse({ thongBaoId });
    if (!parsed.success) throw new Error("ID thông báo không hợp lệ");
    await thongBaoRepo.danhDauDaDoc(supabase, thongBaoId);
  }

  revalidateTag("thong_bao", "default");
}
