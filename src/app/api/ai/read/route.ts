/**
 * API route trích nội dung từ URL (YouTube, article, podcast).
 *
 * POST /api/ai/read
 * Body: { url: string, type: "youtube" | "article" | "podcast" }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { contentRepo } from "@/lib/repositories/nguon_noi_dung.repo";
import crypto from "crypto";

const ImportReadSchema = z.object({
  url: z.string().trim().url("URL không hợp lệ"),
  type: z.enum(["youtube", "bai_bao", "podcast", "thu_cong"]).optional(),
});

// ---------------------------------------------------------------------------
// Content extractor helpers
// ---------------------------------------------------------------------------

/**
 * Tạo hash ổn định từ URL để dedup.
 */
export function hashUrl(url: string): string {
  return crypto.createHash("sha256").update(url.trim().toLowerCase()).digest("hex").slice(0, 64);
}

/**
 * Extract YouTube video ID từ URL.
 */
function layYouTubeId(url: string): string | null {
  const match =
    url.match(/youtube\.com\/watch\?v=([^&]+)/) ??
    url.match(/youtu\.be\/([^?]+)/) ??
    url.match(/youtube\.com\/embed\/([^?]+)/);
  return match?.[1] ?? null;
}

/**
 * Tách transcript từ YouTube qua transcript API.
 * Ưu tiên auto-generated captions (zh-Hans, en) → fallback timedtext thủ công.
 *
 * API: https://youtubetranscript.com/timedtext?name=0&v={id}&lang=en
 * Hoặc: https://www.youtube.com/api/timedtext?lang=en&v={id}&fmt=json3
 *
 * Trả về array các đoạn có timestamp, hoặc null nếu không có caption.
 */
async function layYouTubeTranscript(videoId: string): Promise<{
  tieu_de: string;
  doans: Array<{ thu_tu_doan: number; giay_bat_dau: number; giay_ket_thuc: number; noi_dung: string }>;
} | null> {
  // Lấy title từ oEmbed
  let tieu_de = "YouTube Video";
  try {
    const oembed = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (oembed.ok) {
      const info = (await oembed.json()) as { title?: string };
      tieu_de = info.title ?? tieu_de;
    }
  } catch {
    // Bỏ qua lỗi title
  }

  // Thử timedtext với danh sách ngôn ngữ ưu tiên
  const langs = ["en", "en-US", "en-GB"];
  for (const lang of langs) {
    const result = await layYouTubeTimedText(videoId, lang);
    if (result) return { tieu_de, doans: result };
  }

  return { tieu_de, doans: [] };
}

/**
 * Gọi YouTube timedtext API và parse XML thành array segments.
 */
async function layYouTubeTimedText(
  videoId: string,
  lang: string,
): Promise<Array<{
  thu_tu_doan: number;
  giay_bat_dau: number;
  giay_ket_thuc: number;
  noi_dung: string;
}> | null> {
  try {
    const url = `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=json3`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });

    if (!res.ok) return null;

    const json = await res.text();

    // Parse JSON3 timedtext format
    type TimedTextEvent = {
      tStartMs: number;
      dDurationMs?: number;
      aAppend: Array<{ tStartMs: number; dDurationMs: number; aText: string }>;
    };

    let events: TimedTextEvent[] = [];
    try {
      const parsed = JSON.parse(json) as { events?: TimedTextEvent[] };
      events = parsed.events ?? [];
    } catch {
      // Not JSON3 — có thể là XML hoặc empty
      return null;
    }

    const segments: Array<{
      thu_tu_doan: number;
      giay_bat_dau: number;
      giay_ket_thuc: number;
      noi_dung: string;
    }> = [];

    let idx = 0;
    for (const event of events) {
      if (!event.aAppend || event.aAppend.length === 0) continue;

      for (const seg of event.aAppend) {
        const startSec = seg.tStartMs / 1000;
        const durationSec = (seg.dDurationMs ?? 2000) / 1000;
        const text = (seg.aText ?? "").trim();

        if (!text) continue;

        segments.push({
          thu_tu_doan: ++idx,
          giay_bat_dau: Math.round(startSec * 100) / 100,
          giay_ket_thuc: Math.round((startSec + durationSec) * 100) / 100,
          noi_dung: text,
        });
      }
    }

    return segments.length > 0 ? segments : null;
  } catch {
    return null;
  }
}

/**
 * Extract article content qua Readability.
 */
async function layArticleContent(url: string): Promise<{
  tieu_de: string;
  noi_dung: string;
  tac_gia?: string;
} | null> {
  try {
    // Sanitize URL — chỉ cho phép http/https
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Chỉ hỗ trợ http/https");
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 Lumio-App/1.0" },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const html = await res.text();

    // Extract title
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch?.[1]?.replace(/\s*[-|]\s*.*$/, "").trim() ?? "Untitled";

    // Extract main text (simplified Readability-lite)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (!bodyMatch) return { tieu_de: title, noi_dung: "" };

    const text = bodyMatch[1]
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return { tieu_de: title, noi_dung: text.slice(0, 20000) };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ImportReadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dữ liệu không hợp lệ" }, { status: 400 });
    }

    const { url, type } = parsed.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const maBamUrl = hashUrl(url);

    // Dedup — nếu đã có thì redirect
    const existing = await contentRepo.timTheoUrl(supabase, user.id, maBamUrl);
    if (existing) {
      return NextResponse.json({ sourceId: existing.id, deduplicated: true });
    }

    let tieu_de = "Nguồn không xác định";
    let transcript = "";

    if (type === "youtube" || url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = layYouTubeId(url);
      if (videoId) {
        const yt = await layYouTubeTranscript(videoId);
        if (yt) {
          tieu_de = yt.tieu_de;
          transcript = yt.doans.map((d) => d.noi_dung).join("\n");
          // Lưu đoạn transcript ngay nếu có
          if (yt.doans.length > 0) {
            const nguon = await contentRepo.taoNguon(supabase, {
              nguoi_dung_id: user.id,
              loai: "youtube",
              url,
              ma_bam_url: maBamUrl,
              tieu_de,
              ngon_ngu: "en",
              ban_ghi_loi: transcript || undefined,
            });
            await contentRepo.luuDoan(supabase, nguon.id, yt.doans);
            return NextResponse.json({ sourceId: nguon.id, deduplicated: false });
          }
        }
      }
    } else {
      const article = await layArticleContent(url);
      if (article) {
        tieu_de = article.tieu_de;
        transcript = article.noi_dung;
      }
    }

    // Save source
    const nguon = await contentRepo.taoNguon(supabase, {
      nguoi_dung_id: user.id,
      loai: type ?? "bai_bao",
      url,
      ma_bam_url: maBamUrl,
      tieu_de,
      ngon_ngu: "en",
      ban_ghi_loi: transcript || undefined,
    });

    return NextResponse.json({ sourceId: nguon.id, deduplicated: false });
  } catch (err) {
    console.error("[api/ai/read] Error:", err);
    return NextResponse.json({ error: "Lỗi khi trích nội dung" }, { status: 500 });
  }
}
