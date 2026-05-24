"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Sidebar tabs cho /settings. Client Component vì cần `usePathname` để
 * highlight tab active. Không cần state khác.
 *
 * Mở rộng tab mới: thêm vào TABS array. Mỗi tab là 1 route segment
 * thực tế (tránh client-only state — sai khi user reload trang).
 */
const TABS: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/settings/profile", label: "Hồ sơ" },
  { href: "/settings/password", label: "Mật khẩu" },
];

export function NavTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Cài đặt">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={[
              "rounded-md px-3 py-2 text-sm transition",
              active
                ? "bg-amber-100 font-medium text-amber-900"
                : "text-slate-700 hover:bg-slate-100",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
