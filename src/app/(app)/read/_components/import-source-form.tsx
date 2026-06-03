"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LoaderIcon, GlobeIcon, LinkIcon } from "lucide-react";

type SourceType = "youtube" | "bai_bao" | "podcast";

type SuggestedSource = {
  title: string;
  description: string;
  url: string;
  type: SourceType;
};

const SUGGESTED_SOURCES: Record<string, SuggestedSource[]> = {
  "Nguồn đọc ổn định": [
    {
      title: "Simple Wikipedia — Artificial intelligence",
      description: "B1 · Bài viết tĩnh, tiếng Anh đơn giản, dễ trích xuất",
      url: "https://simple.wikipedia.org/wiki/Artificial_intelligence",
      type: "bai_bao",
    },
    {
      title: "Simple Wikipedia — English language",
      description: "A2-B1 · Kiến thức nền, câu ngắn, nội dung công khai",
      url: "https://simple.wikipedia.org/wiki/English_language",
      type: "bai_bao",
    },
    {
      title: "MDN Glossary — HTML",
      description: "B1 · Từ vựng công nghệ, trang tĩnh, cấu trúc rõ",
      url: "https://developer.mozilla.org/en-US/docs/Glossary/HTML",
      type: "bai_bao",
    },
  ],
  "YouTube có thể có transcript": [
    {
      title: "TED-Ed — Benefits of a bilingual brain",
      description: "B1-B2 · Não bộ, song ngữ, thường có phụ đề tiếng Anh",
      url: "https://www.youtube.com/watch?v=MMmOLN5zBLY",
      type: "youtube",
    },
    {
      title: "TED — How language shapes the way we think",
      description: "B2 · Ngôn ngữ và tư duy, thường có phụ đề tiếng Anh",
      url: "https://www.youtube.com/watch?v=RKK7wGAYP6k",
      type: "youtube",
    },
    {
      title: "TED — Your body language may shape who you are",
      description: "B2 · Giao tiếp, thuyết trình, thường có phụ đề tiếng Anh",
      url: "https://www.youtube.com/watch?v=Ks-_Mh1QhMc",
      type: "youtube",
    },
    {
      title: "TED — How to speak so that people want to listen",
      description: "B1-B2 · Speaking, thuyết trình, thường có phụ đề tiếng Anh",
      url: "https://www.youtube.com/watch?v=eIho2S0ZahI",
      type: "youtube",
    },
    {
      title: "TED — Grit: the power of passion and perseverance",
      description: "B1-B2 · Học tập, động lực, thường có phụ đề tiếng Anh",
      url: "https://www.youtube.com/watch?v=H14bBuluwB8",
      type: "youtube",
    },
    {
      title: "TED — Inside the mind of a master procrastinator",
      description: "B2 · Hài hước, thói quen học tập, thường có phụ đề tiếng Anh",
      url: "https://www.youtube.com/watch?v=arj7oStGLkU",
      type: "youtube",
    },
  ],
};

export function ImportSourceForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const detectedType = useMemo(() => detectType(url), [url]);

  async function handleImport() {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    setError("");

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(trimmedUrl);
    } catch {
      setError("URL không hợp lệ. Hãy dán link bài báo hoặc video YouTube.");
      return;
    }

    setLoading(true);

    try {
      const type = detectType(parsedUrl.toString());

      if (type === "youtube" && !isYouTubeVideoUrl(parsedUrl)) {
        throw new Error("Hãy dán link video YouTube cụ thể, không dùng link kênh hoặc playlist.");
      }

      const res = await fetch("/api/ai/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: parsedUrl.toString(), type }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(formatImportError(data.error, data.code));
      }

      const data = await res.json();
      router.push(`/read/${data.sourceId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-lm-border bg-lm-bg-elev-1">
      <CardContent className="pt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-lm-border bg-lm-bg-muted px-3 py-2">
            <LinkIcon className="h-4 w-4 text-lm-fg-muted" />
            <Input
              placeholder="Dán URL bài đọc công khai, ví dụ Simple Wikipedia hoặc MDN Glossary"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleImport()}
              className="h-6 border-0 bg-transparent px-0 py-0 text-sm focus-visible:border-transparent focus-visible:ring-0"
            />
          </div>
          <Button
            className="w-full sm:w-auto"
            onClick={handleImport}
            disabled={!url.trim() || loading}
          >
            {loading ? (
              <>
                <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                Đang trích nội dung...
              </>
            ) : (
              <>
                <GlobeIcon className="h-4 w-4 mr-2" />
                Trích xuất
              </>
            )}
          </Button>
        </div>

        {url.trim() ? <p className="text-xs text-lm-fg-muted">{helperTextForType(detectedType)}</p> : null}
        {error && <p className="text-xs text-lm-danger-ink">{error}</p>}

        <div className="space-y-3 rounded-xl border border-lm-border bg-lm-bg-muted p-3">
          <div>
            <p className="text-sm font-semibold text-lm-fg">Gợi ý nguồn phù hợp</p>
            <p className="text-xs text-lm-fg-muted">
              Chọn một link mẫu để điền nhanh, Lumio chỉ trích xuất khi bạn bấm “Trích xuất”.
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {Object.entries(SUGGESTED_SOURCES).map(([group, sources]) => (
              <div key={group} className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-lm-fg-muted">{group}</p>
                <div className="space-y-2">
                  {sources.map((source) => (
                    <button
                      key={source.url}
                      type="button"
                      onClick={() => {
                        setUrl(source.url);
                        setError("");
                      }}
                      className="w-full rounded-lg border border-lm-border bg-lm-bg-elev-1 px-3 py-2 text-left transition-all hover:border-lm-primary/50 hover:bg-lm-primary-soft/40"
                    >
                      <span className="block text-sm font-medium text-lm-fg">{source.title}</span>
                      <span className="mt-0.5 block text-xs text-lm-fg-muted">{source.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function detectType(rawUrl: string): SourceType {
  try {
    const hostname = new URL(rawUrl.trim()).hostname.toLowerCase();
    if (hostname === "youtu.be" || hostname.endsWith("youtube.com")) return "youtube";
    if (hostname.includes("spotify") || hostname.includes("podcast")) return "podcast";
    return "bai_bao";
  } catch {
    return "bai_bao";
  }
}

function isYouTubeVideoUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();
  if (hostname === "youtu.be") return /^[a-zA-Z0-9_-]{11}$/.test(url.pathname.slice(1));
  if (!hostname.endsWith("youtube.com")) return false;

  if (url.pathname === "/watch") {
    return /^[a-zA-Z0-9_-]{11}$/.test(url.searchParams.get("v") ?? "");
  }

  return /^\/(embed|shorts|live)\/[a-zA-Z0-9_-]{11}$/.test(url.pathname);
}

function formatImportError(error: unknown, code: unknown): string {
  const message = typeof error === "string" ? error : "Lỗi khi trích nội dung";
  if (code === "NO_TRANSCRIPT") return `${message} Thử video khác có phụ đề tiếng Anh.`;
  if (code === "INVALID_URL") return `${message} Hãy dùng link bài viết công khai hoặc video YouTube cụ thể.`;
  if (code === "ARTICLE_EXTRACTION_FAILED") return `${message} Thử nguồn đọc công khai khác.`;
  if (code === "FETCH_TIMEOUT") return `${message} Hãy thử nguồn khác.`;
  return message;
}

function helperTextForType(type: SourceType): string {
  if (type === "youtube") return "YouTube cần video có phụ đề/transcript tiếng Anh để Lumio trích xuất được.";
  if (type === "podcast") return "Podcast transcript chưa hỗ trợ trong phiên bản này. Hãy dùng bài báo hoặc video YouTube.";
  return "Một số bài báo có paywall hoặc chặn bot có thể không trích xuất được nội dung.";
}

export function SourceCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-lm-border bg-lm-bg-elev-1 p-3">
      <div className="text-lm-fg-muted">{icon}</div>
      <div>
        <p className="text-sm font-semibold text-lm-fg">{title}</p>
        <p className="text-xs text-lm-fg-muted">{desc}</p>
      </div>
    </div>
  );
}

export { SourceCard as SupportedSourceCard };
