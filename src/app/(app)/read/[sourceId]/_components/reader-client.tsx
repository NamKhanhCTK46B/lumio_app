"use client";

import { useState } from "react";
import { luuTuVungAction } from "../../../vocab/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TtsButton } from "@/components/app/tts-button";
import { StarIcon, BookOpenIcon } from "lucide-react";
import { toast } from "sonner";

type WordSelection = {
  word: string;
  context: string;
};

export function ReaderClient({
  sourceId,
  content,
}: {
  sourceId: string;
  content: string;
}) {
  const [selectedWord, setSelectedWord] = useState<WordSelection | null>(null);
  const [savingWord, setSavingWord] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  function onWordClick(rawWord: string, context: string) {
    const word = normalizeWord(rawWord);
    if (!word) return;

    setSelectedWord({ word, context });
  }

  async function onSaveWord() {
    if (!selectedWord) return;
    setSavingWord(true);

    const result = await luuTuVungAction({
      tu_goc: selectedWord.word,
      ngu_canh: selectedWord.context,
      nguon_id: sourceId,
    });

    setSavingWord(false);

    if (result.ok) {
      setSavedWords((prev) => new Set([...prev, selectedWord.word.toLowerCase()]));
      setSelectedWord(null);
      toast.success(`Đã lưu "${selectedWord.word}"`);
      return;
    }

    toast.error(result.error?.includes("duplicate") ? "Từ này đã có trong kho từ của bạn" : result.error ?? "Lỗi khi lưu từ");
  }

  // Split content into paragraphs
  const paragraphs = content.split(/\n+/).filter((p) => p.trim().length > 0);

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="rounded-lg bg-lm-primary-soft p-4">
        <p className="text-sm text-lm-primary-ink">
          <strong>Cách học:</strong> Click vào bất kỳ từ nào để lưu vào danh sách từ vựng của bạn.
        </p>
      </div>

      {/* Reading area */}
      <div className="lm-reading space-y-4">
        {paragraphs.map((para, i) => (
          <p key={i}>
            {para.split(/(\s+)/).map((segment, j) => {
              const word = normalizeWord(segment);
              if (!word) return <span key={j}>{segment}</span>;

              const isSaved = savedWords.has(word.toLowerCase());
              return (
                <span
                  key={j}
                  onClick={() => onWordClick(word, para)}
                  className={`lm-vocab-highlight ${isSaved ? "opacity-70" : ""}`}
                  title={`Lưu từ "${word}"`}
                >
                  {segment}
                </span>
              );
            })}
          </p>
        ))}
      </div>

      {/* Word popup */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <Card className="max-w-sm w-full shadow-xl">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold">{selectedWord.word}</h3>
                  <p className="text-sm text-muted-foreground">Nhấn để lưu từ này</p>
                </div>
                <TtsButton text={selectedWord.word} size="sm" />
              </div>

              {selectedWord.context && (
                <div className="rounded-lg bg-lm-bg-muted p-3">
                  <p className="text-sm lm-example">
                    {selectedWord.context}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedWord(null)}
                >
                  Huỷ
                </Button>
                <Button
                  className="flex-1 gap-1.5"
                  onClick={onSaveWord}
                  disabled={savingWord}
                >
                  {savingWord ? (
                    "Đang lưu..."
                  ) : (
                    <>
                      <StarIcon className="h-4 w-4" />
                      Lưu từ
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {paragraphs.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent className="space-y-3">
            <BookOpenIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">
              Chưa có nội dung để hiển thị.
            </p>
            <p className="text-xs text-muted-foreground">
              Nội dung sẽ được trích khi nguồn được nhập.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function normalizeWord(word: string) {
  return word
    .trim()
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "")
    .toLowerCase();
}
