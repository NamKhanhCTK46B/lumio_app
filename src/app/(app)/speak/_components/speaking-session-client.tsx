"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { taoPhienNoiAction, ketThucPhienNoiAction, layChiTietPhienAction } from "../actions";
import { taoSttController, laCoHoTroStt, type SttResult } from "@/lib/speech/stt";
import { taoTtsController, laCoHoTroTts } from "@/lib/speech/tts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeftIcon, MicIcon, MicOffIcon, SendIcon, Volume2Icon, XIcon } from "lucide-react";

type Turn = {
  vai: "nguoi_dung" | "ai";
  noi_dung: string;
  sua_loi?: unknown;
};

const SCENARIOS = [
  "Ordering coffee",
  "Job interview",
  "Small talk at airport",
  "Asking for directions",
  "Doctor appointment",
  "Free conversation",
];

export function SpeakingSessionClient({
  nhanVatId,
  nhanVatTen,
  nhanVatAvatar,
  nhanVatPrompt,
  phienId,
}: {
  nhanVatId: string;
  nhanVatTen: string;
  nhanVatAvatar: string | null;
  nhanVatPrompt: string;
  phienId?: string;
}) {
  const [sessionId, setSessionId] = useState(phienId ?? "");
  const [scenario, setScenario] = useState<string>("");
  const [started, setStarted] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sttSupported] = useState(() => laCoHoTroStt());
  const [ttsSupported] = useState(() => laCoHoTroTts());
  const sttRef = useRef<ReturnType<typeof taoSttController> | null>(null);
  const ttsRef = useRef<ReturnType<typeof taoTtsController> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  // TTS controller
  useEffect(() => {
    if (ttsSupported) {
      ttsRef.current = taoTtsController();
    }
    return () => {
      ttsRef.current?.cancel();
    };
  }, [ttsSupported]);

  // Start session
  async function startSession() {
    if (!scenario) return;
    setIsLoading(true);
    const result = await taoPhienNoiAction({
      nhan_vat_id: nhanVatId,
      boi_canh: scenario,
    });
    setIsLoading(false);

    if (result.ok) {
      setSessionId(result.data!.phien_id);
      setStarted(true);
      // AI greeting
      const greeting = getGreeting(nhanVatTen, scenario);
      setTurns([{ vai: "ai", noi_dung: greeting }]);
      // TTS
      if (ttsRef.current) {
        ttsRef.current.speak(greeting).catch(() => {});
      }
    }
  }

  // End session
  async function endSession() {
    if (!sessionId) return;
    const scores = turns
      .filter((t) => t.vai === "ai")
      .map((t) => t.noi_dung.length);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length / 10)
      : null;

    await ketThucPhienNoiAction(sessionId, {
      tongLuot: turns.length,
      diemPhatAmTb: avgScore,
      tomTat: `Phiên ${nhanVatTen} - ${scenario}`,
    });

    router.push("/speak");
  }

  // Send text message
  async function sendMessage(text: string) {
    if (!text.trim() || !sessionId) return;

    const userTurn: Turn = { vai: "nguoi_dung", noi_dung: text };
    setTurns((prev) => [...prev, userTurn]);
    setInputText("");
    setRecordingText("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "roleplay",
          sessionId,
          characterPrompt: nhanVatPrompt,
          characterName: nhanVatTen,
          history: turns.map((t) => ({ vai: t.vai, noi_dung: t.noi_dung })),
          userTranscript: text,
        }),
      });

      if (!response.ok) throw new Error("Stream error");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiText = "";

      const aiTurn: Turn = { vai: "ai", noi_dung: "" };
      setTurns((prev) => [...prev, aiTurn]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiText += chunk;
        setTurns((prev) => {
          const last = prev[prev.length - 1];
          if (last?.vai === "ai") {
            return [...prev.slice(0, -1), { ...last, noi_dung: aiText }];
          }
          return prev;
        });
      }

      // TTS
      if (ttsRef.current) {
        ttsRef.current.speak(aiText).catch(() => {});
      }
    } catch {
      // Remove failed AI turn
      setTurns((prev) => prev.filter((t) => t !== turns[turns.length]));
    } finally {
      setIsLoading(false);
    }
  }

  // STT
  function startRecording() {
    if (!sttSupported) return;

    setIsRecording(true);
    sttRef.current = taoSttController({
      onResult: (result: SttResult) => {
        setRecordingText(result.transcript);
        if (result.isFinal) {
          sendMessage(result.transcript);
        }
      },
      onError: (err) => {
        console.error("STT error:", err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
        setRecordingText("");
      },
    }, { lang: "en-US", continuous: false, interimResults: true });

    sttRef.current.start();
  }

  function stopRecording() {
    sttRef.current?.stop();
    setIsRecording(false);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b">
        <Link href="/speak">
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
        </Link>
        <Avatar className="h-8 w-8">
          <AvatarImage src={nhanVatAvatar ?? ""} />
          <AvatarFallback>{nhanVatTen.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium text-sm">{nhanVatTen}</p>
          {scenario && <p className="text-xs text-muted-foreground">{scenario}</p>}
        </div>
        {started && (
          <Button variant="outline" size="sm" onClick={endSession}>
            <XIcon className="h-3.5 w-3.5 mr-1.5" />
            Kết thúc
          </Button>
        )}
      </div>

      {/* Pre-session: scenario picker */}
      {!started && (
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Chọn tình huống để bắt đầu:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SCENARIOS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setScenario(s)}
                    className={`rounded-lg border px-3 py-2 text-sm text-left transition-all ${
                      scenario === s
                        ? "border-primary bg-lm-primary-soft text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <Button
                className="w-full"
                disabled={!scenario || isLoading}
                onClick={startSession}
              >
                {isLoading ? "Đang bắt đầu..." : "Bắt đầu luyện nói"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chat */}
      {started && (
        <>
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {turns.map((turn, i) => (
              <div
                key={i}
                className={`flex gap-3 ${turn.vai === "nguoi_dung" ? "flex-row-reverse" : ""}`}
              >
                {turn.vai === "ai" && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={nhanVatAvatar ?? ""} />
                    <AvatarFallback>{nhanVatTen.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    turn.vai === "nguoi_dung"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  }`}
                >
                  <p>{turn.noi_dung}</p>
                  {turn.vai === "ai" && ttsSupported && (
                    <button
                      onClick={() => ttsRef.current?.speak(turn.noi_dung)}
                      className="mt-1 flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
                    >
                      <Volume2Icon className="h-3 w-3" />
                      Đọc lại
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback>{nhanVatTen.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t pt-4 space-y-2">
            {recordingText && (
              <p className="text-sm text-primary animate-pulse px-1">
                {recordingText}
              </p>
            )}
            <div className="flex gap-2">
              {sttSupported && (
                <Button
                  variant={isRecording ? "destructive" : "outline"}
                  size="icon"
                  onClick={isRecording ? stopRecording : startRecording}
                  aria-label={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
                >
                  {isRecording ? (
                    <MicOffIcon className="h-4 w-4" />
                  ) : (
                    <MicIcon className="h-4 w-4" />
                  )}
                </Button>
              )}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(inputText);
                  }
                }}
                placeholder="Nhập tin nhắn hoặc bấm mic để nói..."
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                aria-label="Gửi"
              >
                <SendIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function getGreeting(name: string, scenario: string): string {
  const greetings: Record<string, string> = {
    "Ordering coffee": `Hi there! What can I get for you today?`,
    "Job interview": `Hello! Thanks for coming in. Let's start with you telling me about yourself.`,
    "Small talk at airport": `Oh, what a coincidence! Are you heading to the same flight?`,
    "Asking for directions": `Excuse me, could you help me? I'm a bit lost.`,
    "Doctor appointment": `Good morning! Please, take a seat. What brings you in today?`,
    "Free conversation": `Hey! Nice to meet you. What have you been up to lately?`,
  };
  return greetings[scenario] ?? `Hi! I'm ${name}. What would you like to talk about?`;
}
