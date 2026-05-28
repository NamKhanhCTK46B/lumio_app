"use client";

import { useState } from "react";
import { sinhQuizAction, type QuizQuestion } from "./actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon, RefreshCwIcon, LoaderIcon } from "lucide-react";

export default function QuizPage() {
  const [category, setCategory] = useState<"grammar" | "vocab" | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const q = questions[currentQ];
  const total = questions.length;

  async function startQuiz(loai: "grammar" | "vocab") {
    setCategory(loai);
    setLoading(true);
    setError("");

    const result = await sinhQuizAction({ loai, so_cau: 5 });

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setQuestions(result.data.cau_hoi);
  }

  function selectAnswer(idx: number) {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q.correctIndex) {
      setScore((s) => s + 1);
    }
  }

  function nextQuestion() {
    if (currentQ + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentQ((q) => q + 1);
      setSelected(null);
    }
  }

  function reset() {
    setCategory(null);
    setQuestions([]);
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
    setLoading(false);
    setError("");
  }

  if (!category) {
    return (
      <div className="max-w-xl mx-auto space-y-8">
        <div>
          <h1 className="lm-h2">Quiz</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chọn danh mục để bắt đầu làm quiz.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <QuizCategoryCard
            title="Ngữ pháp"
            desc="Quiz ngữ pháp AI sinh từ từ vựng của bạn"
            onClick={() => startQuiz("grammar")}
          />
          <QuizCategoryCard
            title="Từ vựng"
            desc="Quiz từ vựng AI sinh từ từ đã lưu"
            onClick={() => startQuiz("vocab")}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <LoaderIcon className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Đang sinh câu hỏi bằng AI...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button onClick={reset}>Thử lại</Button>
      </div>
    );
  }

  if (finished) {
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    return (
      <div className="max-w-sm mx-auto py-16 text-center space-y-6">
        <div className="text-6xl font-bold text-lm-primary">{pct}%</div>
        <div className="space-y-1">
          <p className="text-xl font-medium">
            {pct >= 80 ? "Xuất sắc!" : pct >= 60 ? "Khá tốt!" : "Cần cố gắng thêm!"}
          </p>
          <p className="text-sm text-muted-foreground">
            {score} / {total} câu đúng
          </p>
        </div>
        <Button onClick={reset} className="gap-2">
          <RefreshCwIcon className="h-4 w-4" />
          Quiz khác
        </Button>
      </div>
    );
  }

  if (!q) return null;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={reset}>
          ← Thoát
        </Button>
        <Badge variant="outline">
          Câu {currentQ + 1} / {total}
        </Badge>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-6">
          <p className="text-base font-medium">{q.question}</p>

          <div className="space-y-2">
            {q.options.map((opt, idx) => {
              const isSelected = selected === idx;
              const isCorrect = idx === q.correctIndex;
              const showResult = selected !== null;

              let className = "w-full justify-start text-left h-auto py-3 px-4";
              if (showResult) {
                if (isCorrect) className += " bg-lm-success-soft border-lm-success text-lm-success-ink";
                else if (isSelected) className += " bg-lm-danger-soft border-lm-danger";
                else className += " opacity-60";
              } else {
                className += " hover:bg-lm-bg-hover";
              }

              return (
                <Button
                  key={idx}
                  variant="outline"
                  className={className}
                  onClick={() => selectAnswer(idx)}
                >
                  <span className="mr-3 font-bold text-xs w-5 text-center">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  {opt}
                  {showResult && isCorrect && (
                    <CheckIcon className="ml-auto h-4 w-4 text-lm-success" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <XIcon className="ml-auto h-4 w-4 text-lm-danger" />
                  )}
                </Button>
              );
            })}
          </div>

          {selected !== null && q.explanation && (
            <div className="rounded-lg bg-lm-bg-muted p-3">
              <p className="text-sm text-muted-foreground">{q.explanation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selected !== null && (
        <Button className="w-full" onClick={nextQuestion}>
          {currentQ + 1 >= total ? "Xem kết quả" : "Câu tiếp theo →"}
        </Button>
      )}
    </div>
  );
}

function QuizCategoryCard({
  title,
  desc,
  onClick,
}: {
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={onClick}
    >
      <CardContent className="pt-6 space-y-2">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
