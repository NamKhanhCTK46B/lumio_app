/**
 * Web Speech API — Text-to-Speech (TTS) wrapper.
 *
 * Dùng window.speechSynthesis (miễn phí, có sẵn trên hầu hết browser).
 * Voice mặc định "Google US English" trên Chrome/Edge có chất lượng cao.
 *
 * Browser hỗ trợ: Chrome/Edge (tốt), Safari (tốt), Firefox (hạn chế).
 */

export type TtsOptions = {
  /** Ngôn ngữ / giọng đọc (BCP-47, mặc định en-US). */
  lang?: string;
  /** Tốc độ 0.1–10, mặc định 1. */
  rate?: number;
  /** Cao độ 0–2, mặc định 1. */
  pitch?: number;
  /** Âm lượng 0–1, mặc định 1. */
  volume?: number;
};

const MAC_DINH: Required<TtsOptions> = {
  lang: "en-US",
  rate: 1,
  pitch: 1,
  volume: 1,
};

/**
 * Kiểm tra trình duyệt có hỗ trợ TTS không.
 */
export function laCoHoTroTts(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window;
}

/**
 * Lấy danh sách voice khả dụng trên trình duyệt.
 * Gọi sau khi voiceschanged event.
 */
export function layDanhSachVoice(): SpeechSynthesisVoice[] {
  if (!laCoHoTroTts()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Tìm voice phù hợp nhất cho ngôn ngữ.
 * Ưu tiên Google voice nếu có (chất lượng cao nhất).
 */
export function timVoiceLang(lang: string): SpeechSynthesisVoice | null {
  const voices = layDanhSachVoice();
  if (!voices.length) return null;

  // Ưu tiên Google voice
  const google = voices.find(
    (v) => v.lang.startsWith(lang) && v.name.includes("Google"),
  );
  if (google) return google;

  // Fallback voice của hệ điều hành
  return (
    voices.find((v) => v.lang.startsWith(lang) && v.default) ??
    voices.find((v) => v.lang.startsWith(lang)) ??
    null
  );
}

/**
 * Đọc một đoạn text.
 *
 * @example
 * const tts = taoTtsController();
 * tts.speak("Hello, how are you?");
 * tts.speak("Xin chào, bạn khỏe không?", { lang: "vi-VN" });
 */
export function taoTtsController() {
  if (typeof window === "undefined") {
    return {
      speak: () => Promise.resolve(),
      pause: () => {},
      resume: () => {},
      cancel: () => {},
      isSupported: false,
    };
  }

  const synth = window.speechSynthesis;

  return {
    isSupported: true,

    speak(text: string, opts: TtsOptions = {}): Promise<void> {
      return new Promise((resolve, reject) => {
        if (!synth) {
          reject(new Error("speechSynthesis not available"));
          return;
        }

        // Cancel any ongoing speech
        synth.cancel();

        const merged = { ...MAC_DINH, ...opts };
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = merged.lang;
        utterance.rate = merged.rate;
        utterance.pitch = merged.pitch;
        utterance.volume = merged.volume;

        // Tìm voice phù hợp
        const voice = timVoiceLang(merged.lang.split("-")[0]);
        if (voice) utterance.voice = voice;

        utterance.onend = () => resolve();
        utterance.onerror = (e) => reject(new Error(`TTS error: ${e.error}`));

        synth.speak(utterance);
      });
    },

    speakSsml(ssml: string, opts: TtsOptions = {}): Promise<void> {
      // TTS cơ bản không hỗ trợ SSML trên mọi browser
      // Strip tags để fallback về plain text
      const text = ssml.replace(/<[^>]+>/g, "");
      return this.speak(text, opts);
    },

    pause: () => synth.pause(),
    resume: () => synth.resume(),
    cancel: () => synth.cancel(),

    /** Đánh dấu đã loaded voices (gọi sau voiceschanged). */
    markVoicesLoaded() {
      // voiceschanged tự trigger khi ready
    },
  };
}

/**
 * Tự động chọn voice tốt nhất cho môi trường test.
 */
export async function preloadVoices(): Promise<void> {
  if (!laCoHoTroTts()) return;

  const voices = layDanhSachVoice();
  if (voices.length > 0) return;

  return new Promise((resolve) => {
    window.speechSynthesis.onvoiceschanged = () => {
      resolve();
    };
    // Timeout safety
    setTimeout(resolve, 2000);
  });
}
