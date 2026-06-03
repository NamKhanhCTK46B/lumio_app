"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { autoSaveAction, nopBaiAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * UC13 — Editor essay client-side với:
 *  - Word counter realtime (tránh server round-trip cho mỗi keystroke).
 *  - Timer đếm thời gian làm bài (luỹ kế qua các session, gửi kèm autosave).
 *  - Autosave debounce 10s khi nội dung thay đổi (giảm tải server).
 *  - Submit button gọi `nopBaiAction` (redirect tới /result khi xong).
 *
 * Lý do tách thành Client Component: cần state local cho counter +
 * timer + debounce — không phù hợp Server Component.
 */

const AUTOSAVE_DEBOUNCE_MS = 10_000;

type Props = {
  bai_viet_id: string;
  loai_de: string;
  de_bai: string;
  noi_dung_ban_dau: string;
  thoi_gian_ban_dau: number;
  error?: string;
};

export function EssayEditor({
  bai_viet_id,
  loai_de,
  de_bai,
  noi_dung_ban_dau,
  thoi_gian_ban_dau,
  error,
}: Props) {
  const [noi_dung, setNoiDung] = useState(noi_dung_ban_dau);
  const [thoi_gian, setThoiGian] = useState(thoi_gian_ban_dau);
  const [trang_thai_luu, setTrangThaiLuu] = useState<"idle" | "luu" | "loi">(
    "idle",
  );
  const [pending, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Đếm giây làm bài: tick mỗi giây, độc lập autosave. Lưu khi unmount
  // hoặc khi autosave chạy thì gửi kèm `thoi_gian_lam_giay`.
  useEffect(() => {
    timerRef.current = setInterval(() => setThoiGian((s) => s + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Autosave debounce: mỗi lần noi_dung thay đổi, reset timer 10s.
  useEffect(() => {
    if (noi_dung === noi_dung_ban_dau) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const fd = new FormData();
      fd.set("bai_viet_id", bai_viet_id);
      fd.set("noi_dung", noi_dung);
      fd.set("thoi_gian_lam_giay", String(thoi_gian));
      setTrangThaiLuu("luu");
      autoSaveAction(fd)
        .then(() => setTrangThaiLuu("idle"))
        .catch(() => setTrangThaiLuu("loi"));
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // thoi_gian không cần trigger autosave; chỉ noi_dung mới quan trọng.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noi_dung]);

  const soTu = noi_dung.trim() === "" ? 0 : noi_dung.trim().split(/\s+/).length;
  const phut = Math.floor(thoi_gian / 60);
  const giay = thoi_gian % 60;

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded bg-lm-primary-soft px-2 py-0.5 text-lm-primary-ink">{loai_de}</span>
          <span className="text-lm-fg-muted">·</span>
          <span className="text-lm-fg-muted">
            {phut}:{String(giay).padStart(2, "0")}
          </span>
          <span className="text-lm-fg-muted">·</span>
          <span className="text-lm-fg-muted">{soTu} từ</span>
          <span className="ml-auto text-xs">
            {trang_thai_luu === "luu" && <span className="text-lm-fg-muted">Đang lưu...</span>}
            {trang_thai_luu === "loi" && <span className="text-lm-danger">Lưu lỗi</span>}
            {trang_thai_luu === "idle" && noi_dung !== noi_dung_ban_dau && (
              <span className="text-lm-success">Đã lưu nháp</span>
            )}
          </span>
        </div>
        <h1 className="text-lg font-medium text-lm-fg">{de_bai}</h1>
      </header>

      {error && (
        <div className="rounded-md border border-lm-danger/30 bg-lm-danger-soft px-4 py-2 text-sm text-lm-danger-ink">
          {error}
        </div>
      )}

      <form
        action={(fd) => {
          // Gắn state hiện tại vào form trước khi submit, để action nhận
          // đúng nội dung user đang gõ + timer.
          fd.set("bai_viet_id", bai_viet_id);
          fd.set("noi_dung", noi_dung);
          fd.set("thoi_gian_lam_giay", String(thoi_gian));
          startTransition(() => nopBaiAction(fd));
        }}
        className="space-y-3"
      >
        <Textarea
          name="noi_dung"
          value={noi_dung}
          onChange={(e) => setNoiDung(e.target.value)}
          rows={20}
          placeholder="Bắt đầu viết essay ở đây..."
          className="min-h-140 font-mono text-sm leading-relaxed dark:bg-lm-bg-elev-1"
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-lm-fg-muted">
            Nội dung tự động lưu mỗi 10 giây. Bấm <strong>Nộp bài</strong> để AI chấm.
          </p>
          <Button
            type="submit"
            disabled={pending || soTu < 20}
          >
            {pending ? "Đang chấm..." : "Nộp bài"}
          </Button>
        </div>
        {soTu < 20 && (
          <p className="text-xs text-lm-fg-muted">
            Cần ít nhất 20 từ để chấm. Còn {20 - soTu} từ nữa.
          </p>
        )}
      </form>
    </div>
  );
}
