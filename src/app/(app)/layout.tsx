import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Layout cho route group (app) — toàn bộ app behind auth.
 * Check session ở mọi page, redirect /login nếu chưa đăng nhập.
 * Header + sidebar tạm thời placeholder; sẽ build trong UC riêng.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-slate-900">Lumio</span>
          <span className="text-sm text-slate-600">{user.email}</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
