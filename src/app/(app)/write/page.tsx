import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  baiVietRepo,
  type BaiVietRow,
  type DeBaiRow,
} from "@/lib/repositories/bai_viet.repo";
import { taoNhapAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

/**
 * UC13 — trang /write index. Liệt kê:
 *  1. Đề bài catalog để bắt đầu mới (theo loai_de).
 *  2. Bài viết gần đây (nháp + đã nộp) để tiếp tục.
 *  3. Link sang biểu đồ tiến độ (UC15).
 */

const NHAN_LOAI_DE: Record<
  "ielts_task1" | "ielts_task2" | "email" | "tu_do",
  string
> = {
  ielts_task1: "IELTS Task 1",
  ielts_task2: "IELTS Task 2",
  email: "Email",
  tu_do: "Tự do",
};

export default async function WriteIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const [danhSachDe, ganDay]: [DeBaiRow[], BaiVietRow[]] = await Promise.all([
    baiVietRepo.layDanhSachDe(supabase),
    baiVietRepo.layGanDay(supabase, 5),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="lm-h2">Luyện viết</h1>
          <p className="mt-1 text-sm text-lm-fg-muted">
            Viết essay theo đề IELTS hoặc email. AI sẽ chấm theo rubric IELTS
            Writing.
          </p>
        </div>
        <Link href="/write/progress">
          <Button
            variant="ghost"
            size="sm"
            className="text-lm-fg-muted hover:text-lm-fg"
          >
            Xem biểu đồ tiến độ →
          </Button>
        </Link>
      </header>

      {error && (
        <div className="rounded-md border border-lm-danger-soft bg-lm-danger-soft px-4 py-2 text-sm text-lm-danger-ink">
          {error}
        </div>
      )}

      {ganDay.length > 0 && (
        <section className="space-y-3">
          <h2 className="lm-h4">Tiếp tục bài gần đây</h2>
          <div className="grid gap-2">
            {ganDay.map((b) => (
              <Card key={b.id} className="border-lm-border bg-lm-bg-elev-1">
                <CardContent className="flex items-center justify-between gap-3 py-3">
                  <Link
                    href={
                      b.nop_luc ? `/write/${b.id}/result` : `/write/${b.id}`
                    }
                    className="min-w-0 flex-1 truncate text-sm font-semibold text-lm-fg hover:text-lm-primary"
                  >
                    <span className="mr-2 rounded bg-lm-bg-muted px-2 py-0.5 text-xs text-lm-fg-muted">
                      {NHAN_LOAI_DE[b.loai_de as keyof typeof NHAN_LOAI_DE] ??
                        b.loai_de}
                    </span>
                    {b.de_bai_snapshot}
                  </Link>
                  <div className="ml-3 shrink-0 text-xs text-lm-fg-muted">
                    {b.nop_luc ? (
                      <span className="rounded-full bg-lm-success-soft px-2 py-0.5 text-lm-success-ink">
                        Band {b.diem_tong?.toFixed(1) ?? "?"}
                      </span>
                    ) : (
                      <span>Nháp · {b.so_tu} từ</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="lm-h4">Chọn đề mới</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {danhSachDe.map((de) => (
            <Card key={de.id} className="border-lm-border bg-lm-bg-elev-1">
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded bg-lm-primary-soft px-2 py-0.5 text-lm-primary-ink">
                    {NHAN_LOAI_DE[de.loai_de] ?? de.loai_de}
                  </span>
                  {de.cefr_phu_hop && (
                    <span className="rounded bg-lm-bg-muted px-2 py-0.5 text-lm-fg-muted">
                      {de.cefr_phu_hop}
                    </span>
                  )}
                  {de.chu_de && (
                    <span className="text-lm-fg-muted">· {de.chu_de}</span>
                  )}
                </div>
                <p className="text-sm text-lm-fg">{de.de_bai}</p>
                <form action={taoNhapAction} className="mt-1">
                  <input type="hidden" name="de_bai_id" value={de.id} />
                  <input type="hidden" name="loai_de" value={de.loai_de} />
                  <Button type="submit" variant="link" size="xs">
                    Bắt đầu viết →
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card className="border-dashed border-lm-border bg-lm-bg-muted">
          <CardContent className="space-y-3">
            <h2 className="lm-h4">Hoặc viết theo đề tự do</h2>
            <form action={taoNhapAction} className="space-y-3">
              <input type="hidden" name="loai_de" value="tu_do" />
              <Textarea
                name="de_bai_tu_do"
                placeholder="Nhập đề bài bạn muốn viết..."
                rows={3}
                required
                minLength={10}
              />
              <Button type="submit">Bắt đầu</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
