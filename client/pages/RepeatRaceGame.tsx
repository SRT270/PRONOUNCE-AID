import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAudioAssist } from "@/hooks/useAudioAssist";
import { speak, startRecognition, analyzePronunciation } from "@/utils/speech";
import type { RecognitionController } from "@/utils/speech";
import { KID_WORDS } from "@/components/pronounce-aid/PhonemeData";

// Progress storage (reuse from Practice)
const key = "pa_progress_v1";

type Progress = {
  xp: number;
  level: number;
  attempts: number;
  correct: number;
  timeSpent: number;
  phonemes: Record<string, { correct: number; attempts: number }>;
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
  if (p.correct >= 10) badges.add("Quick Repeater");
  if (p.level >= 3) badges.add("Speed Speaker");
  return { ...p, badges: Array.from(badges) };
}

export default function RepeatRaceGame() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [word, setWord] = useState<string>("");
  const [isListening, setIsListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [result, setResult] = useState<ReturnType<typeof analyzePronunciation> | null>(null);
  const [timeTaken, setTimeTaken] = useState(0);
  const [feedback, setFeedback] = useState("");
  const recRef = useRef<RecognitionController | null>(null);
  const startTimeRef = useRef<number>(0);
  const { enabled: audioAssistEnabled } = useAudioAssist();

  const srSupported = typeof window !== "undefined" && ((window as any).webkitSpeechRecognition || (window as any).SpeechRecognition);

  const generateWord = useCallback(() => {
    const newWord = KID_WORDS[Math.floor(Math.random() * KID_WORDS.length)];
    setWord(newWord);
    setHeard("");
    setResult(null);
    setTimeTaken(0);
    setFeedback("");
    speak(newWord);
    if (audioAssistEnabled) speak("Repeat after me");
  }, [audioAssistEnabled]);

  useEffect(() => {
    generateWord();
  }, [generateWord]);

  const onListen = useCallback(() => {
    if (!srSupported) {
      speak("Speech recognition not supported. Use Chrome or Edge.");
      return;
    }
    setIsListening(true);
    setHeard("");
    setResult(null);
    startTimeRef.current = Date.now();
    recRef.current = startRecognition({
      onResult: (text: string, isFinal: boolean) => {
        setHeard(text);
        if (isFinal) {
          setIsListening(false);
          const endTime = Date.now();
          setTimeTaken(Math.round((endTime - startTimeRef.current) / 1000));
          const analysis = analyzePronunciation(word, text);
          setResult(analysis);
          evaluate(analysis, text);
        }
      },
      onEnd: () => {
        setIsListening(false);
        if (heard) {
          const endTime = Date.now();
          setTimeTaken(Math.round((endTime - startTimeRef.current) / 1000));
          const analysis = analyzePronunciation(word, heard);
          setResult(analysis);
          evaluate(analysis, heard);
        }
      },
      onError: () => {
        setIsListening(false);
        setFeedback("Error recording. Try again.");
      },
    });
  }, [word, heard]);

  const onStop = useCallback(() => {
    recRef.current?.stop();
    setIsListening(false);
    if (heard) {
      const endTime = Date.now();
      setTimeTaken(Math.round((endTime - startTimeRef.current) / 1000));
      const analysis = analyzePronunciation(word, heard);
      setResult(analysis);
      evaluate(analysis, heard);
    }
  }, [word, heard]);

  const evaluate = useCallback((analysis: ReturnType<typeof analyzePronunciation>, text: string) => {
    const isCorrect = analysis.correct;
    let xpAward = isCorrect ? 15 : 5;
    if (isCorrect && timeTaken < 5) xpAward += 10; // Bonus for speed
    setFeedback(isCorrect ? `Great! Time: ${timeTaken}s ${timeTaken < 5 ? '(Speed bonus!)' : ''}` : `Try faster next time. Time: ${timeTaken}s`);

    // Update progress
    const latest = loadProgress();
    const next: Progress = { ...latest };
    next.attempts += 1;
    if (isCorrect) {
      next.correct += 1;
      next.xp += xpAward;
    } else {
      next.xp += 5;
    }
    if (analysis.firstMismatch?.expected) {
      const ph = analysis.firstMismatch.expected;
      next.phonemes[ph] = next.phonemes[ph] || { correct: 0, attempts: 0 };
      next.phonemes[ph].attempts += 1;
      if (isCorrect) next.phonemes[ph].correct += 1;
    }
    next.level = levelFromXp(next.xp);
    const withBadges = awardBadges(next);
    setProgress(withBadges);
    saveProgress(withBadges);

    setTimeout(generateWord, 3000);
  }, [timeTaken, generateWord]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <section className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-extrabold">Repeat Race Game</h1>
          <p className="text-muted-foreground">Repeat the word as fast as you can for bonus points!</p>
          <div className="mt-4 space-y-2">
            <p className="text-xl font-bold capitalize">{word}</p>
            <p>Level: {progress.level} | XP: {progress.xp} | Accuracy: {progress.attempts ? Math.round((progress.correct / progress.attempts) * 100) : 0}%</p>
            <div className="flex gap-2 justify-center mt-2">
              <Button onClick={() => speak(word)}>🔊 Hear Word</Button>
              <Button onClick={() => {
                const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pa_speech_rate') : null;
                const currentRate = saved ? Number(saved) : 0.95;
                speak(word, { rate: currentRate * 0.5 });
              }}>🐢 Slow</Button>
            </div>
          </div>
        </section>

        <section className="text-center">
          <button
            onClick={isListening ? onStop : onListen}
            className={`px-8 py-4 rounded-full text-white font-bold text-lg ${isListening ? 'bg-red-500' : 'bg-primary'}`}
            disabled={!srSupported}
          >
            {isListening ? `⏹ Stop (Time: ${timeTaken}s)` : '🎙️ Start Repeating'}
          </button>
          {!srSupported && <p className="mt-2 text-muted-foreground">Speech recognition required.</p>}
        </section>

        {heard && (
          <section className="mt-6 p-4 rounded-xl bg-card">
            <p className="text-sm">You said: "{heard}"</p>
            {result && (
              <p className="mt-2">Score: {result.score}/100 {result.correct ? '✅ Correct' : '❌ Keep practicing'}</p>
            )}
          </section>
        )}

        {feedback && (
          <div className="mt-4 p-4 rounded-xl bg-primary/10 text-center">
            <p className="font-semibold">{feedback}</p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button onClick={generateWord} variant="outline">New Word</Button>
        </div>
      </main>
    </div>
  );
}
