"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { dangXuatAction } from "../actions";

/**
 * Dropdown menu cho user ở header — avatar/email + link tới settings + logout.
 *
 * Client Component vì cần state open/close + click-outside dismiss.
 * Tránh import Radix Dropdown ở đây (over-kill cho 3 menu item) — vanilla
 * popover đơn giản đủ dùng.
 */
type Props = {
  email: string;
  ten_hien_thi: string | null;
  url_avatar: string | null;
};

export function UserMenu({ email, ten_hien_thi, url_avatar }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const chu_dau = (ten_hien_thi?.[0] ?? email[0] ?? "?").toUpperCase();

  // Click-outside dismiss — đóng menu khi user click ra ngoài.
  useEffect(() => {
    if (!open) return;
    function khiClickNgoai(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", khiClickNgoai);
    return () => document.removeEventListener("mousedown", khiClickNgoai);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-lm-border bg-lm-bg-elev-1 p-1 pr-2 text-sm transition hover:border-lm-primary"
      >
        <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-lm-primary-soft text-xs font-semibold text-lm-primary-ink">
          {url_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- Storage URL ngoài
            <img
              src={url_avatar}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            chu_dau
          )}
        </span>
        <span className="hidden text-lm-fg sm:block">
          {ten_hien_thi ?? email}
        </span>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-10 mt-2 w-56 overflow-hidden rounded-md border border-lm-border bg-lm-bg-elev-1 shadow-(--lm-shadow-pop)"
        >
          <div className="border-b border-lm-border px-4 py-3 text-xs text-lm-fg-subtle">
            Đăng nhập với
            <div className="mt-0.5 truncate text-sm text-lm-fg">{email}</div>
          </div>
          <Link
            href="/settings/profile"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-lm-fg transition hover:bg-lm-bg-muted"
          >
            Hồ sơ cá nhân
          </Link>
          <Link
            href="/settings/password"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-lm-fg transition hover:bg-lm-bg-muted"
          >
            Đổi mật khẩu
          </Link>
          <form action={dangXuatAction} className="border-t border-lm-border">
            <button
              type="submit"
              role="menuitem"
              className="w-full px-4 py-2 text-left text-sm text-lm-danger-ink transition hover:bg-lm-danger-soft"
            >
              Đăng xuất
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
