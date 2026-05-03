import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { analyzePronunciation, speak, startRecognition } from "@/utils/speech";
import type { RecognitionController } from "@/utils/speech";
import { KID_WORDS, PHONEME_TIPS } from "@/components/pronounce-aid/PhonemeData";
import { useAudioAssist } from "@/hooks/useAudioAssist";

// Progress storage
const key = "pa_progress_v1";

type PhonemeStats = Record<string, { correct: number; attempts: number }>;

type Progress = {
  xp: number;
  level: number;
  attempts: number;
  correct: number;
  timeStart?: number;
  timeSpent: number; // seconds
  phonemes: PhonemeStats;
  badges: string[];
};

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {}
  return { xp: 0, level: 1, attempts: 0, correct: 0, timeSpent: 0, phonemes: {}, badges: [] };
}

function saveProgress(p: Progress) {
  localStorage.setItem(key, JSON.stringify(p));
}

function levelFromXp(xp: number) {
  return Math.max(1, Math.floor(1 + Math.sqrt(xp / 50)));
}

function awardBadges(p: Progress): Progress {
  const badges = new Set(p.badges);
  if (p.correct >= 5) badges.add("Starter Speaker");
  if (p.correct >= 20) badges.add("Sound Sleuth");
  if (p.level >= 5) badges.add("Phoneme Pro");
  return { ...p, badges: Array.from(badges) };
}

export default function Practice() {
  const [progress, setProgress] = useState<Progress>(() => ({ ...loadProgress(), timeStart: Date.now() }));
  const [word, setWord] = useState<string>(() => KID_WORDS[Math.floor(Math.random() * KID_WORDS.length)]);
  const [isListening, setIsListening] = useState(false);
  const [heard, setHeard] = useState<string>("");
  const [result, setResult] = useState<ReturnType<typeof analyzePronunciation> | null>(null);
  const recRef = useRef<RecognitionController | null>(null);
  const lastHeardRef = useRef<string>("");
  const { speakHint, enabled: audioAssistEnabled } = useAudioAssist();

  // session time tracking
  useEffect(() => {
    const start = Date.now();
    return () => {
      const delta = Math.floor((Date.now() - start) / 1000);
      const latest = loadProgress();
      const merged: Progress = { ...latest, timeSpent: (latest.timeSpent || 0) + delta };
      saveProgress(merged);
    };
  }, []);

  const srSupported = typeof window !== "undefined" && ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);

  const evaluateWithText = useCallback((text: string) => {
    if (!text) {
      speakHint("I didn't hear anything. Try again.");
      return;
    }

    setHeard(text);
    const r = analyzePronunciation(word, text);
    setResult(r);

    // update progress
    const latest = loadProgress();
    const next: Progress = { ...latest };
    next.attempts += 1;
    if (r.correct) {
      next.correct += 1;
      next.xp += 10;
    } else {
      next.xp += 4;
    }
    if (r.firstMismatch?.expected) {
      const ph = r.firstMismatch.expected;
      next.phonemes[ph] = next.phonemes[ph] || { correct: 0, attempts: 0 };
      next.phonemes[ph].attempts += 1;
      if (r.correct) next.phonemes[ph].correct += 1;
    }
    next.level = levelFromXp(next.xp);
    const withBadges = awardBadges(next);
    setProgress(withBadges);
    saveProgress(withBadges);

    // audio feedback
    if (r.correct) {
      speak("Great job! That sounded good.");
    } else if (r.firstMismatch?.expected) {
      const ph = r.firstMismatch.expected;
      const tip = PHONEME_TIPS[ph]?.tip ?? "Try moving your tongue slightly and try again.";
      speak(`Almost! Focus on the ${ph} sound. ${tip}`);
    } else {
      speak("Good try — keep practicing that word.");
    }
  }, [word, speakHint]);

  const onListen = () => {
    if (!srSupported) {
      speakHint("Speech recognition is not available in this browser. Use Chrome or Edge for best results.");
      return;
    }
    setIsListening(true);
    setHeard("");
    setResult(null);
    lastHeardRef.current = "";

    recRef.current = startRecognition({
      onResult: (text: string, isFinal: boolean) => {
        lastHeardRef.current = text;
        setHeard(text);
        if (isFinal) {
          setIsListening(false);
          // small delay to ensure state updated
          setTimeout(() => evaluateWithText(text), 120);
        }
      },
      onEnd: () => {
        setIsListening(false);
        // if we have partial transcript and wasn't evaluated yet
        if (lastHeardRef.current) {
          setTimeout(() => evaluateWithText(lastHeardRef.current), 100);
        }
      },
      onError: () => {
        setIsListening(false);
        speakHint("There was an error with recording. Please try again.");
      },
    });
  };

  const onStop = () => {
    recRef.current?.stop();
    setIsListening(false);
    if (lastHeardRef.current) evaluateWithText(lastHeardRef.current);
  };

  const changeWord = (w: string) => {
    setWord(w);
    setHeard("");
    setResult(null);
    // speak word itself (no extra phrase)
    speak(w);
    if (audioAssistEnabled) speakHint(w);
  };

  const gamePhonemes = useMemo(() => {
    const expected = Object.keys(PHONEME_TIPS);
    const pick = () => expected[Math.floor(Math.random() * expected.length)];
    const correct = (result?.firstMismatch?.expected as string) || pick();
    const options = new Set<string>([correct]);
    while (options.size < 3) options.add(pick());
    return { correct, options: Array.from(options).sort(() => 0.5 - Math.random()) };
  }, [result]);

  const onGamePick = (p: string) => {
    const ok = p === gamePhonemes.correct;
    const latest = loadProgress();
    const next: Progress = { ...latest, xp: latest.xp + (ok ? 8 : 2) };
    next.level = levelFromXp(next.xp);
    if (ok) {
      next.badges = Array.from(new Set([...(next.badges || []), "Sound Matcher"]));
    }
    saveProgress(next);
    setProgress(next);
    speak(ok ? "Correct — nice ear!" : "Not quite — listen again.");
  };

  const statusColor = result ? (result.correct ? "text-green-700 bg-green-50 border-green-200" : "text-amber-800 bg-amber-50 border-amber-200") : "text-muted-foreground";

  // refined UI: narrower aside, clearer practice card
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">Practice — Pronounce Aid</h1>
          <p className="text-lg text-muted-foreground">Practice words, get clear feedback, and build confidence.</p>
        </section>

        <section className="mt-8 grid lg:grid-cols-5 gap-6">
          <aside className="lg:col-span-2 card-soft p-5 shadow-sm max-h-[520px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="font-bold text-lg">Practice Words</h2>
                <p className="text-sm text-muted-foreground">Select a word to practice. Use the speaker to hear it first.</p>
              </div>
              <button onClick={() => { const w = KID_WORDS[Math.floor(Math.random()*KID_WORDS.length)]; changeWord(w); }} className="text-sm px-2 py-1 rounded-md border">Shuffle</button>
            </div>

            <ul className="grid grid-cols-2 gap-2">
              {KID_WORDS.map((w) => (
                <li key={w}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => changeWord(w)}
                    onKeyDown={(e) => { if ((e as any).key === 'Enter') changeWord(w); }}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 flex items-center justify-between",
                      "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-1",
                      w === word ? "border-2 border-primary bg-primary/5 font-semibold" : "border"
                    )}
                    aria-pressed={w === word}
                    onFocus={() => speakHint(`Word ${w}`)}
                  >
                    <span className="capitalize">{w}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); speak(w); }}
                      className="ml-2 text-sm px-2 py-1 rounded-md bg-background border"
                      aria-label={`Hear ${w}`}
                    >🔊</button>
                  </div>
                </li>
              ))}
            </ul>
          </aside>

          <div className="lg:col-span-3 card-soft p-6 shadow-sm">
            <div className="flex md:items-center md:justify-between flex-col md:flex-row gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current word</p>
                <h3 className="text-3xl font-extrabold capitalize">{word}</h3>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={() => speak(word)} aria-label="Hear pronunciation">🔊 Hear</Button>
                <Button onClick={() => speak(word, { rate: 0.6 })} aria-label="Hear slowly">🐢 Slow</Button>

                <button
                  onClick={isListening ? onStop : onListen}
                  className={cn(
                    "inline-flex items-center gap-3 px-5 py-3 rounded-2xl text-white font-bold focus:outline-none",
                    isListening ? "bg-amber-600" : "bg-primary",
                    isListening ? "animate-pulse" : "shadow-md"
                  )}
                  aria-pressed={isListening}
                >
                  <span className="text-lg">{isListening ? "⏹ Stop" : "🎙️ Record"}</span>
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4 bg-card">
                <p className="text-sm text-muted-foreground">You said</p>
                <p className="mt-2 text-lg min-h-[48px]">{heard || (srSupported ? (isListening ? "Listening…" : "Press Record to start") : "Speech recognition not supported in this browser.")}</p>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" onClick={() => evaluateWithText(heard)} aria-label="Check pronunciation">Check</Button>
                  <Button variant="ghost" onClick={() => { setHeard(""); setResult(null); }} aria-label="Clear">Clear</Button>
                </div>
              </div>

              <div className={cn("rounded-xl border p-4", statusColor)}>
                <p className="font-semibold">{result ? (result.correct ? "Great job!" : "Let's improve a sound") : "Feedback"}</p>
                {result ? (
                  <div className="mt-3 text-sm">
                    <p>Score: <strong>{result.score}</strong>/100</p>
                    {result.firstMismatch ? (
                      <div className="mt-2">
                        <p className="font-semibold">Focus sound: {result.firstMismatch.expected}</p>
                        <div className="mt-1">
                          <p className="text-xs">/{PHONEME_TIPS[result.firstMismatch.expected]?.symbol ?? ""}/ — {PHONEME_TIPS[result.firstMismatch.expected]?.name ?? ""}</p>
                          <p className="text-sm mt-1">{PHONEME_TIPS[result.firstMismatch.expected]?.tip ?? "Try this tip to fix your sound."}</p>
                          <p className="text-xs text-muted-foreground">Examples: {PHONEME_TIPS[result.firstMismatch.expected]?.example ?? ""}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm mt-2 text-muted-foreground">No specific mismatch detected. Keep practicing!</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">Record and press Check to get detailed feedback with tips and audio guidance.</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border px-3 py-2 bg-background">
                <p className="text-xs text-muted-foreground">Level</p>
                <p className="text-xl font-bold">{progress.level}</p>
              </div>

              <div className="rounded-xl border px-3 py-2 bg-background">
                <p className="text-xs text-muted-foreground">Accuracy</p>
                <p className="text-xl font-bold">{progress.attempts ? Math.round((progress.correct / progress.attempts) * 100) : 0}%</p>
              </div>

              <div className="grow">
                <div className="h-3 w-full rounded-full bg-muted">
                  <div className="h-3 rounded-full bg-secondary" style={{ width: `${Math.min(100, (progress.xp % 100))}%` }} />
                </div>
                <p className="text-xs mt-1 text-muted-foreground">XP: {progress.xp}</p>
              </div>

              <a className="text-sm font-semibold text-primary hover:underline" href="/dashboard">View dashboard →</a>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
