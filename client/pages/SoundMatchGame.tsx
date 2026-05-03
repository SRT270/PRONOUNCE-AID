import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAudioAssist } from "@/hooks/useAudioAssist";
import { speak } from "@/utils/speech";
import { PHONEME_TIPS } from "@/components/pronounce-aid/PhonemeData";

// Simple rhyme groups for kids
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
  if (p.correct >= 5) badges.add("Sound Matcher");
  if (p.correct >= 20) badges.add("Phoneme Pro");
  return { ...p, badges: Array.from(badges) };
}

export default function SoundMatchGame() {
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const [mode, setMode] = useState<'phoneme' | 'rhyme'>('phoneme');
  const [targetPhoneme, setTargetPhoneme] = useState("");
  const [playWord, setPlayWord] = useState("");
  const [correctPick, setCorrectPick] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showButtons, setShowButtons] = useState(false);
  const { enabled: audioAssistEnabled } = useAudioAssist();

  const phonemes = useMemo(() => Object.keys(PHONEME_TIPS), []);
  const rhymeFamilies = useMemo(() => Object.keys(RHYME_GROUPS), []);

  const generateRound = useCallback(() => {
    const newMode = Math.random() < 0.5 ? 'phoneme' : 'rhyme';
    setMode(newMode);

    if (newMode === 'phoneme') {
      const target = phonemes[Math.floor(Math.random() * phonemes.length)];
      setTargetPhoneme(target);
      const tips = PHONEME_TIPS[target];
      if (!tips || !tips.example) {
        generateRound(); // Retry
        return;
      }
      const exampleWords = tips.example.split(', ').map(w => w.trim());
      if (exampleWords.length < 1) {
        generateRound(); // Retry
        return;
      }

      // Prefer two different words if available
      let playW, correctW;
      if (exampleWords.length >= 2) {
        [playW, correctW] = exampleWords.sort(() => Math.random() - 0.5);
      } else {
        playW = correctW = exampleWords[0];
      }
      setPlayWord(playW);
      setCorrectPick(correctW);

      // Generate 3 distractor words from other phonemes
      const distractors = [];
      while (distractors.length < 3) {
        const otherPhoneme = phonemes[Math.floor(Math.random() * phonemes.length)];
        if (otherPhoneme !== target && PHONEME_TIPS[otherPhoneme]?.example) {
          const otherExamples = PHONEME_TIPS[otherPhoneme].example.split(', ').map(w => w.trim());
          if (otherExamples.length > 0) {
            const otherWord = otherExamples[Math.floor(Math.random() * otherExamples.length)];
            if (!distractors.includes(otherWord) && !exampleWords.includes(otherWord)) {
              distractors.push(otherWord);
            }
          }
        }
      }

      const allOptions = [correctW, ...distractors].sort(() => Math.random() - 0.5);
      setOptions(allOptions);
    } else { // rhyme mode
      const family = rhymeFamilies[Math.floor(Math.random() * rhymeFamilies.length)];
      const familyWords = RHYME_GROUPS[family];
      if (familyWords.length < 2) {
        generateRound(); // Retry
        return;
      }

      // Pick two different words from the family
      const shuffled = [...familyWords].sort(() => Math.random() - 0.5);
      const playW = shuffled[0];
      const correctW = shuffled[1];

      setPlayWord(playW);
      setCorrectPick(correctW);
      setTargetPhoneme(''); // Not used in rhyme mode

      // Generate 3 distractors from other families
      const distractors = [];
      while (distractors.length < 3) {
        const otherFamily = rhymeFamilies[Math.floor(Math.random() * rhymeFamilies.length)];
        if (otherFamily !== family && RHYME_GROUPS[otherFamily]) {
          const otherWords = RHYME_GROUPS[otherFamily];
          if (otherWords.length > 0) {
            const otherWord = otherWords[Math.floor(Math.random() * otherWords.length)];
            if (!distractors.includes(otherWord) && !familyWords.includes(otherWord)) {
              distractors.push(otherWord);
            }
          }
        }
      }

      const allOptions = [correctW, ...distractors].sort(() => Math.random() - 0.5);
      setOptions(allOptions);
    }

    setFeedback("");
    setScore(0);
  }, [phonemes, rhymeFamilies]);

  useEffect(() => {
    generateRound();
  }, [generateRound]);

  const playSound = useCallback(async () => {
    await speak(playWord);
    if (audioAssistEnabled) {
      const prompt = mode === 'rhyme' ? `Which word rhymes with "${playWord}"?` : `Which word has the same sound as "${playWord}"?`;
      await speak(prompt);
    }
  }, [playWord, audioAssistEnabled, mode]);

  const slowPlaySound = useCallback(async () => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('pa_speech_rate') : null;
    const currentRate = saved ? Number(saved) : 0.95;
    await speak(playWord, { rate: currentRate * 0.5 });
    if (audioAssistEnabled) {
      const prompt = mode === 'rhyme' ? `Which word rhymes with "${playWord}"?` : `Which word has the same sound as "${playWord}"?`;
      await speak(prompt, { rate: currentRate * 0.5 });
    }
  }, [playWord, audioAssistEnabled, mode]);

  const onPick = useCallback((picked: string) => {
    const isCorrect = picked === correctPick;
    setScore(isCorrect ? 1 : 0);
    let tips;
    let sameWordNote = playWord === correctPick ? " (same word)" : "";
    let feedbackText;

    if (mode === 'phoneme') {
      tips = PHONEME_TIPS[targetPhoneme];
      feedbackText = isCorrect
        ? `Correct! Both "${playWord}" and "${picked}"${sameWordNote} have the /${tips?.symbol}/ sound. ${tips?.tip || ""} 🎉`
        : `No, "${picked}" has a different sound. "${playWord}" and the correct choice share the /${tips?.symbol}/ sound. ${tips?.tip || ""}`;
    } else { // rhyme mode
      tips = { symbol: 'rhyme', tip: 'Words that rhyme have the same ending sound!' };
      feedbackText = isCorrect
        ? `Correct! "${playWord}" and "${picked}"${sameWordNote} rhyme! ${tips.tip} 🎉`
        : `No, "${picked}" does not rhyme with "${playWord}". The correct choice rhymes with it. ${tips.tip}`;
    }

    setFeedback(feedbackText);

    // Update progress
    const latest = loadProgress();
    const next: Progress = { ...latest };
    next.attempts += 1;
    if (isCorrect) {
      next.correct += 1;
      next.xp += 10;
      const key = mode === 'phoneme' ? targetPhoneme : 'rhyme';
      next.phonemes[key] = next.phonemes[key] || { correct: 0, attempts: 0 };
      next.phonemes[key].correct += 1;
      next.phonemes[key].attempts += 1;
    } else {
      next.xp += 2;
      const key = mode === 'phoneme' ? targetPhoneme : 'rhyme';
      next.phonemes[key] = next.phonemes[key] || { correct: 0, attempts: 0 };
      next.phonemes[key].attempts += 1;
    }
    next.level = levelFromXp(next.xp);
    const withBadges = awardBadges(next);
    setProgress(withBadges);
    saveProgress(withBadges);

    setShowButtons(true);
  }, [targetPhoneme, playWord, correctPick, generateRound, mode]);

  const retry = useCallback(() => {
    setFeedback("");
    setScore(0);
    playSound();
    setShowButtons(false);
  }, [playSound]);

  const nextRound = useCallback(() => {
    generateRound();
    setShowButtons(false);
  }, [generateRound]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <section className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="text-4xl font-extrabold">Sound Match Game</h1>
          <p className="text-muted-foreground">
            {mode === 'phoneme' ? 'Listen to the word and pick another word with the same sound!' : 'Listen to the word and pick one that rhymes with it!'}
          </p>
          <div className="mt-4 space-y-2">
            <p>Level: {progress.level} | XP: {progress.xp} | Score: {progress.correct}/{progress.attempts}</p>
            <p className="text-sm text-muted-foreground">Mode: {mode === 'phoneme' ? 'Phoneme Match' : 'Rhyme Match'}</p>
            <div className="flex gap-2 justify-center mt-2">
              <Button onClick={playSound}>🔊 Play Word</Button>
              <Button onClick={slowPlaySound}>🐢 Slow</Button>
            </div>
            <p className="text-sm text-muted-foreground italic">I said: <strong>"{playWord}"</strong></p>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {options.map((word) => (
            <div
              key={word}
              onClick={() => onPick(word)}
              className="p-6 rounded-xl border cursor-pointer hover:shadow-md text-center transition-all"
            >
              <div className="text-2xl mb-2">📖</div>
              <div className="font-bold text-lg">{word}</div>
              <div className="text-xs text-muted-foreground">Tap to select</div>
            </div>
          ))}
        </section>

        {feedback && (
          <div className="mt-6 p-4 rounded-xl bg-primary/10 text-center max-w-2xl mx-auto">
            <p className="font-semibold whitespace-pre-wrap">{feedback}</p>
          </div>
        )}

        {showButtons && (
          <div className="mt-4 flex justify-center gap-4">
            <Button onClick={retry} variant="outline">Retry</Button>
            <Button onClick={nextRound}>Next Round</Button>
          </div>
        )}

        <div className="mt-8 text-center">
          <Button onClick={generateRound} variant="outline">New Round</Button>
        </div>
      </main>
    </div>
  );
}
