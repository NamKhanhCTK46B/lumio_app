import crypto from "crypto";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { fullTextFromSegments, groupTranscriptSegments, segmentsFromArticleText } from "./segment";
import {
  ContentExtractionError,
  type ContentExtractor,
  type ContentSourceType,
  type ExtractedContent,
  type ExtractedSegment,
} from "./types";

const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 5_000_000;
const PODCAST_HOSTS = new Set(["spotify.com", "open.spotify.com", "podcasts.apple.com"]);

export function normalizeImportUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl.trim());
  } catch {
    throw new ContentExtractionError("INVALID_URL", "URL không hợp lệ", 400);
  }

  if (!isSafeHttpUrl(url)) {
    throw new ContentExtractionError("INVALID_URL", "URL này không được hỗ trợ hoặc không an toàn", 400);
  }

  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return new URL(`https://www.youtube.com/watch?v=${videoId}`);
  }

  url.hash = "";
  url.hostname = url.hostname.toLowerCase();
  return url;
}

export function detectSourceType(url: URL): ContentSourceType {
  if (getYouTubeVideoId(url)) return "youtube";
  if (isPodcastUrl(url)) return "podcast";
  return "bai_bao";
}

export function hashNormalizedUrl(url: URL): string {
  return crypto.createHash("sha256").update(url.toString().toLowerCase()).digest("hex").slice(0, 64);
}

export function createContentExtractor(type: ContentSourceType, url: URL): ContentExtractor {
  if (type === "youtube") return new YouTubeExtractor(url);
  if (type === "bai_bao") return new ArticleExtractor(url);

  return {
    async extract() {
      throw new ContentExtractionError(
        "UNSUPPORTED_SOURCE_TYPE",
        "Podcast transcript chưa được hỗ trợ. Bạn có thể nhập bài báo hoặc video YouTube có phụ đề tiếng Anh.",
      );
    },
  };
}

class YouTubeExtractor implements ContentExtractor {
  constructor(private readonly url: URL) {}

  async extract(): Promise<ExtractedContent> {
    const videoId = getYouTubeVideoId(this.url);
    if (!videoId) {
      throw new ContentExtractionError("INVALID_URL", "URL YouTube không hợp lệ", 400);
    }

    const metadata = await fetchYouTubeMetadata(videoId);
    const rawSegments = await fetchYouTubeTranscript(videoId);
    if (!rawSegments.length) {
      throw new ContentExtractionError(
        "NO_TRANSCRIPT",
        "Video này chưa có transcript tiếng Anh để trích xuất.",
      );
    }

    const doans = groupTranscriptSegments(rawSegments);
    const banGhiLoi = fullTextFromSegments(doans);

    return {
      loai: "youtube",
      url: `https://www.youtube.com/watch?v=${videoId}`,
      tieu_de: metadata.title,
      tac_gia: metadata.author,
      url_anh_bia: metadata.thumbnailUrl,
      ngon_ngu: "en",
      ban_ghi_loi: banGhiLoi,
      doans,
    };
  }
}

class ArticleExtractor implements ContentExtractor {
  constructor(private readonly url: URL) {}

  async extract(): Promise<ExtractedContent> {
    const html = await fetchArticleHtml(this.url);
    const dom = new JSDOM(html, { url: this.url.toString() });
    const parsed = new Readability(dom.window.document).parse();
    const title = parsed?.title?.trim() || dom.window.document.title?.trim() || "Bài báo";
    const textContent = parsed?.textContent?.trim() || extractFallbackText(dom);

    if (!textContent) {
      throw new ContentExtractionError(
        "ARTICLE_EXTRACTION_FAILED",
        "Không trích xuất được nội dung chính từ bài báo này.",
      );
    }

    const doans = segmentsFromArticleText(textContent);
    if (doans.length === 0) {
      throw new ContentExtractionError(
        "ARTICLE_TOO_SHORT",
        "Bài báo này quá ngắn hoặc không đủ nội dung tiếng Anh để học.",
      );
    }

    return {
      loai: "bai_bao",
      url: this.url.toString(),
      tieu_de: title,
      tac_gia: parsed?.byline?.trim() || undefined,
      url_anh_bia: findOgImage(dom),
      ngon_ngu: dom.window.document.documentElement.lang || "en",
      ban_ghi_loi: fullTextFromSegments(doans),
      doans,
    };
  }
}

function getYouTubeVideoId(url: URL): string | null {
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be") return cleanVideoId(url.pathname.slice(1));
  if (!host.endsWith("youtube.com")) return null;

  if (url.pathname === "/watch") return cleanVideoId(url.searchParams.get("v") ?? "");

  const match = url.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/);
  return cleanVideoId(match?.[2] ?? "");
}

function cleanVideoId(value: string): string | null {
  const id = value.trim().match(/^[a-zA-Z0-9_-]{11}$/)?.[0];
  return id ?? null;
}

function isPodcastUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return PODCAST_HOSTS.has(host) || host.includes("podcast") || url.pathname.toLowerCase().includes("podcast");
}

function isSafeHttpUrl(url: URL): boolean {
  if (!["http:", "https:"].includes(url.protocol)) return false;

  const host = url.hostname.toLowerCase();
  if (!host || host === "localhost" || host.endsWith(".localhost") || host === "::1") return false;
  if (host === "0.0.0.0") return false;
  if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false;
  if (/^(fc|fd|fe80):/i.test(host)) return false;

  return true;
}

async function fetchYouTubeMetadata(videoId: string): Promise<{
  title: string;
  author?: string;
  thumbnailUrl?: string;
}> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok) return { title: "YouTube Video" };

    const data = (await response.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };

    return {
      title: data.title ?? "YouTube Video",
      author: data.author_name,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch {
    return { title: "YouTube Video" };
  }
}

async function fetchYouTubeTranscript(videoId: string): Promise<ExtractedSegment[]> {
  for (const lang of ["en", "en-US", "en-GB"]) {
    const segments = await fetchYouTubeTimedText(videoId, lang);
    if (segments.length > 0) return segments;
  }

  return [];
}

async function fetchYouTubeTimedText(videoId: string, lang: string): Promise<ExtractedSegment[]> {
  try {
    const response = await fetch(
      `https://www.youtube.com/api/timedtext?lang=${lang}&v=${videoId}&fmt=json3`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!response.ok) return [];

    const parsed = (await response.json()) as {
      events?: Array<{
        tStartMs?: number;
        dDurationMs?: number;
        aAppend?: Array<{ tStartMs?: number; dDurationMs?: number; aText?: string }>;
      }>;
    };

    const segments: ExtractedSegment[] = [];
    for (const event of parsed.events ?? []) {
      for (const caption of event.aAppend ?? []) {
        const text = decodeHtmlEntities(caption.aText ?? "").trim();
        if (!text) continue;

        const startMs = (event.tStartMs ?? 0) + (caption.tStartMs ?? 0);
        const durationMs = caption.dDurationMs ?? event.dDurationMs ?? 2_000;
        segments.push({
          thu_tu_doan: segments.length + 1,
          giay_bat_dau: roundSeconds(startMs / 1000),
          giay_ket_thuc: roundSeconds((startMs + durationMs) / 1000),
          noi_dung: text,
        });
      }
    }

    return segments;
  } catch {
    return [];
  }
}

async function fetchArticleHtml(url: URL): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 Lumio-App/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  }).catch((error: unknown) => {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ContentExtractionError("FETCH_TIMEOUT", "Trang này phản hồi quá lâu. Vui lòng thử nguồn khác.", 422);
    }
    if (isFetchNetworkError(error)) {
      throw new ContentExtractionError(
        "ARTICLE_EXTRACTION_FAILED",
        "Không thể kết nối tới trang này. Hãy kiểm tra URL hoặc thử nguồn đọc công khai khác.",
      );
    }
    throw error;
  });

  if (!response.ok) {
    throw new ContentExtractionError(
      "ARTICLE_EXTRACTION_FAILED",
      "Không tải được bài báo này. Trang có thể đang chặn trích xuất tự động.",
    );
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType && !contentType.includes("text/html")) {
    throw new ContentExtractionError("ARTICLE_EXTRACTION_FAILED", "URL này không phải trang bài báo HTML.");
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_HTML_BYTES) {
    throw new ContentExtractionError("ARTICLE_EXTRACTION_FAILED", "Bài báo này quá lớn để trích xuất.");
  }

  return response.text();
}

function isFetchNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.toLowerCase().includes("fetch")) return true;

  const cause = typeof error === "object" && error !== null && "cause" in error
    ? (error as { cause?: unknown }).cause
    : null;
  const code = typeof cause === "object" && cause !== null && "code" in cause
    ? (cause as { code?: unknown }).code
    : null;

  return typeof code === "string" && ["ECONNREFUSED", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"].includes(code);
}

function extractFallbackText(dom: JSDOM): string {
  const document = dom.window.document;
  document.querySelectorAll("script, style, nav, footer, header, aside").forEach((node) => node.remove());
  const root = document.querySelector("article") ?? document.querySelector("main") ?? document.body;
  return root?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function findOgImage(dom: JSDOM): string | undefined {
  const image = dom.window.document
    .querySelector('meta[property="og:image"], meta[name="twitter:image"]')
    ?.getAttribute("content")
    ?.trim();

  if (!image) return undefined;
  try {
    return new URL(image, dom.window.location.href).toString();
  } catch {
    return undefined;
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function roundSeconds(seconds: number): number {
  return Math.round(seconds * 100) / 100;
}
