import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { contentRepo } from "@/lib/repositories/nguon_noi_dung.repo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpenIcon, GlobeIcon, LinkIcon } from "lucide-react";
import { ImportSourceForm, SupportedSourceCard } from "./_components/import-source-form";

export default async function ReadPage() {
  const supabase = await createClient();
  const sources = await contentRepo.danhSachNguon(supabase);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <h1 className="lm-h2">Đọc &amp; học</h1>
        <p className="text-sm text-muted-foreground">
          Nhập URL YouTube, bài báo hoặc podcast để bắt đầu đọc và học từ vựng.
        </p>
      </div>

      <ImportSourceForm />

      <section className="space-y-3">
        <h2 className="lm-h4">Nguồn đã nhập</h2>
        {sources.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Bạn chưa nhập nguồn đọc nào.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {sources.map((source) => (
              <Link key={source.id} href={`/read/${source.id}`}>
                <Card className="transition-all hover:shadow-md hover:-translate-y-0.5">
                  <CardContent className="flex items-start justify-between gap-4 p-4">
                    <div className="min-w-0 space-y-1">
                      <p className="truncate font-medium">{source.tieu_de ?? source.url}</p>
                      <p className="truncate text-xs text-muted-foreground">{source.url}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {source.loai}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="lm-h4">Nguồn hỗ trợ</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          <SupportedSourceCard
            icon={<LinkIcon className="h-5 w-5" />}
            title="YouTube"
            desc="Transcript video"
          />
          <SupportedSourceCard
            icon={<GlobeIcon className="h-5 w-5" />}
            title="Bài báo web"
            desc="Bài viết tiếng Anh"
          />
          <SupportedSourceCard
            icon={<BookOpenIcon className="h-5 w-5" />}
            title="Podcast RSS"
            desc="Transcript podcast"
          />
        </div>
      </section>
    </div>
  );
}
