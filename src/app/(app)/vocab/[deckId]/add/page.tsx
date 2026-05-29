import { redirect } from "next/navigation";
import Link from "next/link";
import { luuTuVungAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon } from "lucide-react";

export default async function AddVocabWordPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/vocab/${deckId}`}>
          <Button variant="ghost" size="icon" aria-label="Quay lại">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="lm-h3">Thêm từ mới</h1>
          <p className="text-sm text-muted-foreground">Lưu từ vào bộ từ để ôn bằng spaced repetition.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin từ vựng</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={themTuFormAction.bind(null, deckId)} className="space-y-4">
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Từ gốc</span>
              <input
                name="tu_goc"
                required
                maxLength={128}
                placeholder="VD: sophisticated"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Loại từ</span>
                <input
                  name="loai_tu"
                  maxLength={32}
                  placeholder="adjective"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Phiên âm</span>
                <input
                  name="phien_am"
                  maxLength={128}
                  placeholder="/səˈfɪstɪkeɪtɪd/"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            </div>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Nghĩa tiếng Việt</span>
              <input
                name="nghia_vi"
                maxLength={512}
                placeholder="tinh tế, phức tạp"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Ví dụ</span>
              <textarea
                name="vi_du"
                rows={3}
                placeholder="She has a sophisticated understanding of culture."
                className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2 outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <Button type="submit">Lưu từ</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

async function themTuFormAction(deckId: string, formData: FormData) {
  "use server";

  const viDu = String(formData.get("vi_du") ?? "").trim();
  const result = await luuTuVungAction({
    bo_tu_id: deckId,
    tu_goc: String(formData.get("tu_goc") ?? ""),
    loai_tu: String(formData.get("loai_tu") ?? "") || undefined,
    phien_am: String(formData.get("phien_am") ?? "") || undefined,
    nghia_vi: String(formData.get("nghia_vi") ?? "") || undefined,
    vi_du: viDu ? [{ en: viDu, vi: "" }] : undefined,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  redirect(`/vocab/${deckId}`);
}
