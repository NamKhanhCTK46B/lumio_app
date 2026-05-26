"use client";

import { useState } from "react";
import { laCoHoTroTts, taoTtsController } from "@/lib/speech/tts";
import { Button } from "@/components/ui/button";
import { Volume2Icon } from "lucide-react";

type TtsButtonProps = {
  text: string;
  lang?: string;
  size?: "icon" | "sm" | "default";
};

/**
 * Nút phát âm dùng Web Speech API TTS.
 */
export function TtsButton({ text, lang = "en-US", size = "icon" }: TtsButtonProps) {
  const [playing, setPlaying] = useState(false);

  if (!laCoHoTroTts()) return null;

  async function play() {
    if (playing) return;
    setPlaying(true);
    try {
      const tts = taoTtsController();
      await tts.speak(text, { lang });
    } catch {
      // Silent fail — TTS không bắt buộc
    } finally {
      setPlaying(false);
    }
  }

  if (size === "sm") {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={play}
        disabled={playing}
        className="h-7 gap-1.5 px-2 text-xs"
      >
        <Volume2Icon className={`h-3.5 w-3.5 ${playing ? "animate-pulse" : ""}`} />
        {playing ? "Đang đọc..." : "Nghe"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={play}
      disabled={playing}
      aria-label="Phát âm"
      className="h-8 w-8"
    >
      <Volume2Icon className={`h-4 w-4 ${playing ? "animate-pulse" : ""}`} />
    </Button>
  );
}
