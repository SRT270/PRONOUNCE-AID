/* Speech utilities for Pronounce Aid */
export type RecognitionController = { stop: () => void };

export function speak(text: string, opts?: { rate?: number; pitch?: number; lang?: string; voice?: SpeechSynthesisVoice | null }) {
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    try {
      const utter = new SpeechSynthesisUtterance(text);
      // read rate from localStorage if not provided
      const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pa_speech_rate') : null;
      const savedRate = saved ? Number(saved) : undefined;
      utter.rate = opts?.rate ?? savedRate ?? 0.95; // slightly slower for kids
      utter.pitch = opts?.pitch ?? 1.0;
      utter.lang = opts?.lang ?? "en-US";
      if (opts?.voice) utter.voice = opts.voice;
      utter.onend = () => resolve();
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch (e) {
      // fail silently
      resolve();
    }
  });
}

export function startRecognition(options: {
  lang?: string;
  interimResults?: boolean;
  onResult: (text: string, isFinal: boolean) => void;
  onEnd?: () => void;
  onError?: (err: unknown) => void;
}): RecognitionController | null {
  const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return null;
  const rec = new SR();
  rec.lang = options.lang ?? "en-US";
  rec.interimResults = options.interimResults ?? false;
  rec.maxAlternatives = 1;
  rec.continuous = false;
  rec.onresult = (event: any) => {
    // Use the final transcript from the first result
    try {
      const res = event.results[0];
      const isFinal = res.isFinal ?? true;
      const result = res[0]?.transcript?.trim?.() ?? "";
      options.onResult(result.toLowerCase(), isFinal);
      // Stop after final result to make flow predictable
      if (isFinal) {
        try {
          rec.stop();
        } catch {}
      }
    } catch (e) {
      /* ignore parsing errors */
    }
  };
  rec.onerror = (e: any) => options.onError?.(e);
  rec.onend = () => options.onEnd?.();
  try {
    rec.start();
  } catch (e) {
    options.onError?.(e);
    return null;
  }
  return { stop: () => { try { rec.stop(); } catch {} } };
}

/* Simple grapheme-to-phoneme approximation for English K–8 words */
export type PhonemeToken =
  | "TH" | "DH" | "SH" | "CH" | "ZH" | "NG" | "KW" | "PH" | "WH"
  | "A" | "E" | "I" | "O" | "U" | "Y"
  | "B" | "K" | "D" | "F" | "G" | "H" | "J" | "L" | "M" | "N" | "P" | "R" | "S" | "T" | "V" | "W" | "Z" | "X" | "QU";

const RULES: Array<[RegExp, PhonemeToken]> = [
  [/t?he(?=\b)/g, "DH"], // the -> voiced th
  [/th/g, "TH"],
  [/sh/g, "SH"],
  [/ch/g, "CH"],
  [/zh/g, "ZH"],
  [/ng/g, "NG"],
  [/qu/g, "KW"],
  [/ph/g, "F"],
  [/wh/g, "WH"],
];

const LETTER_TO_TOKEN: Record<string, PhonemeToken> = {
  a: "A", e: "E", i: "I", o: "O", u: "U", y: "Y",
  b: "B", c: "K", d: "D", f: "F", g: "G", h: "H", j: "J", k: "K",
  l: "L", m: "M", n: "N", p: "P", q: "K", r: "R", s: "S", t: "T",
  v: "V", w: "W", x: "X", z: "Z"
};

export function toPhonemeTokens(word: string): PhonemeToken[] {
  let w = word.toLowerCase().replace(/[^a-z\s]/g, "");
  // multi-letter rules
  for (const [re, token] of RULES) w = w.replace(re, ` ${token} `);
  // remaining letters
  const tokens: PhonemeToken[] = [];
  for (const ch of w) {
    if (ch === " " || ch === "\n") continue;
    const t = LETTER_TO_TOKEN[ch];
    if (t) tokens.push(t);
  }
  // include multi-letter tokens already inserted above
  const merged = w
    .split(/\s+/)
    .filter(Boolean)
    .map((seg) => (seg.length > 1 && seg === seg.toUpperCase() ? (seg as PhonemeToken) : seg.split("").map((c) => LETTER_TO_TOKEN[c]!).join(" ")))
    .join(" ")
    .split(" ")
    .filter(Boolean) as PhonemeToken[];
  return merged.length ? merged : tokens;
}

export type Analysis = {
  correct: boolean;
  score: number; // 0-100
  expectedTokens: PhonemeToken[];
  heardTokens: PhonemeToken[];
  firstMismatch?: { expected: PhonemeToken; heard?: PhonemeToken; index: number };
};

export function analyzePronunciation(expectedWord: string, heardPhrase: string): Analysis {
  const expectedTokens = toPhonemeTokens(expectedWord);
  const heardTokens = toPhonemeTokens(heardPhrase.split(/\s+/)[0] ?? heardPhrase);

  // LCS dynamic programming to compute best-match length
  const m = expectedTokens.length;
  const n = heardTokens.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (expectedTokens[i - 1] === heardTokens[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const matches = dp[m][n];

  // find first mismatch index by simple scan
  let firstMismatch: Analysis["firstMismatch"] | undefined;
  for (let i = 0; i < expectedTokens.length; i++) {
    if (heardTokens[i] !== expectedTokens[i]) {
      firstMismatch = { expected: expectedTokens[i], heard: heardTokens[i], index: i };
      break;
    }
  }

  const score = Math.round((matches / Math.max(1, m)) * 100);
  const correct = score >= 80; // slightly forgiving

  return { correct, score, expectedTokens, heardTokens, firstMismatch };
}
