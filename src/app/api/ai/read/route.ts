import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { contentRepo } from "@/lib/repositories/nguon_noi_dung.repo";
import {
  createContentExtractor,
  detectSourceType,
  hashNormalizedUrl,
  normalizeImportUrl,
} from "@/lib/content/extractors";
import { ContentExtractionError, type ContentSourceType } from "@/lib/content/types";

const ImportReadSchema = z.object({
  url: z.string().trim().url("URL không hợp lệ"),
  type: z.enum(["youtube", "bai_bao", "podcast", "thu_cong"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ImportReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ", code: "INVALID_URL" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập", code: "UNAUTHENTICATED" }, { status: 401 });
    }

    const normalizedUrl = normalizeImportUrl(parsed.data.url);
    const type = resolveSourceType(parsed.data.type, normalizedUrl);
    const maBamUrl = hashNormalizedUrl(normalizedUrl);

    const existing = await contentRepo.timTheoUrl(supabase, user.id, maBamUrl);
    if (existing) {
      return NextResponse.json({ sourceId: existing.id, deduplicated: true });
    }

    const extractor = createContentExtractor(type, normalizedUrl);
    const extracted = await extractor.extract();
    const nguon = await contentRepo.taoNguon(supabase, {
      nguoi_dung_id: user.id,
      loai: extracted.loai,
      url: extracted.url,
      ma_bam_url: maBamUrl,
      tieu_de: extracted.tieu_de,
      tac_gia: extracted.tac_gia,
      url_anh_bia: extracted.url_anh_bia,
      thoi_luong_giay: extracted.thoi_luong_giay,
      ngon_ngu: extracted.ngon_ngu,
      ban_ghi_loi: extracted.ban_ghi_loi,
    });

    if (extracted.doans.length > 0) {
      await contentRepo.luuDoan(supabase, nguon.id, extracted.doans);
    }

    return NextResponse.json({ sourceId: nguon.id, deduplicated: false });
  } catch (err) {
    if (err instanceof ContentExtractionError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }

    console.error("[api/ai/read] Error:", err);
    return NextResponse.json({ error: "Lỗi khi trích nội dung", code: "INTERNAL_ERROR" }, { status: 500 });
  }
}

function resolveSourceType(type: ContentSourceType | undefined, url: URL): ContentSourceType {
  return type ?? detectSourceType(url);
}
