import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAudioAssist } from "@/hooks/useAudioAssist";
import { speak } from "@/utils/speech";
import { KID_WORDS, PHONEME_TIPS } from "@/components/pronounce-aid/PhonemeData";

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
  if (p.correct >= 10) badges.add("Spelling Star");
  if (p.level >= 3) badges.add("Word Speller");
  return { ...p, badges: Array.from(badges) };
}

export default function SpellingLearningGame() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [targetWord, setTargetWord] = useState("");
  const [userSpelling, setUserSpelling] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showCorrect, setShowCorrect] = useState(false);
  const [errorPhoneme, setErrorPhoneme] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [showButtons, setShowButtons] = useState(false);
  const { enabled: audioAssistEnabled } = useAudioAssist();

  const generateWord = useCallback(() => {
    const newWord = KID_WORDS[Math.floor(Math.random() * KID_WORDS.length)];
    setTargetWord(newWord);
    setUserSpelling("");
    setFeedback("");
    setShowCorrect(false);
    setErrorPhoneme("");
    setMistakes(0);
    speak(newWord);
    if (audioAssistEnabled) speak("Spell this word");
  }, [audioAssistEnabled]);

  useEffect(() => {
    generateWord();
  }, [generateWord]);

  const submitSpelling = useCallback(() => {
    if (!userSpelling.trim()) return;
    const spellingLower = userSpelling.toLowerCase().trim();
    const isCorrect = spellingLower === targetWord.toLowerCase();
    setShowCorrect(true);

    if (isCorrect) {
      setFeedback("Perfect spelling! ✅");
      // Update progress
      const latest = loadProgress();
      const next: Progress = { ...latest };
      next.attempts += 1;
      next.correct += 1;
      next.xp += 15;
      next.level = levelFromXp(next.xp);
      const withBadges = awardBadges(next);
      setProgress(withBadges);
      saveProgress(withBadges);
    } else {
      const newMistakes = mistakes + 1;
      setMistakes(newMistakes);
      // Find first mismatch for phoneme feedback
      let mismatchPhoneme = "";
      let mismatchIndex = -1;
      for (let i = 0; i < Math.min(spellingLower.length, targetWord.length); i++) {
        if (spellingLower[i] !== targetWord[i]) {
          mismatchPhoneme = targetWord[i]; // Use expected letter as phoneme key
          mismatchIndex = i;
          break;
        }
      }
      if (newMistakes >= 3) {
        setShowCorrect(true);
        setFeedback(`You've made 3 mistakes. The correct spelling is "${targetWord}".`);
        // Update progress for repeated errors
        const latest = loadProgress();
        const next: Progress = { ...latest };
        next.attempts += 1;
        next.xp += 2; // Low XP for repeated errors
        if (mismatchPhoneme) {
          next.phonemes[mismatchPhoneme] = next.phonemes[mismatchPhoneme] || { correct: 0, attempts: 0 };
          next.phonemes[mismatchPhoneme].attempts += 1;
        }
        next.level = levelFromXp(next.xp);
        const withBadges = awardBadges(next);
        setProgress(withBadges);
        saveProgress(withBadges);
      } else if (mismatchPhoneme && PHONEME_TIPS[mismatchPhoneme]) {
        setErrorPhoneme(mismatchPhoneme);
        setFeedback(`Close! Try again. You've made ${newMistakes}/3 mistakes.`);
        // Partial progress
        const latest = loadProgress();
        const next: Progress = { ...latest };
        next.attempts += 1;
        next.xp += 5;
        next.phonemes[mismatchPhoneme] = next.phonemes[mismatchPhoneme] || { correct: 0, attempts: 0 };
        next.phonemes[mismatchPhoneme].attempts += 1;
        next.level = levelFromXp(next.xp);
        const withBadges = awardBadges(next);
        setProgress(withBadges);
        saveProgress(withBadges);
      } else {
        setFeedback(`Not quite. Try again! You've made ${newMistakes}/3 mistakes.`);
        // Partial progress
        const latest = loadProgress();
        const next: Progress = { ...latest };
        next.attempts += 1;
        next.xp += 5;
        next.level = levelFromXp(next.xp);
        const withBadges = awardBadges(next);
        setProgress(withBadges);
        saveProgress(withBadges);
      }
    }
    setShowButtons(true);
    setUserSpelling("");
  }, [userSpelling, targetWord, mistakes, generateWord]);

  const retry = useCallback(() => {
    setUserSpelling("");
    setFeedback("");
    setMistakes(0);
    setErrorPhoneme("");
    setShowCorrect(false);
    speak(targetWord);
    setShowButtons(false);
  }, [targetWord]);

  const nextWord = useCallback(() => {
    generateWord();
    setShowButtons(false);
  }, [generateWord]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <section className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-extrabold">Spelling Learning Game</h1>
          <p className="text-muted-foreground">Listen to the word and spell it correctly!</p>
          <div className="mt-4 space-y-2">
            <p>Level: {progress.level} | XP: {progress.xp} | Accuracy: {progress.attempts ? Math.round((progress.correct / progress.attempts) * 100) : 0}%</p>
            <p className="text-sm text-muted-foreground">Mistakes this word: {mistakes}/3</p>
            <div className="flex gap-2 justify-center mt-2">
              <Button onClick={() => speak(targetWord)}>🔊 Hear Word</Button>
              <Button onClick={() => {
                const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pa_speech_rate') : null;
                const currentRate = saved ? Number(saved) : 0.95;
                speak(targetWord, { rate: currentRate * 0.5 });
              }}>🐢 Slow</Button>
            </div>
          </div>
        </section>

        <section className="max-w-md mx-auto">
          <Input
            value={userSpelling}
            onChange={(e) => setUserSpelling(e.target.value)}
            placeholder="Type the spelling..."
            className="mb-4 text-lg"
            onKeyPress={(e) => e.key === 'Enter' && submitSpelling()}
          />
          <Button onClick={submitSpelling} className="w-full mb-4">Check Spelling</Button>

          {showCorrect && (
            <div className="p-4 rounded-xl bg-card">
              <p className="text-sm font-semibold">Correct Spelling:</p>
              <p className="mt-2 text-lg font-bold capitalize">{targetWord}</p>
            </div>
          )}

          {errorPhoneme && (
            <div className="mt-4 p-4 rounded-xl bg-amber-50">
              <p className="text-sm">Focus on: /{PHONEME_TIPS[errorPhoneme]?.symbol}/</p>
              <p className="text-xs text-muted-foreground">{PHONEME_TIPS[errorPhoneme]?.tip}</p>
            </div>
          )}
        </section>

        {feedback && (
          <div className="mt-6 p-4 rounded-xl bg-primary/10 text-center">
            <p className="font-semibold">{feedback}</p>
          </div>
        )}

        {showButtons && (
          <div className="mt-4 flex justify-center gap-4">
            <Button onClick={retry} variant="outline">Retry</Button>
            <Button onClick={nextWord}>Next Word</Button>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button onClick={generateWord} variant="outline">New Word</Button>
        </div>
      </main>
    </div>
  );
}
