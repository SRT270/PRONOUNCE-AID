import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAudioAssist } from "@/hooks/useAudioAssist";
import { speak } from "@/utils/speech";
import { KID_WORDS } from "@/components/pronounce-aid/PhonemeData";

// Simple rhyme groups for kids (shared with SoundMatchGame)
const RHYME_GROUPS: Record<string, string[]> = {
  'at': ['cat', 'hat', 'mat', 'bat', 'rat'],
  'ake': ['cake', 'lake', 'make', 'take', 'bake'],
  'all': ['ball', 'call', 'fall', 'tall', 'wall'],
  'an': ['can', 'fan', 'man', 'pan', 'van'],
  'ay': ['day', 'may', 'play', 'say', 'way'],
  'ell': ['bell', 'cell', 'dell', 'shell', 'tell'],
  'est': ['best', 'nest', 'rest', 'test', 'vest'],
  'ice': ['dice', 'mice', 'nice', 'rice', 'twice'],
  'ight': ['light', 'night', 'right', 'sight', 'tight'],
  'in': ['bin', 'fin', 'pin', 'sin', 'win'],
  'og': ['dog', 'fog', 'log', 'hog', 'jog'],
  'op': ['cop', 'hop', 'mop', 'pop', 'top'],
  'ug': ['bug', 'dug', 'hug', 'rug', 'tug'],
  'un': ['fun', 'gun', 'run', 'sun', 'nun'],
};

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
  if (p.correct >= 8) badges.add("Word Wizard");
  if (p.level >= 4) badges.add("Mystery Master");
  return { ...p, badges: Array.from(badges) };
}

export default function MysteryWordGame() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [targetWord, setTargetWord] = useState("");
  const [clueLevel, setClueLevel] = useState(1); // 1: first letter sound, 2: more letters, 3: full word hint
  const [userGuess, setUserGuess] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showButtons, setShowButtons] = useState(false);
  const { enabled: audioAssistEnabled } = useAudioAssist();

  const generateWord = useCallback(() => {
    const newWord = KID_WORDS[Math.floor(Math.random() * KID_WORDS.length)];
    setTargetWord(newWord);
    setClueLevel(1);
    setUserGuess("");
    setFeedback("");
    // Play initial clue
    playClue(newWord, 1);
  }, []);

  useEffect(() => {
    generateWord();
  }, [generateWord]);

  const getRhymeClue = useCallback((word: string) => {
    // Try to find rhyme family based on last 2 letters (common for short kid words)
    const possibleEndings = [word.slice(-2), word.slice(-3)];
    let rhymingWord = null;
    for (const ending of possibleEndings) {
      if (RHYME_GROUPS[ending]) {
        const group = RHYME_GROUPS[ending];
        // Find another word in the group that's not the target
        rhymingWord = group.find(w => w.toLowerCase() !== word.toLowerCase());
        if (rhymingWord) break;
      }
    }
    if (rhymingWord) {
      return `It rhymes with ${rhymingWord}.`;
    } else {
      // Fallback to last letter
      return `It ends with ${word.slice(-1)}.`;
    }
  }, []);

  const playClue = useCallback((word: string, level: number) => {
    let clueText = "";
    if (level === 1) {
      clueText = `The word starts with ${word.charAt(0)} and has ${word.length} letters.`;
    } else if (level === 2) {
      clueText = getRhymeClue(word);
    } else {
      clueText = `Hint: It's a common ${word.length}-letter word starting with ${word.charAt(0)}.`;
    }
    speak(clueText);
    if (audioAssistEnabled) speak(clueText);
  }, [audioAssistEnabled, getRhymeClue]);

  const submitGuess = useCallback(() => {
    if (!userGuess.trim()) return;
    const guessLower = userGuess.toLowerCase().trim();
    const isCorrect = guessLower === targetWord.toLowerCase();
    setFeedback(isCorrect ? `Yes! It's ${targetWord}! 🎉` : `No, it's not "${userGuess}". Try again!`);

    // Update progress
    const latest = loadProgress();
    const next: Progress = { ...latest };
    next.attempts += 1;
    if (isCorrect) {
      next.correct += 1;
      next.xp += 20; // Higher reward for guessing
      next.badges = Array.from(new Set([...next.badges, "Word Guesser"]));
    } else {
      next.xp += 3;
    }
    next.level = levelFromXp(next.xp);
    const withBadges = awardBadges(next);
    setProgress(withBadges);
    saveProgress(withBadges);

    if (!isCorrect) {
      setClueLevel(prev => Math.min(3, prev + 1));
    }
    setShowButtons(true);
    setUserGuess("");
  }, [userGuess, targetWord, clueLevel, generateWord, playClue, audioAssistEnabled]);

  const retry = useCallback(() => {
    setUserGuess("");
    setFeedback("");
    setClueLevel(1);
    playClue(targetWord, 1);
    setShowButtons(false);
  }, [targetWord, playClue]);

  const nextWord = useCallback(() => {
    generateWord();
    setShowButtons(false);
  }, [generateWord]);



  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <section className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-extrabold">Mystery Word Game</h1>
          <p className="text-muted-foreground">Guess the word from audio clues!</p>
          <div className="mt-4 space-y-2">
            <p>Level: {progress.level} | XP: {progress.xp} | Guesses: {progress.correct}/{progress.attempts}</p>
            <Button onClick={() => playClue(targetWord, clueLevel)} className="mt-2">🔊 Play Clue {clueLevel}</Button>
          </div>
        </section>

        <section className="max-w-md mx-auto">
          <Input
            value={userGuess}
            onChange={(e) => setUserGuess(e.target.value)}
            placeholder="Type your guess..."
            className="mb-4"
            onKeyPress={(e) => e.key === 'Enter' && submitGuess()}
          />
          <Button onClick={submitGuess} className="w-full mb-4">Submit Guess</Button>

          <div className="p-4 rounded-xl bg-card">
            <p className="text-sm font-semibold">Clue {clueLevel}:</p>
            <p className="mt-2 text-muted-foreground">
              {clueLevel === 1 && `Starts with ${targetWord.charAt(0)}, ${targetWord.length} letters.`}
              {clueLevel === 2 && getRhymeClue(targetWord)}
              {clueLevel === 3 && `Common word starting with ${targetWord.charAt(0)}.`}
            </p>
          </div>
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
          <Button onClick={generateWord} variant="outline">New Mystery</Button>
        </div>
      </main>
    </div>
  );
}
