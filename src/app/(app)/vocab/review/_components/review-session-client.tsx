"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { gradeReviewAction } from "../../../vocab/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TtsButton } from "@/components/app/tts-button";
import type { ReviewWordRow } from "@/lib/repositories/vocab.repo";

type ReviewState = "question" | "answer" | "done";

export function ReviewSessionClient({ words }: { words: ReviewWordRow[] }) {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<ReviewState>("question");
  const [correctCount, setCorrectCount] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const router = useRouter();

  const word = words[index];
  const progress = words.length > 0 ? (gradedCount / words.length) * 100 : 0;

  function showAnswer() {
    setState("answer");
  }

  const onGrade = useCallback(
    async (quality: 0 | 1 | 2 | 3) => {
      if (!word) return;
      const result = await gradeReviewAction({ tu_id: word.id, quality });
      if (!result.ok) return;

      setGradedCount((n) => n + 1);
      if (quality >= 2) setCorrectCount((n) => n + 1);

      if (index + 1 >= words.length) {
        setState("done");
      } else {
        setIndex((i) => i + 1);
        setState("question");
      }
    },
    [word?.id, index, words.length],
  );

  if (state === "done") {
    const pct = words.length > 0 ? Math.round((correctCount / words.length) * 100) : 0;
    return (
      <div className="py-16 text-center space-y-6">
        <div className="text-5xl font-bold text-lm-primary">
          {pct}%
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium">Hoàn thành phiên ôn!</p>
          <p className="text-sm text-muted-foreground">
            {correctCount} / {words.length} từ đúng
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/vocab")}
          >
            Quay lại
          </Button>
          <Button onClick={() => router.refresh()}>
            Ôn tiếp
          </Button>
        </div>
      </div>
    );
  }

  if (!word) return null;

  const wordExamples = Array.isArray(word.vi_du) ? word.vi_du as Array<{ en: string; vi?: string }> : [];

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{index + 1} / {words.length}</span>
          <span>{Math.round(progress)}% hoàn thành</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Card */}
      <Card
        className="cursor-pointer"
        onClick={state === "question" ? showAnswer : undefined}
      >
        <CardContent className="py-8 px-6 text-center space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold">{word.tu_goc}</span>
              <TtsButton text={word.tu_goc} lang="en-US" size="sm" />
            </div>
            {word.phien_am && (
              <p className="text-sm text-muted-foreground lm-mono">{word.phien_am}</p>
            )}
            {word.loai_tu && (
              <Badge variant="outline">{word.loai_tu}</Badge>
            )}
          </div>

          {state === "question" ? (
            <p className="text-sm text-muted-foreground">
              Nhấn để xem định nghĩa
            </p>
          ) : (
            <div className="space-y-3 border-t pt-4">
              {(word.nghia_en || word.nghia_vi) && (
                <div className="space-y-1">
                  {word.nghia_en && (
                    <p className="text-base">{word.nghia_en}</p>
                  )}
                  {word.nghia_vi && (
                    <p className="text-sm text-muted-foreground">{word.nghia_vi}</p>
                  )}
                </div>
              )}
              {wordExamples.length > 0 && (
                <div className="space-y-2 text-left">
                  {wordExamples.slice(0, 2).map((ex, i) => (
                    <p key={i} className="lm-example text-sm">
                      {ex.en}
                      {ex.vi && (
                        <span className="ml-1 text-xs text-muted-foreground not-italic">
                          — {ex.vi}
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {state === "answer" && (
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            Bạn nhớ từ này không?
          </p>
          <div className="grid grid-cols-4 gap-2">
            <GradeButton
              label="Lại"
              sublabel="0 ngày"
              variant="destructive"
              onClick={() => onGrade(0)}
            />
            <GradeButton
              label="Khó"
              sublabel="1 ngày"
              variant="secondary"
              onClick={() => onGrade(1)}
            />
            <GradeButton
              label="Tốt"
              sublabel="~3 ngày"
              variant="outline"
              onClick={() => onGrade(2)}
            />
            <GradeButton
              label="Dễ"
              sublabel="~7 ngày"
              variant="default"
              onClick={() => onGrade(3)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GradeButton({
  label,
  sublabel,
  variant,
  onClick,
}: {
  label: string;
  sublabel: string;
  variant: "default" | "secondary" | "outline" | "destructive" | "ghost";
  onClick: () => void;
}) {
  return (
    <Button
      variant={variant}
      onClick={onClick}
      className="h-auto flex-col py-3 gap-0.5"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs opacity-70">{sublabel}</span>
    </Button>
  );
}
