import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { vocabRepo } from "@/lib/repositories/vocab.repo";
import type { HoSo } from "@/types/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BookOpen,
  Clock,
  Flame,
  Layers,
  Mic,
  PenLine,
  Play,
  Plus,
  TrendingUp,
  ChevronRight,
  Headphones,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [hoSoResult, thongKe, tuCanOn] = await Promise.all([
    supabase.from("ho_so").select("ten_hien_thi, trinh_do_cefr").maybeSingle(),
    vocabRepo.thongKe(supabase),
    vocabRepo.demTuCanOn(supabase),
  ]);

  if (hoSoResult.error) {
    console.error("Ho so fetch failed in dashboard", hoSoResult.error);
  }

  const hoSo = hoSoResult.error ? null : (hoSoResult.data as HoSo | null);
  const today = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
    .format(new Date())
    .toUpperCase();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:gap-8">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="lm-overline">{today}</div>
          <h2 className="lm-h2">
            Chào {hoSo?.ten_hien_thi ?? "bạn"}{" "}
            <span className="text-lm-primary">·</span> sẵn sàng học chưa?
          </h2>
          <p className="mt-2 text-sm text-lm-fg-muted">
            Hôm nay có <strong className="text-lm-fg">{tuCanOn}</strong> từ cần
            ôn và một bài viết IELTS đang chờ phản hồi.
          </p>
        </div>
        <Link href="/vocab">
          <Button size="lg" className="gap-2">
            <Play className="h-4 w-4" />
            Bắt đầu ôn từ
          </Button>
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="TỪ CẦN ÔN"
          value={tuCanOn}
          icon={Flame}
          sub="Hôm nay"
        />
        <StatCard
          label="TỪ ĐÃ THUỘC"
          value={thongKe.thuoc}
          icon={Layers}
          sub={`${thongKe.thuoc} / ${thongKe.tong}`}
          progress={{ value: thongKe.thuoc, max: thongKe.tong }}
        />
        <StatCard
          label="THỜI GIAN"
          value="1h 24m"
          icon={Clock}
          sub="Tuần này"
        />
        <StatCard
          label="TRÌNH ĐỘ"
          value={hoSo?.trinh_do_cefr ?? "—"}
          icon={TrendingUp}
          sub="Band hiện tại"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <Card className="border-lm-border bg-lm-bg-elev-1">
          <div className="flex items-center justify-between px-4 pt-4">
            <h3 className="text-base font-semibold text-lm-fg">Hôm nay</h3>
            <Link
              href="/dashboard"
              className="text-xs text-lm-fg-muted hover:text-lm-fg"
            >
              Xem tất cả <ChevronRight className="inline h-3 w-3" />
            </Link>
          </div>
          <div className="mt-3 flex flex-col gap-2 px-4 pb-4">
            <ActivityRow
              href="/vocab"
              icon={BookOpen}
              title={`Ôn ${tuCanOn} từ vựng đến hạn`}
              sub="Travel English · Business meetings"
              cta="Bắt đầu"
            />
            <ActivityRow
              href="/write"
              icon={PenLine}
              title="Phản hồi cho essay 'Online learning'"
              sub="Đã chấm · band 6.5"
              cta="Xem"
            />
            <ActivityRow
              href="/speak"
              icon={Mic}
              title="Tiếp tục roleplay với Sophie"
              sub="Ordering coffee · turn 4/8"
              cta="Tiếp tục"
            />
          </div>
        </Card>

        <Card className="border-lm-border bg-lm-bg-elev-1">
          <div className="flex items-center justify-between px-4 pt-4">
            <h3 className="text-base font-semibold text-lm-fg">
              Gợi ý cho bạn
            </h3>
            <span className="rounded bg-lm-info-soft px-2 py-0.5 text-xs font-semibold text-lm-info-ink">
              CEFR B1
            </span>
          </div>
          <p className="mt-2 px-4 text-sm text-lm-fg-muted">
            AI gợi ý dựa trên các từ bạn đang học và mục tiêu IELTS 7.0.
          </p>
          <div className="mt-3 flex flex-col gap-2 px-4 pb-4">
            <SuggestionRow
              type="youtube"
              title="TED-Ed · Why do we get bored?"
              meta="5:42 · 32 từ B1+"
            />
            <SuggestionRow
              type="article"
              title="The Guardian · Climate's quiet shift"
              meta="6 min read · 24 từ B2+"
            />
            <SuggestionRow
              type="podcast"
              title="BBC 6 Minute English"
              meta="6:30 · 18 từ B1+"
            />
          </div>
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  progress,
}: {
  label: string;
  value: string | number;
  icon: typeof Flame;
  sub?: string;
  progress?: { value: number; max: number };
}) {
  const percent =
    progress && progress.max > 0
      ? Math.min(100, Math.round((progress.value / progress.max) * 100))
      : 0;

  return (
    <Card className="border-lm-border bg-lm-bg-elev-1">
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-[0.08em] text-lm-fg-subtle">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <div className="text-2xl font-semibold text-lm-fg">
          <span className="font-mono leading-tight whitespace-nowrap">
            {value}
          </span>
        </div>
        {sub && <div className="text-xs text-lm-fg-muted">{sub}</div>}
        {progress && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-lm-bg-muted">
            <div
              className="h-full rounded-full bg-lm-primary"
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityRow({
  href,
  icon: Icon,
  title,
  sub,
  cta,
}: {
  href: string;
  icon: typeof BookOpen;
  title: string;
  sub: string;
  cta: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-lm-bg-muted px-3 py-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-lm-border bg-lm-bg-elev-1 text-lm-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-lm-fg">{title}</div>
        <div className="text-xs text-lm-fg-muted">{sub}</div>
      </div>
      <Link href={href} className="shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-lm-fg-muted hover:text-lm-fg"
        >
          {cta}
          <ChevronRight className="h-3 w-3" />
        </Button>
      </Link>
    </div>
  );
}

function SuggestionRow({
  type,
  title,
  meta,
}: {
  type: "youtube" | "article" | "podcast";
  title: string;
  meta: string;
}) {
  const palette = {
    youtube: "bg-lm-danger",
    article: "bg-lm-info",
    podcast: "bg-lm-cefr-c2",
  }[type];

  const Icon = {
    youtube: Play,
    article: BookOpen,
    podcast: Headphones,
  }[type];

  return (
    <div className="flex items-center gap-3 border-t border-lm-border pt-3">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg text-lm-fg-inverse ${palette}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-lm-fg">{title}</div>
        <div className="text-xs text-lm-fg-muted">{meta}</div>
      </div>
      <Plus className="h-4 w-4 text-lm-fg-subtle" />
    </div>
  );
}
