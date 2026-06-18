"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { gradeReviewAction } from "../../../vocab/actions";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/app/action-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TtsButton } from "@/components/app/tts-button";
import {
  AlertCircleIcon,
  BookOpenCheckIcon,
  EyeIcon,
  RotateCcwIcon,
} from "lucide-react";
import type { ReviewWordRow, ViDuItem } from "@/lib/repositories/vocab.repo";

type ReviewState = "question" | "answer" | "done";
type GradeQuality = 0 | 1 | 2 | 3;

const REVIEW_BUTTONS: Array<{
  quality: GradeQuality;
  label: string;
  sublabel: string;
  variant: "default" | "secondary" | "outline" | "destructive";
}> = [
  { quality: 0, label: "Lại", sublabel: "Ngày mai", variant: "destructive" },
  { quality: 1, label: "Khó", sublabel: "Ngày mai", variant: "secondary" },
  { quality: 2, label: "Tốt", sublabel: "Khoảng 6 ngày", variant: "outline" },
  { quality: 3, label: "Dễ", sublabel: "Xa hơn", variant: "default" },
];

const QUALITY_LABELS: Record<GradeQuality, string> = {
  0: "Lại",
  1: "Khó",
  2: "Tốt",
  3: "Dễ",
};

function normalizeExamples(value: ReviewWordRow["vi_du"]): ViDuItem[] {
  return Array.isArray(value) ? value : [];
}

export function ReviewSessionClient({
  words,
  backHref = "/vocab",
}: {
  words: ReviewWordRow[];
  backHref?: string;
}) {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<ReviewState>("question");
  const [correctCount, setCorrectCount] = useState(0);
  const [gradedCount, setGradedCount] = useState(0);
  const [againCount, setAgainCount] = useState(0);
  const [qualityCounts, setQualityCounts] = useState<Record<GradeQuality, number>>({
    0: 0,
    1: 0,
    2: 0,
    3: 0,
  });
  const [grading, setGrading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  const word = words[index];
  const progress = words.length > 0 ? (gradedCount / words.length) * 100 : 0;
  const wordExamples = useMemo(() => normalizeExamples(word?.vi_du ?? null), [word?.vi_du]);
  const pct = words.length > 0 ? Math.round((correctCount / words.length) * 100) : 0;

  function showAnswer() {
    setState("answer");
    setErrorMessage(null);
  }

  const onGrade = useCallback(
    async (quality: GradeQuality) => {
      if (!word || grading) return;
      setGrading(true);
      setErrorMessage(null);
      const result = await gradeReviewAction({ tu_id: word.id, quality });
      setGrading(false);
      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setGradedCount((n) => n + 1);
      if (quality >= 2) setCorrectCount((n) => n + 1);
      if (quality === 0) setAgainCount((n) => n + 1);
      setQualityCounts((counts) => ({
        ...counts,
        [quality]: counts[quality] + 1,
      }));

      if (index + 1 >= words.length) {
        setState("done");
      } else {
        setIndex((i) => i + 1);
        setState("question");
      }
    },
    [word, index, words.length, grading],
  );

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (grading || state === "done") return;

      if (state === "question" && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        showAnswer();
        return;
      }

      if (state !== "answer") return;

      const quality = Number(event.key) - 1;
      if (quality < 0 || quality > 3) return;

      event.preventDefault();
      void onGrade(quality as GradeQuality);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [grading, onGrade, state]);

  if (state === "done") {
    return (
      <div className="space-y-6 py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lm-success-soft text-lm-success">
          <BookOpenCheckIcon className="h-8 w-8" />
        </div>
        <div className="space-y-1">
          <p className="text-lg font-medium">Hoàn thành phiên ôn!</p>
          <p className="text-sm text-muted-foreground">
            {correctCount} / {words.length} từ nhớ tốt
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-left">
          <SessionStat label="Độ chính xác" value={`${pct}%`} />
          <SessionStat label="Cần ôn lại" value={againCount} />
          <SessionStat label="Đã chấm" value={gradedCount} />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {REVIEW_BUTTONS.map((button) => (
            <div
              key={button.quality}
              className="rounded-lg border border-lm-border bg-lm-bg-elev-1 px-2 py-2 text-center"
            >
              <p className="text-xs text-muted-foreground">
                {QUALITY_LABELS[button.quality]}
              </p>
              <p className="mt-0.5 font-semibold">{qualityCounts[button.quality]}</p>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(backHref)}
          >
            Quay lại
          </Button>
          <Button onClick={() => router.refresh()} className="gap-1.5">
            <RotateCcwIcon className="h-4 w-4" />
            Ôn tiếp
          </Button>
        </div>
      </div>
    );
  }

  if (!word) return null;

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
        className="min-h-72 cursor-pointer border-lm-border bg-lm-bg-elev-1 transition-shadow hover:shadow-sm"
        onClick={state === "question" ? showAnswer : undefined}
      >
        <CardContent className="space-y-5 px-6 py-8 text-center">
          <div className="space-y-2">
            <Badge variant="secondary" className="mb-2">
              {state === "question" ? "Mặt trước" : "Mặt sau"}
            </Badge>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-bold">{word.tu_goc}</span>
              <span onClick={(event) => event.stopPropagation()}>
                <TtsButton text={word.tu_goc} lang="en-US" size="sm" />
              </span>
            </div>
            {word.phien_am && (
              <p className="text-sm text-muted-foreground lm-mono">{word.phien_am}</p>
            )}
            <div className="flex flex-wrap justify-center gap-2">
              {word.loai_tu && <Badge variant="outline">{word.loai_tu}</Badge>}
              {word.cefr_phu_hop && (
                <Badge
                  className="text-white"
                  style={{
                    backgroundColor: `var(--lm-cefr-${word.cefr_phu_hop.toLowerCase()})`,
                  }}
                >
                  {word.cefr_phu_hop}
                </Badge>
              )}
            </div>
          </div>

          {state === "question" ? (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-lm-primary-soft text-lm-primary">
              <EyeIcon className="h-5 w-5" />
            </div>
          ) : (
            <div className="space-y-4 border-t border-lm-border pt-4 text-left">
              {(word.nghia_en || word.nghia_vi) && (
                <div className="rounded-lg bg-lm-bg px-4 py-3">
                  {word.nghia_en && (
                    <p className="text-base font-medium">{word.nghia_en}</p>
                  )}
                  {word.nghia_vi && (
                    <p className="mt-1 text-sm text-muted-foreground">{word.nghia_vi}</p>
                  )}
                </div>
              )}
              {wordExamples.length > 0 && (
                <div className="space-y-2">
                  {wordExamples.slice(0, 2).map((ex, i) => (
                    <p key={i} className="lm-example text-sm">
                      {ex.en}
                      {ex.vi && (
                        <span className="ml-1 text-xs text-muted-foreground not-italic">
                          - {ex.vi}
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              )}
              {word.ngu_canh && (
                <p className="rounded-lg border border-lm-border px-4 py-3 text-sm text-muted-foreground">
                  {word.ngu_canh}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {errorMessage && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {state === "answer" && (
        <div className="space-y-2">
          <p className="text-center text-sm font-medium">Bạn nhớ từ này không?</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {REVIEW_BUTTONS.map((button) => (
              <GradeButton
                key={button.quality}
                label={button.label}
                sublabel={button.sublabel}
                variant={button.variant}
                onClick={() => onGrade(button.quality)}
                isPending={grading}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SessionStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-lm-border bg-lm-bg-elev-1 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function GradeButton({
  label,
  sublabel,
  variant,
  onClick,
  isPending,
}: {
  label: string;
  sublabel: string;
  variant: "default" | "secondary" | "outline" | "destructive" | "ghost";
  onClick: () => void;
  isPending?: boolean;
}) {
  return (
    <ActionButton
      variant={variant}
      onClick={onClick}
      isPending={isPending}
      className="h-16 flex-col gap-0.5 py-3"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs opacity-70">{sublabel}</span>
    </ActionButton>
  );
}
