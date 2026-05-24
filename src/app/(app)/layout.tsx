import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hoSoRepo } from "@/lib/repositories/ho_so.repo";
import { Header } from "./_components/header";

/**
 * Layout chung cho route group (app). Check session, fetch ho_so cho
 * header user menu, render shell.
 *
 * Mọi page con đã có user authenticated khi render.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Đọc thêm ho_so 1 lần ở layout để tránh re-fetch ở header mỗi page.
  // RLS đảm bảo chỉ trả về hàng của user hiện tại.
  const hoSo = await hoSoRepo.layHoSoHienTai(supabase);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        email={user.email ?? ""}
        ten_hien_thi={hoSo?.ten_hien_thi ?? null}
        url_avatar={hoSo?.url_avatar ?? null}
      />
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
