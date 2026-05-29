import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import type { HoSo } from "@/types/supabase";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [tResult, hoSoResult] = await Promise.all([
    getTranslations("nav"),
    supabase.from("ho_so").select("ten_hien_thi, trinh_do_cefr").maybeSingle(),
  ]);

  const t = tResult as unknown as (key: string) => string;
  if (hoSoResult.error) {
    console.error("Ho so fetch failed in dashboard", hoSoResult.error);
  }

  const hoSo = hoSoResult.error ? null : (hoSoResult.data as HoSo | null);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Chào {hoSo?.ten_hien_thi ?? "bạn"}
        </h1>
        <p className="text-sm text-slate-600">
          Trình độ hiện tại: <strong>{hoSo?.trinh_do_cefr ?? "—"}</strong>
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureLink href="/vocab" title="vocab" desc="SRS theo SM-2" t={t} />
        <FeatureLink href="/speak" title="speak" desc="Roleplay với AI" t={t} />
        <FeatureLink href="/read" title="read" desc="Trích từ URL" t={t} />
        <FeatureLink href="/write" title="write" desc="IELTS scoring" t={t} />
        <FeatureLink
          href="/grammar"
          title="grammar"
          desc="Sửa ngữ pháp"
          t={t}
        />
        <FeatureLink href="/quiz" title="quiz" desc="Làm quiz" t={t} />
      </section>
    </div>
  );
}

function FeatureLink({
  href,
  title,
  desc,
  t,
}: {
  href: string;
  title: string;
  desc: string;
  t: (key: string) => string;
}) {
  const label = t(title) ?? title;
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-200 bg-white p-4 transition hover:border-amber-400 hover:shadow-sm"
    >
      <h3 className="font-medium text-slate-900">{label}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
    </Link>
  );
}
