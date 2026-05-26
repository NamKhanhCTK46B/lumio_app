"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon, RefreshCwIcon } from "lucide-react";

type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
};

const SAMPLE_QUIZZES: Record<string, QuizQuestion[]> = {
  grammar: [
    {
      id: 1,
      question: "Choose the correct sentence:",
      options: [
        "She don't like coffee.",
        "She doesn't like coffee.",
        "She not like coffee.",
        "She no like coffee.",
      ],
      correctIndex: 1,
      explanation: "'Doesn't' là dạng phủ định đúng cho ngôi thứ 3 số ít (she/he/it).",
    },
    {
      id: 2,
      question: "Fill in the blank: 'I have been learning English ___ three years.'",
      options: ["since", "for", "during", "in"],
      correctIndex: 1,
      explanation: "'For' dùng với khoảng thời gian (three years). 'Since' dùng với thời điểm bắt đầu (2019, Monday).",
    },
  ],
  vocab: [
    {
      id: 1,
      question: "What does 'ubiquitous' mean?",
      options: ["Rare", "Found everywhere", "Expensive", "Dangerous"],
      correctIndex: 1,
      explanation: "'Ubiquitous' = có mặt ở khắp nơi, rất phổ biến. Từ gốc Latin 'ubique' = everywhere.",
    },
  ],
};

export default function QuizPage() {
  const [category, setCategory] = useState<"grammar" | "vocab" | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const questions = category ? SAMPLE_QUIZZES[category] ?? [] : [];
  const q = questions[currentQ];
  const total = questions.length;

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
    setCurrentQ(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
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
            desc="20 câu ngữ pháp theo CEFR"
            count={SAMPLE_QUIZZES.grammar.length}
            onClick={() => setCategory("grammar")}
          />
          <QuizCategoryCard
            title="Từ vựng"
            desc="20 câu từ vựng theo chủ đề"
            count={SAMPLE_QUIZZES.vocab.length}
            onClick={() => setCategory("vocab")}
          />
        </div>
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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={reset}>
          ← Thoát
        </Button>
        <Badge variant="outline">
          Câu {currentQ + 1} / {total}
        </Badge>
      </div>

      {/* Question */}
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
  count,
  onClick,
}: {
  title: string;
  desc: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={onClick}
    >
      <CardContent className="pt-6 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <Badge variant="secondary">{count} câu</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </CardContent>
    </Card>
  );
}
