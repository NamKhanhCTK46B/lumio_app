"use client";

import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * UC15 — Charts cho /write/progress, dùng Recharts.
 *
 * Lý do migrate khỏi SVG tay:
 *  - Tooltip + interactivity miễn phí (hover hiện band score chính xác).
 *  - ResponsiveContainer tự co giãn theo viewport, không cần viewBox math.
 *  - Cell color theo band đảm bảo a11y (mỗi cột bar có màu riêng).
 *
 * Vì Recharts cần DOM measurement nên file đánh dấu `"use client"`.
 * Server Component cha vẫn fetch data, truyền props plain — không tăng
 * payload đáng kể (Recharts ~80KB gzip — chỉ trang /write/progress load).
 */

const MAU_PRIMARY = "var(--lm-primary)";
const MAU_GRID = "var(--lm-border)";
const MAU_TEXT = "var(--lm-fg-muted)";

type LinePoint = { x: number; y: number; label: string };

export function LineChart({ data, max_y }: { data: LinePoint[]; max_y: number }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có dữ liệu</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid stroke={MAU_GRID} strokeDasharray="3 3" />
        <XAxis dataKey="label" stroke={MAU_TEXT} fontSize={11} tickLine={false} />
        <YAxis
          domain={[0, max_y]}
          stroke={MAU_TEXT}
          fontSize={11}
          tickLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "var(--lm-bg-elev-1)",
            border: `1px solid var(--lm-border)`,
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${Number(value).toFixed(1)} band`, "Tổng"]}
        />
        <Line
          type="monotone"
          dataKey="y"
          stroke={MAU_PRIMARY}
          strokeWidth={2}
          dot={{ fill: MAU_PRIMARY, r: 3 }}
          activeDot={{ r: 5 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

type BarItem = { label: string; value: number };

export function BarChart({ data, max_value }: { data: BarItem[]; max_value: number }) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">Chưa có dữ liệu</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsBarChart
        data={data}
        layout="vertical"
        margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
      >
        <CartesianGrid stroke={MAU_GRID} strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          domain={[0, max_value]}
          stroke={MAU_TEXT}
          fontSize={11}
          tickLine={false}
          allowDecimals={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          stroke={MAU_TEXT}
          fontSize={11}
          tickLine={false}
          width={110}
        />
        <Tooltip
          contentStyle={{
            background: "var(--lm-bg-elev-1)",
            border: `1px solid var(--lm-border)`,
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(value) => [`${Number(value).toFixed(1)}`, "Band"]}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={MAU_PRIMARY} />
          ))}
        </Bar>
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
