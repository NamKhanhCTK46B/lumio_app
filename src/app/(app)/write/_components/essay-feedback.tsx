"use client";

import { useState } from "react";

/**
 * UC14 — render kết quả chấm essay: band score cards + nội dung
 * highlight inline + tooltip annotation + bản viết lại.
 *
 * Highlight inline: split nội dung thành runs theo vị trí annotation,
 * mỗi annotation render <mark> với màu theo `phan_loai`. Click vào
 * annotation → focus annotation panel bên dưới. Đơn giản hơn tooltip
 * floating — hỗ trợ mobile tốt hơn.
 */

type ChuThich = {
  vi_tri_bat_dau: number;
  vi_tri_ket_thuc: number;
  phan_loai: "grammar" | "lexical" | "coherence" | "task" | "spelling";
  muc_do: "nhe" | "nang";
  goi_y_sua: string;
  giai_thich: string;
};

type Props = {
  noi_dung: string;
  diem_tong: number;
  score_task_achievement: number;
  score_coherence: number;
  score_lexical: number;
  score_grammar: number;
  tom_tat_phan_hoi: string;
  ban_viet_lai: string;
  chu_thich: ChuThich[];
};

const MAU_PHAN_LOAI: Record<ChuThich["phan_loai"], string> = {
  grammar: "bg-rose-100 text-rose-900 border-rose-300",
  lexical: "bg-amber-100 text-amber-900 border-amber-300",
  coherence: "bg-sky-100 text-sky-900 border-sky-300",
  task: "bg-violet-100 text-violet-900 border-violet-300",
  spelling: "bg-emerald-100 text-emerald-900 border-emerald-300",
};

const NHAN_PHAN_LOAI: Record<ChuThich["phan_loai"], string> = {
  grammar: "Ngữ pháp",
  lexical: "Từ vựng",
  coherence: "Liên kết",
  task: "Nội dung",
  spelling: "Chính tả",
};

export function EssayFeedback(props: Props) {
  const [show_rewrite, setShowRewrite] = useState(false);
  const [highlight_idx, setHighlightIdx] = useState<number | null>(null);

  // Build runs: tách noi_dung thành mảng đoạn (plain hoặc annotated).
  // Annotations đã sort theo vi_tri_bat_dau ở repository.
  const sorted = [...props.chu_thich].sort(
    (a, b) => a.vi_tri_bat_dau - b.vi_tri_bat_dau,
  );
  const runs: Array<{ text: string; idx: number | null }> = [];
  let cursor = 0;
  sorted.forEach((c, i) => {
    if (c.vi_tri_bat_dau > cursor) {
      runs.push({ text: props.noi_dung.slice(cursor, c.vi_tri_bat_dau), idx: null });
    }
    runs.push({
      text: props.noi_dung.slice(c.vi_tri_bat_dau, c.vi_tri_ket_thuc),
      idx: i,
    });
    cursor = c.vi_tri_ket_thuc;
  });
  if (cursor < props.noi_dung.length) {
    runs.push({ text: props.noi_dung.slice(cursor), idx: null });
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-5">
        <ScoreCard label="Tổng" value={props.diem_tong} big />
        <ScoreCard label="TA" value={props.score_task_achievement} />
        <ScoreCard label="CC" value={props.score_coherence} />
        <ScoreCard label="LR" value={props.score_lexical} />
        <ScoreCard label="GR" value={props.score_grammar} />
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-medium text-slate-700">Phản hồi tổng quan</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
          {props.tom_tat_phan_hoi}
        </p>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-medium text-slate-700">Bài viết của bạn (di chuột vào phần gạch chân để xem giải thích)</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-900">
          {runs.map((r, i) => {
            if (r.idx === null) {
              return <span key={i}>{r.text}</span>;
            }
            const c = sorted[r.idx]!;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setHighlightIdx(r.idx)}
                className={`mx-0.5 cursor-pointer border-b-2 px-0.5 ${MAU_PHAN_LOAI[c.phan_loai]} ${
                  c.muc_do === "nang" ? "underline decoration-wavy" : ""
                }`}
                title={`${NHAN_PHAN_LOAI[c.phan_loai]} — ${c.giai_thich}`}
              >
                {r.text}
              </button>
            );
          })}
        </p>
      </section>

      {sorted.length > 0 && (
        <section className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-medium text-slate-700">Chi tiết lỗi</h2>
          <ul className="mt-3 space-y-3">
            {sorted.map((c, i) => (
              <li
                key={i}
                className={`rounded-md border px-3 py-2 text-sm transition ${
                  highlight_idx === i
                    ? "border-amber-400 bg-amber-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-xs">
                  <span className={`rounded px-2 py-0.5 ${MAU_PHAN_LOAI[c.phan_loai]}`}>
                    {NHAN_PHAN_LOAI[c.phan_loai]}
                  </span>
                  <span className="text-slate-500">
                    {c.muc_do === "nang" ? "Lỗi nặng" : "Nhẹ"}
                  </span>
                </div>
                <p className="text-slate-800">
                  <strong>Sửa:</strong> {c.goi_y_sua}
                </p>
                <p className="mt-1 text-slate-600">{c.giai_thich}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <button
          type="button"
          onClick={() => setShowRewrite((v) => !v)}
          className="text-sm font-medium text-amber-700 hover:underline"
        >
          {show_rewrite ? "Ẩn" : "Hiện"} bản viết lại (band 8.0)
        </button>
        {show_rewrite && (
          <p className="mt-3 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm leading-7 text-slate-800">
            {props.ban_viet_lai}
          </p>
        )}
      </section>
    </div>
  );
}

function ScoreCard({ label, value, big }: { label: string; value: number; big?: boolean }) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        big ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 font-semibold ${big ? "text-3xl text-amber-900" : "text-2xl text-slate-900"}`}>
        {value.toFixed(1)}
      </p>
    </div>
  );
}
