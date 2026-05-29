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
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">URL nguồn</label>
          <Input
            placeholder="https://youtube.com/watch?v=... hoặc https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="w-full"
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
              Nhập nguồn
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export function SourceCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

export { SourceCard as SupportedSourceCard };