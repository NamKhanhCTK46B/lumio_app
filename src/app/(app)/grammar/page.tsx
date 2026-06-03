"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoaderIcon } from "lucide-react";
import { kiemTraGrammarAction, type GrammarResult } from "./actions";

const SAMPLE_SENTENCES = [
  { text: "I would like a cup of coffee, please.", level: "A2" },
  { text: "The weather is quite pleasant today.", level: "B1" },
  { text: "It's absolutely crucial to understand the implications.", level: "C1" },
];

export default function GrammarPage() {
  const [inputText, setInputText] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [result, setResult] = useState<GrammarResult | null>(null);
  const [error, setError] = useState("");

  async function handleCorrect(text: string) {
    if (!text.trim()) return;
    setCorrecting(true);
    setError("");
    setResult(null);

    const res = await kiemTraGrammarAction({ cau: text });
    setCorrecting(false);

    if (res.ok) {
      setResult(res.data);
    } else {
      setError(res.error);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="lm-h2">Ngữ pháp</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhập câu tiếng Anh để AI kiểm tra và sửa lỗi ngữ pháp.
        </p>
      </div>

      {/* Correct grammar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kiểm tra ngữ pháp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            className="min-h-24 resize-y"
            placeholder="Nhập câu tiếng Anh cần kiểm tra..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => handleCorrect(inputText)}
              disabled={!inputText.trim() || correcting}
            >
              {correcting ? (
                <>
                  <LoaderIcon className="h-4 w-4 mr-2 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                "Kiểm tra"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setInputText("");
                setResult(null);
                setError("");
              }}
              disabled={correcting}
            >
              Xoá
            </Button>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {result && (
            <div className="rounded-lg bg-lm-success-soft p-4 space-y-2">
              <p className="font-medium text-lm-success-ink">
                {result.corrected === "OK" ? "Câu đúng!" : "Kết quả:"}
              </p>
              {result.corrected !== "OK" && (
                <p className="font-mono text-sm bg-white/60 rounded px-2 py-1">
                  {result.corrected}
                </p>
              )}
              <p className="whitespace-pre-wrap text-sm">{result.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sample sentences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thực hành với câu mẫu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {SAMPLE_SENTENCES.map((s) => (
            <div
              key={s.text}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <p className="text-sm truncate">{s.text}</p>
                <Badge variant="outline" className="shrink-0 text-xs">{s.level}</Badge>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInputText(s.text)}
              >
                Dùng
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
