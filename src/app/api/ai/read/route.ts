/**
 * API route trích nội dung từ URL (YouTube, article, podcast).
 *
 * POST /api/ai/read
 * Body: { url: string, type: "youtube" | "article" | "podcast" }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { contentRepo } from "@/lib/repositories/nguon_noi_dung.repo";
import crypto from "crypto";

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
 * Fetch transcript từ YouTube qua youtube-transcript-api.
 * Fallback: trả về placeholder.
 */
async function layYouTubeTranscript(videoId: string): Promise<{
  tieu_de: string;
  transcript: string;
  doans: Array<{ thu_tu_doan: number; giay_bat_dau: number; giay_ket_thuc: number; noi_dung: string }>;
} | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=json3`,
      { signal: AbortSignal.timeout(10000) },
    );

    if (!res.ok) return null;

    const text = await res.text();
    // Parse YouTube TTML/XML transcript — simplified
    // For real implementation, use youtube-transcript npm package
    const titleMatch = text.match(/<title>(.*?)<\/title>/);
    const title = titleMatch?.[1] ?? "YouTube Video";

    return {
      tieu_de: title,
      transcript: text.slice(0, 5000), // Placeholder
      doans: [],
    };
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

    let text = bodyMatch[1]
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
    const { url, type } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Thiếu URL" }, { status: 400 });
    }

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
          transcript = yt.transcript;
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
