import React from "react";

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

export default function Index() {
  const progress = typeof window !== "undefined" ? loadProgress() : { xp: 0, level: 1, attempts: 0, correct: 0, timeSpent: 0, phonemes: {}, badges: [] };

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-16 text-center">
        <h1 className="text-5xl font-extrabold mb-4">Pronounce Aid</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A friendly, accessible pronunciation coach for K–8 learners — clear feedback, audio tips, and engaging practice.</p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <a href="/practice" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold shadow-lg">Start Practicing</a>
          <a href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border">View Progress</a>
        </div>

        <section className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="card-soft p-6">
            <h3 className="font-semibold text-lg">Quick Practice</h3>
            <p className="text-sm text-muted-foreground mt-2">Short, focused word practice with immediate audio feedback and helpful tips.</p>
          </div>

          <div className="card-soft p-6">
            <h3 className="font-semibold text-lg">Teacher & Parent Dashboard</h3>
            <p className="text-sm text-muted-foreground mt-2">Track accuracy, time spent, and skill development across phonemes.</p>
            <p className="mt-3 text-xs text-muted-foreground">Current Level: <strong>{progress.level}</strong> — XP: <strong>{progress.xp}</strong></p>
          </div>

          <div className="card-soft p-6">
            <h3 className="font-semibold text-lg">Mini Games</h3>
            <p className="text-sm text-muted-foreground mt-2">Fun activities that reinforce sounds — play to earn XP and badges.</p>
          </div>
        </section>

        <p className="mt-8 text-xs text-muted-foreground">Best experienced in Chrome or Edge (Web Speech API). If recording isn't working, check your browser permissions for microphone access.</p>
      </main>
    </div>
  );
}
