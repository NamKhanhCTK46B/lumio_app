"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { vocabRepo } from "@/lib/repositories/vocab.repo";
import {
  LuuTuVungSchema,
  TaoBoTuSchema,
  CapNhatBoTuSchema,
  GradeReviewSchema,
  ThemBoTuHeThongSchema,
  TimKiemTuVungSchema,
} from "@/lib/schemas/vocab";
import { sm2Next, qualityFromButton, nextReviewAt } from "@/lib/srs/sm2";
import type { GradeReviewInput } from "@/lib/schemas/vocab";

function revalidateVocabTag(nguoiDungId: string | null) {
  if (!nguoiDungId) return;
  revalidateTag(`vocab:nguoi_dung:${nguoiDungId}`, "max");
}

function revalidateVocabViews(nguoiDungId: string | null, boTuId?: string | null) {
  revalidatePath("/vocab");
  revalidatePath("/dashboard");
  if (boTuId) {
    revalidatePath(`/vocab/${boTuId}`);
  }
  revalidateVocabTag(nguoiDungId);
}

// ---------------------------------------------------------------------------
// Lưu từ vựng
// ---------------------------------------------------------------------------

/**
 * Lưu một từ mới vào deck của user.
 *
 * @param raw  Input từ client (sẽ parse qua Zod).
 * @returns { ok, data } hoặc { ok: false, error }
 */
export async function luuTuVungAction(raw: unknown) {
  const parsed = LuuTuVungSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  try {
    const supabase = await createClient();
    const tu = await vocabRepo.luuTu(supabase, parsed.data);
    revalidateVocabViews(tu.nguoi_dung_id, tu.bo_tu_id);
    return { ok: true as const, data: tu };
  } catch (err) {
    console.error("Lỗi khi lưu từ vựng", err);
    const msg = err instanceof Error ? err.message : "Lỗi khi lưu từ";
    return { ok: false as const, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Tạo / cập nhật / xoá bộ từ
// ---------------------------------------------------------------------------

/**
 * Tạo bộ từ mới.
 */
export async function taoBoTuAction(raw: unknown) {
  const parsed = TaoBoTuSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  try {
    const supabase = await createClient();
    const boTu = await vocabRepo.taoBoTu(supabase, parsed.data);
    revalidateVocabViews(boTu.nguoi_dung_id, boTu.id);
    return { ok: true as const, data: boTu };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi tạo bộ từ";
    return { ok: false as const, error: msg };
  }
}

/**
 * Cập nhật bộ từ.
 */
export async function capNhatBoTuAction(boTuId: string, raw: unknown) {
  const parsed = CapNhatBoTuSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  try {
    const supabase = await createClient();
    const boTu = await vocabRepo.capNhatBoTu(supabase, boTuId, parsed.data);
    revalidateVocabViews(boTu.nguoi_dung_id, boTuId);
    return { ok: true as const, data: boTu };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi cập nhật bộ từ";
    return { ok: false as const, error: msg };
  }
}

/**
 * Xoá bộ từ.
 */
export async function xoaBoTuAction(boTuId: string) {
  try {
    const supabase = await createClient();
    const boTu = await vocabRepo.layBoTu(supabase, boTuId);
    await vocabRepo.xoaBoTu(supabase, boTuId);
    revalidateVocabViews(boTu?.nguoi_dung_id ?? null, boTuId);
    return { ok: true as const };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi xoá bộ từ";
    return { ok: false as const, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Grade review (SRS)
// ---------------------------------------------------------------------------

/**
 * Grade một từ trong phiên ôn + cập nhật lịch SRS.
 *
 * Logic:
 * 1. Lấy trạng thái lich_on_tap hiện tại.
 * 2. Tính trạng thái mới bằng SM-2.
 * 3. Update lich_on_tap + tu_da_luu.trang_thai.
 * 4. Log vào phien_hoc.
 */
export async function gradeReviewAction(raw: GradeReviewInput) {
  const parsed = GradeReviewSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  const { tu_id, quality } = parsed.data;

  try {
    const supabase = await createClient();

    // Lấy lịch ôn + từ hiện tại
    const [lichOn, tu] = await Promise.all([
      vocabRepo.layLichOn(supabase, tu_id),
      vocabRepo.layTu(supabase, tu_id),
    ]);

    if (!lichOn || !tu) {
      return { ok: false as const, error: "Không tìm thấy từ hoặc lịch ôn" };
    }

    // Chuyển quality button → SM-2 grade
    const grade = qualityFromButton(quality as 0 | 1 | 2 | 3);

    // Tính trạng thái SRS mới
    const sm2State = sm2Next(
      {
        repetition: lichOn.so_lan_lap,
        intervalDays: lichOn.so_ngay_cach,
        easeFactor: lichOn.he_so_de,
      },
      grade,
    );

    const nextAt = nextReviewAt(sm2State);

    // Cập nhật lịch ôn
    await vocabRepo.capNhatLichOn(
      supabase,
      tu_id,
      nextAt.toISOString(),
      sm2State.easeFactor,
      sm2State.intervalDays,
      sm2State.repetition,
      grade,
    );

    // Cập nhật trạng thái từ nếu đạt threshold
    let newStatus = tu.trang_thai;
    if (sm2State.repetition >= 5) {
      newStatus = "thuoc";
    } else if (sm2State.repetition >= 2) {
      newStatus = "on_tap";
    } else if (sm2State.repetition >= 1) {
      newStatus = "dang_hoc";
    }

    if (newStatus !== tu.trang_thai) {
      await vocabRepo.capNhatTrangThaiTu(supabase, tu_id, newStatus);
    }

    // Log vào phien_hoc
    await supabase.from("phien_hoc").insert({
      nguoi_dung_id: tu.nguoi_dung_id,
      loai_hoat_dong: "on_tu",
      entity_id: tu_id,
      bat_dau_luc: new Date().toISOString(),
      ket_thuc_luc: new Date().toISOString(),
      thoi_luong_giay: 0,
      chi_so: {
        grade,
        quality,
        sm2State,
        newStatus,
      },
    });

    revalidateVocabViews(tu.nguoi_dung_id, tu.bo_tu_id);

    return {
      ok: true as const,
      data: {
        newStatus,
        nextReviewAt: nextAt.toISOString(),
        intervalDays: sm2State.intervalDays,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi chấm ôn";
    return { ok: false as const, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Thêm bộ từ hệ thống
// ---------------------------------------------------------------------------

/**
 * Thêm bộ từ hệ thống vào deck của user (UC12).
 */
export async function themBoTuHeThongAction(raw: unknown) {
  const parsed = ThemBoTuHeThongSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  try {
    const supabase = await createClient();
    const result = await vocabRepo.saoChepBoTuHeThong(
      supabase,
      parsed.data.bo_tu_id,
    );
    revalidateVocabViews(null);
    return { ok: true as const, data: result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi thêm bộ từ";
    return { ok: false as const, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Tìm kiếm từ vựng
// ---------------------------------------------------------------------------

/**
 * Tìm kiếm từ vựng.
 */
export async function timKiemTuVungAction(raw: unknown) {
  const parsed = TimKiemTuVungSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.message };
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from("tu_da_luu")
      .select("*", { count: "exact" });

    if (parsed.data.bo_tu_id) {
      query = query.eq("bo_tu_id", parsed.data.bo_tu_id);
    }
    if (parsed.data.trang_thai) {
      query = query.eq("trang_thai", parsed.data.trang_thai);
    }
    if (parsed.data.tu_khoa) {
      query = query.ilike("tu_goc", `%${parsed.data.tu_khoa}%`);
    }

    const { data, error } = await query
      .order("tao_luc", { ascending: false })
      .range(parsed.data.offset, parsed.data.offset + parsed.data.gioi_han - 1);

    if (error) throw error;
    return { ok: true as const, data: { rows: data, total: data?.length ?? 0 } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi tìm kiếm";
    return { ok: false as const, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Toggle đánh dấu sao
// ---------------------------------------------------------------------------

/**
 * Toggle đánh dấu sao một từ.
 */
export async function toggleDanhDauAction(tuId: string) {
  try {
    const supabase = await createClient();
    const daDanhDau = await vocabRepo.toggleDanhDau(supabase, tuId);
    return { ok: true as const, data: { daDanhDau } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Lỗi khi cập nhật";
    return { ok: false as const, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Xoá từ
// ---------------------------------------------------------------------------

/**
 * Xoá một từ.
 */
export async function xoaTuAction(tuId: string) {
  try {
    const supabase = await createClient();
    const tu = await vocabRepo.layTu(supabase, tuId);
    if (!tu) {
      return { ok: false as const, error: "Không tìm thấy từ" };
    }

    await vocabRepo.xoaTu(supabase, tuId);
    revalidateVocabViews(tu.nguoi_dung_id, tu.bo_tu_id);
    return { ok: true as const };
  } catch (err) {
    console.error("Lỗi khi xoá từ vựng", err);
    const msg = err instanceof Error ? err.message : "Lỗi khi xoá từ";
    return { ok: false as const, error: msg };
  }
}
