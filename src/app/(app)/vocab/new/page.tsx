import { redirect } from "next/navigation";
import Link from "next/link";
import { taoBoTuAction } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeftIcon } from "lucide-react";

export default function NewVocabDeckPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/vocab">
          <Button variant="ghost" size="icon" aria-label="Quay lại">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="lm-h3">Tạo bộ từ mới</h1>
          <p className="text-sm text-muted-foreground">Tạo bộ từ riêng để lưu từ theo chủ đề bạn cần học.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin bộ từ</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={taoBoTuFormAction} className="space-y-4">
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Tên bộ từ</span>
              <Input
                name="ten"
                required
                maxLength={64}
                placeholder="VD: IELTS Band 7 Vocabulary"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Mô tả</span>
              <Textarea
                name="mo_ta"
                maxLength={256}
                rows={3}
                placeholder="Mô tả ngắn về bộ từ này..."
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Chủ đề</span>
                <Input
                  name="chu_de"
                  maxLength={64}
                  placeholder="VD: Travel"
                />
              </label>
              <label className="block space-y-1 text-sm">
                <span className="font-medium">Màu bìa</span>
                <Input
                  name="mau_bia"
                  type="color"
                  defaultValue="#E8A33D"
                  className="px-2"
                />
              </label>
            </div>
            <Button type="submit">Tạo bộ từ</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

async function taoBoTuFormAction(formData: FormData) {
  "use server";

  const result = await taoBoTuAction({
    ten: String(formData.get("ten") ?? ""),
    mo_ta: String(formData.get("mo_ta") ?? "") || undefined,
    chu_de: String(formData.get("chu_de") ?? "") || undefined,
    mau_bia: String(formData.get("mau_bia") ?? "") || undefined,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  redirect("/vocab");
}
