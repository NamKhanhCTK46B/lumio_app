/**
 * Web Speech API — Speech-to-Text (STT) wrapper.
 */

export type SttOptions = {
  lang?: string;
  continuous?: boolean;
  interimResults?: boolean;
};

export type SttResult = {
  transcript: string;
  confidence: number;
  isFinal: boolean;
};

type SttCallbacks = {
  onResult: (result: SttResult) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
};

/** Minimal duck-typed SpeechRecognition interface so we don't depend on DOM lib. */
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: {
    results: Array<Array<{ transcript: string; confidence: number }>>;
    resultIndex: number;
  }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

/** Cast window to allow webkit prefix without DOM lib requirement. */
function getRecognizerCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function laCoHoTroStt(): boolean {
  return getRecognizerCtor() !== null;
}

function taoRecognizer(opts: SttOptions): SpeechRecognitionInstance {
  const SR = getRecognizerCtor();
  if (!SR) throw new Error("SpeechRecognition not supported");
  const recognizer = new SR();
  recognizer.lang = opts.lang ?? "en-US";
  recognizer.continuous = opts.continuous ?? false;
  recognizer.interimResults = opts.interimResults ?? true;
  recognizer.maxAlternatives = 1;
  return recognizer;
}

/**
 * Returns a controller to start/stop speech recognition.
 * Call on client side only.
 */
export function taoSttController(callbacks: SttCallbacks, opts: SttOptions = {}) {
  if (!laCoHoTroStt()) {
    return {
      start: () => callbacks.onError?.("Trình duyệt không hỗ trợ nhận dạng giọng nói."),
      stop: () => {},
      abort: () => {},
      isSupported: false as const,
    };
  }

  const recognizer = taoRecognizer(opts);
  let isRunning = false;

  recognizer.onresult = (event) => {
    const list = event.results as unknown as Array<{
      isFinal: boolean;
      [index: number]: { transcript: string; confidence: number };
    }>;
    const result = list[event.resultIndex];
    const isFinal = result.isFinal;
    const confidence = result[0]?.confidence ?? 0;
    const transcript = (result[0]?.transcript ?? "").trim();

    if (transcript) {
      callbacks.onResult({ transcript, confidence, isFinal });
    }
  };

  recognizer.onerror = (event) => {
    callbacks.onError?.(event.error);
  };

  recognizer.onend = () => {
    isRunning = false;
    callbacks.onEnd?.();
  };

  return {
    isSupported: true as const,
    start: () => {
      if (isRunning) return;
      isRunning = true;
      try { recognizer.start(); } catch { /* ignore if already started */ }
    },
    stop: () => {
      if (!isRunning) return;
      isRunning = false;
      try { recognizer.stop(); } catch { /* ignore */ }
    },
    abort: () => {
      isRunning = false;
      try { recognizer.abort(); } catch { /* ignore */ }
    },
  };
}

/** Convert audio Blob to base64 string for server upload. */
export function audioBlobSangBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(",")[1];
      if (base64) resolve(base64);
      else reject(new Error("Không trích được base64 từ audio blob"));
    };
    reader.onerror = () => reject(new Error("FileReader lỗi"));
    reader.readAsDataURL(blob);
  });
}
