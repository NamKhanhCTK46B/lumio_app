"use server";

import { createClient } from "@/lib/supabase/server";
import { speakingRepo } from "@/lib/repositories/speaking.repo";
import { revalidateTag } from "next/cache";
import { z } from "zod";

const TaoPhienSchema = z.object({
  nhan_vat_id: z.string().uuid("ID nhân vật không hợp lệ"),
  boi_canh: z.string().max(256).optional(),
});

/**
 * Tạo phiên nói mới.
 */
export async function taoPhienNoiAction(raw: unknown) {
  const parsed = TaoPhienSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  try {
    const supabase = await createClient();
    const phien = await speakingRepo.taoPhienNoi(
      supabase,
      parsed.data.nhan_vat_id,
      parsed.data.boi_canh ?? null,
    );
    return { ok: true as const, data: { phien_id: phien.id } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi tạo phiên";
    return { ok: false as const, error: msg };
  }
}

/**
 * Lấy danh sách nhân vật.
 */
export async function layDanhSachNhanVatAction() {
  try {
    const supabase = await createClient();
    const nhanVats = await speakingRepo.danhSachNhanVat(supabase);
    return { ok: true as const, data: nhanVats };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi lấy nhân vật";
    return { ok: false as const, error: msg };
  }
}

/**
 * Kết thúc phiên nói.
 */
export async function ketThucPhienNoiAction(phienId: string, data: {
  tongLuot: number;
  diemPhatAmTb: number | null;
  tomTat: string | null;
}) {
  try {
    const supabase = await createClient();
    await speakingRepo.ketThucPhien(supabase, phienId, data.tongLuot, data.diemPhatAmTb, data.tomTat);

    // Log vao phien_hoc
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("phien_hoc").insert({
        nguoi_dung_id: user.id,
        loai_hoat_dong: "noi",
        entity_id: phienId,
        bat_dau_luc: new Date().toISOString(),
        ket_thuc_luc: new Date().toISOString(),
        thoi_luong_giay: 0,
        chi_so: { diem_phat_am_tb: data.diemPhatAmTb, tong_luot: data.tongLuot },
      });
    }

    if (user) {
      revalidateTag(`speak:nguoi_dung:${user.id}`, "default");
    }
    return { ok: true as const };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi kết thúc phiên";
    return { ok: false as const, error: msg };
  }
}

/**
 * Lấy chi tiết phiên + lịch sử.
 */
export async function layChiTietPhienAction(phienId: string) {
  try {
    const supabase = await createClient();
    const [phien, lichSu] = await Promise.all([
      speakingRepo.layPhienNoi(supabase, phienId),
      speakingRepo.layLichSuPhien(supabase, phienId),
    ]);

    if (!phien) {
      return { ok: false as const, error: "Phiên không tồn tại" };
    }

    return { ok: true as const, data: { phien, lichSu } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi lấy phiên";
    return { ok: false as const, error: msg };
  }
}

/**
 * Lấy thống kê speaking của user.
 */
export async function layThongKeSpeakingAction() {
  try {
    const supabase = await createClient();
    const stats = await speakingRepo.thongKe(supabase);
    return { ok: true as const, data: stats };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi lấy thống kê";
    return { ok: false as const, error: msg };
  }
}
