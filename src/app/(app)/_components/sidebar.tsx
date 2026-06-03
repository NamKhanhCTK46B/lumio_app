"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Mic,
  BookText,
  PenLine,
  SpellCheck2,
  Brain,
  Settings,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
};

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tổng quan" },
  { href: "/vocab", icon: BookOpen, label: "Sổ từ" },
  { href: "/speak", icon: Mic, label: "Luyện nói" },
  { href: "/read", icon: BookText, label: "Đọc & học" },
  { href: "/write", icon: PenLine, label: "Luyện viết" },
  { href: "/grammar", icon: SpellCheck2, label: "Ngữ pháp" },
  { href: "/quiz", icon: Brain, label: "Quiz" },
] satisfies NavItem[];

const BOTTOM_NAV_ITEMS = [
  { href: "/settings/profile", icon: Settings, label: "Cài đặt" },
] as const;

/**
 * Sidebar dùng chung cho (app) route group.
 * - Desktop (md+): sidebar cố định bên trái, nền sáng.
 * - Mobile (<md): bottom tab bar cố định dưới cùng, dạng thu gọn.
 *
 * Client Component — dùng usePathname() để highlight active link.
 */
export function Sidebar({
  initialVocabCount,
  userId,
}: {
  initialVocabCount: number;
  userId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [vocabCount, setVocabCount] = useState(initialVocabCount);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`vocab-sidebar:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tu_da_luu",
          filter: `nguoi_dung_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setVocabCount((count) => count + 1);
          }
          if (payload.eventType === "DELETE") {
            setVocabCount((count) => Math.max(0, count - 1));
          }
          router.refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router, userId]);

  function laActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-lm-border md:bg-lm-bg md:px-3 md:py-5">
        <Link
          href="/dashboard"
          className="mb-4 flex items-center gap-2 px-2 text-lm-fg"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-lm-primary text-lm-fg-on-primary text-base font-bold">
            L
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Lum<span className="text-lm-primary">i</span>o
          </span>
        </Link>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = laActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-lm-primary-soft text-lm-primary-ink font-semibold"
                    : "text-lm-fg-muted hover:bg-lm-bg-muted hover:text-lm-fg",
                ].join(" ")}
              >
                <Icon size={18} className="shrink-0" />
                <span>{item.label}</span>
                {item.href === "/vocab" && vocabCount > 0 ? (
                  <span className="ml-auto rounded-full bg-lm-primary px-2 py-0.5 text-[10px] font-semibold text-lm-fg-on-primary">
                    {vocabCount > 99 ? "99+" : vocabCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <div className="rounded-xl border border-lm-border bg-lm-bg-elev-1 px-3 py-2">
            <div className="flex items-center gap-3">
              <Flame size={18} className="text-lm-primary" />
              <div>
                <div className="font-mono text-sm font-semibold text-lm-fg">
                  14
                </div>
                <div className="text-2xs text-lm-fg-muted">ngày liên tiếp</div>
              </div>
            </div>
          </div>

          <Link
            href="/settings/profile"
            className={[
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              pathname.startsWith("/settings")
                ? "bg-lm-primary-soft text-lm-primary-ink font-semibold"
                : "text-lm-fg-muted hover:bg-lm-bg-muted hover:text-lm-fg",
            ].join(" ")}
          >
            <Settings size={18} className="shrink-0" />
            <span>Cài đặt</span>
          </Link>
        </div>
      </aside>

      {/* Mobile bottom tabs */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex border-t border-lm-border bg-lm-bg md:hidden">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = laActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
                active ? "text-lm-primary-ink" : "text-lm-fg-subtle",
              ].join(" ")}
              aria-label={item.label}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = laActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition-colors",
                active ? "text-lm-primary-ink" : "text-lm-fg-subtle",
              ].join(" ")}
              aria-label={item.label}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
