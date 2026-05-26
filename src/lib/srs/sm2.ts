/**
 * Thuật toán SuperMemo-2 (SM-2) cho spaced repetition.
 *
 * Dùng SM-2 thay vì FSRS vì dataset hiện chưa đủ để fit FSRS
 * (FSRS cần ≥ 1000 review history để hyperparameters hội tụ).
 *
 * SM-2 không lưu trạng thái quá khứ — chỉ cần 3 số trên mỗi từ:
 * repetition, intervalDays, easeFactor.
 */

export type Sm2State = {
  /** Số lần lặp liên tiếp đã trả lời đúng (quality >= 3). */
  repetition: number;
  /** Số ngày giãn cách đến lần ôn tiếp theo. */
  intervalDays: number;
  /** Ease factor (EF), mặc định 2.5, tối thiểu 1.3. */
  easeFactor: number;
};

/**
 * Quality grade cho lần ôn vừa rồi.
 * 0: hoàn toàn sai → reset về ngày mai
 * 1–2: sai nhưng nhớ được → reset
 * 3: vừa đúng vừa khó → giữ ngày
 * 4: đúng và hơi khó → tăng nhẹ
 * 5: hoàn toàn đúng, rất dễ → tăng mạnh
 */
export type Quality = 0 | 1 | 2 | 3 | 4 | 5;

export const TRANG_THAI_MAC_DINH: Sm2State = {
  repetition: 0,
  intervalDays: 0,
  easeFactor: 2.5,
};

/**
 * Tính trạng thái SRS mới từ trạng thái cũ + grade.
 *
 * @param prev  Trạng thái hiện tại của từ (từ bảng lich_on_tap).
 * @param quality  Grade từ 0–5 do người dùng chọn.
 * @returns Trạng thái mới để ghi vào lich_on_tap.
 */
export function sm2Next(prev: Sm2State, quality: Quality): Sm2State {
  if (quality < 3) {
    // Sai → reset về lần đầu, giữ EF
    return { repetition: 0, intervalDays: 1, easeFactor: prev.easeFactor };
  }

  // Đúng → cập nhật ease factor
  const ef = Math.max(
    1.3,
    prev.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  const rep = prev.repetition + 1;

  const intervalDays =
    rep === 1 ? 1 : rep === 2 ? 6 : Math.round(prev.intervalDays * ef);

  return { repetition: rep, intervalDays, easeFactor: ef };
}

/**
 * Tính thời điểm ôn tiếp theo từ state SM-2.
 * @param state  Trạng thái sau khi sm2Next.
 * @param answeredAt  Thời điểm trả lời (mặc định now).
 * @returns ISO timestamp cho lần ôn tiếp theo.
 */
export function nextReviewAt(
  state: Sm2State,
  answeredAt: Date = new Date(),
): Date {
  const next = new Date(answeredAt);
  next.setDate(next.getDate() + state.intervalDays);
  next.setHours(0, 0, 0, 0); // Normalize về 00:00
  return next;
}

/**
 * Chuyển đổi quality number (1–4) sang grade SM-2 (0–5).
 * Dùng cho UI review với 4 nút thay vì 6.
 */
export function qualityFromButton(button: 0 | 1 | 2 | 3): Quality {
  // Map: 0=Lại → 1, 1=Khó → 2, 2=Tốt → 4, 3=Dễ → 5
  const map: Record<0 | 1 | 2 | 3, Quality> = { 0: 1, 1: 2, 2: 4, 3: 5 };
  return map[button];
}
