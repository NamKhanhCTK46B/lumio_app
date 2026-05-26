"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { danhGiaRepo } from "@/lib/repositories/danh_gia.repo";
import { sinhCauHoiPlacement } from "@/lib/ai/prompts/placement-test";
import {
  LEVEL_BAT_DAU,
  levelTiepTheo,
  nenDung,
  parseCauHoi,
  tinhKetQua,
  type CefrLevel,
} from "@/lib/ai/placement-grading";

/**
 * UC5 — actions cho placement test.
 *
 * Có 3 action:
 *  1. `batDauHoacTiepTucAction` — vào page lần đầu hoặc reload: tạo bài
 *     mới nếu chưa có, hoặc sinh câu đầu tiên nếu bài rỗng.
 *  2. `traLoiCauHoiAction` — chấm câu vừa trả lời, sinh câu kế (adaptive)
 *     hoặc hoàn tất bài nếu đủ điều kiện dừng.
 *  3. `boQuaAction` — skip toàn bộ placement test (set CEFR mặc định B1).
 */

/** Tạo bài mới hoặc trả id bài đang dở. Luôn đảm bảo có ít nhất 1 câu. */
export async function batDauHoacTiepTucAction(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Chưa đăng nhập");

  let bai = await danhGiaRepo.layBaiDangLam(supabase);
  if (!bai) {
    const id = await danhGiaRepo.taoBaiMoi(supabase, user.id);
    bai = { id, nguoi_dung_id: user.id, bat_dau_luc: "", hoan_thanh_luc: null, trinh_do_ket_qua: null, do_tin_ket_qua: null, diem_tho: null };
  }

  const cauHoi = await danhGiaRepo.layCauHoi(supabase, bai.id);
  if (cauHoi.length === 0) {
    // Sinh câu đầu — level B1, không có câu nào để loại trùng.
    const cau = await sinhCauHoiPlacement({
      trinh_do_du_kien: LEVEL_BAT_DAU,
      cau_da_hoi: [],
    });
    await danhGiaRepo.themCauHoi(supabase, bai.id, 1, cau);
  }

  revalidatePath("/onboarding/test");
}

/**
 * Chấm câu user vừa trả lời + sinh câu kế (hoặc hoàn tất bài).
 *
 * Tin tưởng cau_hoi_id + dap_an_chon đến từ form — RLS check ownership ở
 * tầng DB (chỉ user sở hữu bài kiểm tra mới update được cau_hoi_kiem_tra).
 */
export async function traLoiCauHoiAction(formData: FormData): Promise<void> {
  const cauHoiId = String(formData.get("cau_hoi_id") ?? "");
  const dapAnChon = Number(formData.get("dap_an") ?? -1);

  if (!cauHoiId || Number.isNaN(dapAnChon) || dapAnChon < 0 || dapAnChon > 3) {
    redirect("/onboarding/test?error=Vui lòng chọn 1 đáp án");
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Chưa đăng nhập");

  const bai = await danhGiaRepo.layBaiDangLam(supabase);
  if (!bai) {
    redirect("/onboarding/test");
  }

  const danhSach = await danhGiaRepo.layCauHoi(supabase, bai.id);
  const cauHienTai = danhSach.find((c) => c.id === cauHoiId);
  if (!cauHienTai) {
    redirect("/onboarding/test");
  }

  const cauHoi = parseCauHoi(cauHienTai.cau_hoi);
  if (!cauHoi) {
    // Câu hỏi DB hỏng format — bỏ qua câu này, sinh câu mới cùng level.
    redirect("/onboarding/test");
  }

  const laDung = dapAnChon === cauHoi.dap_an;
  const cauTraLoiText = cauHoi.lua_chon[dapAnChon] ?? "";
  await danhGiaRepo.chamCauHoi(
    supabase,
    cauHoiId,
    cauTraLoiText,
    laDung,
    cauHoi.giai_thich,
  );

  const lichSu = danhSach
    .filter((c) => c.la_dap_an_dung !== null || c.id === cauHoiId)
    .map((c) => ({
      level: (c.id === cauHoiId ? cauHoi.trinh_do : c.trinh_do_du_kien) as CefrLevel,
      dung: c.id === cauHoiId ? laDung : c.la_dap_an_dung === true,
    }));

  if (nenDung(lichSu)) {
    const ketQua = tinhKetQua(lichSu);
    await danhGiaRepo.hoanTat(supabase, bai.id, ketQua);
    await supabase
      .from("ho_so")
      .update({ trinh_do_cefr: ketQua.trinh_do })
      .eq("id", user.id);
    redirect("/onboarding/test/ket-qua");
  }

  // Sinh câu kế: level adaptive theo kết quả câu vừa rồi.
  const levelKe = levelTiepTheo(cauHoi.trinh_do, laDung);
  const cauDaHoi = danhSach
    .map((c) => parseCauHoi(c.cau_hoi)?.cau_hoi)
    .filter((s): s is string => Boolean(s));

  try {
    const cauMoi = await sinhCauHoiPlacement({
      trinh_do_du_kien: levelKe,
      cau_da_hoi: cauDaHoi,
    });
    await danhGiaRepo.themCauHoi(supabase, bai.id, danhSach.length + 1, cauMoi);
  } catch (err) {
    // LLM lỗi tạm thời — không block user; redirect về page và để user
    // bấm reload thử lại (button hiển thị khi không có câu kế tiếp).
    console.error("[placement] LLM error:", err);
    redirect(`/onboarding/test?error=${encodeURIComponent("Lỗi sinh câu hỏi, thử lại")}`);
  }

  revalidatePath("/onboarding/test");
  redirect("/onboarding/test");
}

/**
 * Bỏ qua placement test — set CEFR mặc định B1, đánh dấu bài đang dở
 * (nếu có) thành hoàn tất với confidence 0 để phân biệt với bài thật.
 */
export async function boQuaPlacementAction(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Chưa đăng nhập");

  const bai = await danhGiaRepo.layBaiDangLam(supabase);
  if (bai) {
    await danhGiaRepo.hoanTat(supabase, bai.id, {
      trinh_do: LEVEL_BAT_DAU,
      do_tin: 0,
      diem_tho: 0,
    });
  }
  await supabase
    .from("ho_so")
    .update({ trinh_do_cefr: LEVEL_BAT_DAU })
    .eq("id", user.id);

  redirect("/onboarding/goals");
}
