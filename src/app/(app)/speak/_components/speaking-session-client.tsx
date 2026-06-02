"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { taoPhienNoiAction, ketThucPhienNoiAction } from "../actions";
import { taoSttController, laCoHoTroStt, type SttResult } from "@/lib/speech/stt";
import { taoTtsController, laCoHoTroTts, preloadVoices } from "@/lib/speech/tts";
import {
  findTopicByContext,
  formatTopicContext,
  getTopicGreeting,
  getTopicsForCharacter,
  getVoiceProfilesForCharacter,
  pickVoiceProfileForSession,
  type SpeakingTopic,
  type SpeakingVoiceProfile,
} from "@/lib/speaking/persona-config";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeftIcon, MicIcon, MicOffIcon, SendIcon, Volume2Icon, XIcon } from "lucide-react";

type Turn = {
  vai: "nguoi_dung" | "ai";
  noi_dung: string;
};

type GoogleTtsResponse = {
  audioBase64: string;
  mimeType: string;
};

export function SpeakingSessionClient({
  nhanVatId,
  nhanVatTen,
  nhanVatAvatar,
  nhanVatSlug,
  nhanVatGiong,
  phienId,
  initialTurns,
  initialScenario,
}: {
  nhanVatId: string;
  nhanVatTen: string;
  nhanVatAvatar: string | null;
  nhanVatSlug?: string | null;
  nhanVatGiong?: string | null;
  phienId?: string;
  initialTurns?: Turn[];
  initialScenario?: string;
}) {
  const topics = useMemo(() => getTopicsForCharacter(nhanVatSlug), [nhanVatSlug]);
  const voiceProfiles = useMemo(
    () => getVoiceProfilesForCharacter(nhanVatSlug, nhanVatGiong),
    [nhanVatGiong, nhanVatSlug],
  );
  const initialTopic = useMemo(
    () => findTopicByContext(topics, initialScenario),
    [initialScenario, topics],
  );
  const hasExistingSession = !!phienId;
  const [sessionId, setSessionId] = useState(phienId ?? "");
  const [scenario, setScenario] = useState(initialScenario ?? "");
  const [selectedTopicId, setSelectedTopicId] = useState(initialTopic?.id ?? "");
  const [started, setStarted] = useState(hasExistingSession);
  const [turns, setTurns] = useState<Turn[]>(initialTurns ?? []);
  const [inputText, setInputText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [sttSupported] = useState(() => laCoHoTroStt());
  const [ttsSupported] = useState(() => laCoHoTroTts());
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? null;
  const sttRef = useRef<ReturnType<typeof taoSttController> | null>(null);
  const ttsRef = useRef<ReturnType<typeof taoTtsController> | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const sessionVoiceProfileRef = useRef<SpeakingVoiceProfile | null>(null);
  const sessionVoiceSeedRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendingRef = useRef(false);
  const googleTtsToastShownRef = useRef(false);
  const webTtsToastShownRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  useEffect(() => {
    sessionVoiceProfileRef.current = null;
    sessionVoiceSeedRef.current = null;
  }, [sessionId]);

  useEffect(() => {
    if (ttsSupported) {
      ttsRef.current = taoTtsController();
      void preloadVoices();
    }
    return () => {
      ttsRef.current?.cancel();
      activeAudioRef.current?.pause();
    };
  }, [ttsSupported]);

  async function startSession() {
    setStartError(null);

    if (!selectedTopic && !hasExistingSession) {
      setStartError("Vui lòng chọn chủ đề trước khi bắt đầu.");
      return;
    }

    if (hasExistingSession) {
      setStarted(true);
      return;
    }

    setIsLoading(true);

    try {
      const topicContext = formatTopicContext(selectedTopic as SpeakingTopic);
      const result = await taoPhienNoiAction({
        nhan_vat_id: nhanVatId,
        boi_canh: topicContext,
      });

      if (!result.ok) {
        setStartError(result.error);
        return;
      }

      const newSessionId = result.data.phien_id;
      const greeting = getTopicGreeting(nhanVatTen, selectedTopic as SpeakingTopic);
      setSessionId(newSessionId);
      setScenario(topicContext);
      setStarted(true);
      setTurns([{ vai: "ai", noi_dung: greeting }]);
      void speakAiText(greeting, newSessionId);
      router.push(`/speak/${newSessionId}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function endSession() {
    if (!sessionId) return;

    await ketThucPhienNoiAction(sessionId, {
      tongLuot: turns.length,
      diemPhatAmTb: null,
      tomTat: `Phiên ${nhanVatTen} - ${scenario || "Tự do"}`,
    });

    router.push("/speak");
  }

  async function sendMessage(text: string) {
    if (!text.trim() || !sessionId || sendingRef.current) return;
    sendingRef.current = true;

    const userTurn: Turn = { vai: "nguoi_dung", noi_dung: text };
    const aiTurn: Turn = { vai: "ai", noi_dung: "" };

    setTurns((prev) => [...prev, userTurn, aiTurn]);
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
          userTranscript: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Stream error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const aiText = await readStreamText(reader, (chunkText) => {
        setTurns((prev) => {
          const last = prev[prev.length - 1];
          if (last?.vai === "ai") {
            return [...prev.slice(0, -1), { ...last, noi_dung: chunkText }];
          }
          return prev;
        });
      });

      void speakAiText(aiText, sessionId);
    } catch (err) {
      console.error("Send message error:", err);
      setTurns((prev) => {
        const last = prev[prev.length - 1];
        if (last?.vai === "ai" && last.noi_dung === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
    } finally {
      sendingRef.current = false;
      setIsLoading(false);
    }
  }

  function getSessionVoiceProfile(activeSessionId: string): SpeakingVoiceProfile {
    if (!sessionVoiceProfileRef.current || sessionVoiceSeedRef.current !== activeSessionId) {
      sessionVoiceProfileRef.current = pickVoiceProfileForSession(
        voiceProfiles,
        `${nhanVatId}:${activeSessionId}`,
      );
      sessionVoiceSeedRef.current = activeSessionId;
    }
    return sessionVoiceProfileRef.current;
  }

  async function speakAiText(text: string, activeSessionId: string) {
    const voice = getSessionVoiceProfile(activeSessionId);

    try {
      await playGoogleTts(text, voice);
      return;
    } catch (err) {
      console.warn("Google TTS fallback:", err);
      notifyGoogleTtsFallback();
    }

    try {
      await playBrowserTts(text, voice);
    } catch (err) {
      console.warn("Browser TTS error:", err);
      notifyBrowserTtsFailure();
    }
  }

  async function playGoogleTts(text: string, voice: SpeakingVoiceProfile) {
    const response = await fetch("/api/speech/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        lang: voice.lang,
        voiceName: voice.voiceName,
        speakingRate: voice.speakingRate,
        pitch: voice.pitch,
      }),
    });

    if (!response.ok) {
      throw new Error(`Google TTS error: ${response.status}`);
    }

    const data = (await response.json()) as GoogleTtsResponse;
    activeAudioRef.current?.pause();
    const audio = new Audio(`data:${data.mimeType};base64,${data.audioBase64}`);
    activeAudioRef.current = audio;
    await audio.play();
  }

  async function playBrowserTts(text: string, voice: SpeakingVoiceProfile) {
    if (!ttsRef.current?.isSupported) {
      throw new Error("Browser TTS not supported");
    }

    await preloadVoices();
    await ttsRef.current.speak(text, {
      lang: voice.lang,
      rate: voice.speakingRate,
      pitch: googlePitchToBrowserPitch(voice.pitch),
      useDefaultVoice: true,
    });
  }

  function notifyGoogleTtsFallback() {
    if (googleTtsToastShownRef.current) return;
    googleTtsToastShownRef.current = true;
    toast.warning("Không tạo được giọng Google Cloud. Lumio sẽ dùng giọng mặc định của trình duyệt.");
  }

  function notifyBrowserTtsFailure() {
    if (webTtsToastShownRef.current) return;
    webTtsToastShownRef.current = true;
    toast.error("Trình duyệt không phát được giọng đọc. Bạn vẫn có thể tiếp tục luyện nói.");
  }

  function startRecording() {
    if (!sttSupported) return;

    setIsRecording(true);
    sttRef.current = taoSttController({
      onResult: (result: SttResult) => {
        setRecordingText(result.transcript);
        if (result.isFinal && !sendingRef.current) {
          sendMessage(result.transcript);
        }
      },
      onError: () => {
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

      {!started && (
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-2xl w-full">
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-1 text-center">
                <p className="text-sm font-medium text-lm-fg">
                  {hasExistingSession ? "Tiếp tục phiên cũ" : `Chọn chủ đề phù hợp với vai của ${nhanVatTen}`}
                </p>
                {!hasExistingSession ? (
                  <p className="text-xs text-lm-fg-muted">
                    Mỗi chủ đề sẽ điều chỉnh bối cảnh hội thoại và giọng đọc của nhân vật.
                  </p>
                ) : null}
              </div>
              {!hasExistingSession && (
                <div className="grid gap-2 sm:grid-cols-3">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(topic.id);
                        setScenario(formatTopicContext(topic));
                      }}
                      className={`rounded-xl border px-3 py-3 text-left transition-all ${
                        selectedTopicId === topic.id
                          ? "border-lm-primary bg-lm-primary-soft text-lm-primary-ink"
                          : "border-lm-border hover:border-lm-primary/50"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{topic.title}</span>
                      <span className="mt-1 block text-xs text-lm-fg-muted">{topic.description}</span>
                      {topic.cefr ? (
                        <span className="mt-2 inline-flex rounded-full bg-lm-bg-elev-1 px-2 py-0.5 text-2xs text-lm-fg-muted">
                          {topic.cefr}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
              {startError ? (
                <p className="rounded-lg border border-lm-danger/30 bg-lm-danger-soft px-3 py-2 text-sm text-lm-danger-ink">
                  {startError}
                </p>
              ) : null}
              <Button
                className="w-full"
                disabled={(!selectedTopic && !hasExistingSession) || isLoading}
                onClick={startSession}
              >
                {isLoading ? "Đang bắt đầu..." : hasExistingSession ? "Tiếp tục" : "Bắt đầu luyện nói"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

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
                  {turn.vai === "ai" && turn.noi_dung && (
                    <button
                      type="button"
                      onClick={() => sessionId && speakAiText(turn.noi_dung, sessionId)}
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

async function readStreamText(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onText: (text: string) => void,
): Promise<string> {
  const decoder = new TextDecoder();
  const chunks: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(decoder.decode(value, { stream: true }));
    onText(chunks.join(""));
  }

  chunks.push(decoder.decode());
  const text = chunks.join("");
  onText(text);
  return text;
}

function googlePitchToBrowserPitch(pitch: number): number {
  return Math.min(2, Math.max(0.1, 1 + pitch / 20));
}
