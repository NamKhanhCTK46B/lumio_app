import type { ReactNode } from "react";
import { NavTabs } from "./_components/nav-tabs";

/**
 * Layout chung cho /settings/* — sidebar tabs trái, nội dung phải.
 * Auth check đã có ở (app)/layout.tsx parent.
 */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[200px_1fr]">
      <aside>
        <h2 className="mb-3 px-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Cài đặt
        </h2>
        <NavTabs />
      </aside>

      <section>{children}</section>
    </div>
  );
}
