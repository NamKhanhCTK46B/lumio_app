import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

/**
 * Dashboard placeholder. Sẽ thay bằng widget streak + reminder + biểu đồ
 * tiến độ ở UC11 (Dashboard). Hiện chỉ chào user + link nhanh tới
 * các feature dự kiến.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: hoSo } = await supabase
    .from("ho_so")
    .select("ten_hien_thi, trinh_do_cefr")
    .maybeSingle();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Chào {hoSo?.ten_hien_thi ?? "bạn"} 👋
        </h1>
        <p className="text-sm text-slate-600">
          Trình độ hiện tại: <strong>{hoSo?.trinh_do_cefr ?? "—"}</strong>
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureLink href="/vocab"  title="Ôn từ vựng" desc="SRS theo SM-2" />
        <FeatureLink href="/speak"  title="Luyện nói"  desc="Roleplay với AI" />
        <FeatureLink href="/read"   title="Đọc & học"  desc="Trích từ URL"   />
        <FeatureLink href="/write"  title="Viết essay" desc="IELTS scoring"  />
      </section>

      <p className="text-xs text-slate-500">
        Trang này là placeholder bootstrap. Các feature sẽ được thêm theo UC1–UC20.
      </p>
    </div>
  );
}

function FeatureLink({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-amber-400 hover:shadow-sm"
    >
      <h3 className="font-medium text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </Link>
  );
}
