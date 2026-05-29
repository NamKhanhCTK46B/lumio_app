"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { LoaderIcon, GlobeIcon, BookOpenIcon, LinkIcon } from "lucide-react";

type SourceType = "youtube" | "bai_bao" | "podcast";

export function ImportSourceForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  function detectType(u: string): SourceType {
    if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
    if (u.includes("spotify.com") || u.includes("podcast")) return "podcast";
    return "bai_bao";
  }

  async function handleImport() {
    if (!url.trim()) return;
    setError("");
    setLoading(true);

    try {
      const type = detectType(url);
      const res = await fetch("/api/ai/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, type }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Lỗi khi trích nội dung");
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
      <CardContent className="pt-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-lm-border bg-lm-bg-muted px-3 py-2">
            <LinkIcon className="h-4 w-4 text-lm-fg-muted" />
            <Input
              placeholder="https://youtube.com/watch?v=... hoặc https://..."
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

        {error && <p className="text-xs text-lm-danger-ink">{error}</p>}
      </CardContent>
    </Card>
  );
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
