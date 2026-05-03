import React from "react";
import { loadProgress as _load } from "./_progress_helper";

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full h-3 rounded-full bg-muted">
        <div className="h-3 rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function Progress() {
  const p = _load();
  const accuracy = p.attempts ? Math.round((p.correct / p.attempts) * 100) : 0;

  // mock phoneme breakdown from stored phonemes
  const phonemes = Object.entries(p.phonemes || {}).map(([k, v]) => ({ k, pct: v.attempts ? Math.round((v.correct / v.attempts) * 100) : 0 }));

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <h1 className="text-3xl font-extrabold">Progress</h1>
        <p className="text-muted-foreground mt-1">Overview of learning progress and phoneme accuracy.</p>

        <section className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="card-soft p-6">
            <h3 className="font-semibold">Summary</h3>
            <p className="text-sm text-muted-foreground mt-2">Total practice attempts: <strong>{p.attempts}</strong></p>
            <p className="text-sm text-muted-foreground mt-1">Total time: <strong>{Math.floor((p.timeSpent||0)/60)}m</strong></p>
            <p className="text-sm text-muted-foreground mt-1">Overall accuracy: <strong>{accuracy}%</strong></p>
          </div>

          <div className="card-soft p-6">
            <h3 className="font-semibold">XP & Level</h3>
            <p className="text-sm text-muted-foreground mt-2">Level: <strong>{p.level}</strong></p>
            <p className="text-sm text-muted-foreground mt-1">XP: <strong>{p.xp}</strong></p>
          </div>
        </section>

        <section className="mt-6 card-soft p-6">
          <h3 className="font-semibold">Phoneme Accuracy</h3>
          <div className="mt-4">
            {phonemes.length === 0 && <p className="text-muted-foreground">No data yet — practice to see phoneme breakdown.</p>}
            {phonemes.map((ph) => (
              <Bar key={ph.k} label={ph.k} value={ph.pct} />
            ))}
          </div>
        </section>

        <div className="mt-6 flex gap-3">
          <a className="px-4 py-2 rounded-md bg-primary text-primary-foreground" href="/">Back to Home</a>
          <a className="px-4 py-2 rounded-md border" href="/practice">Continue Practicing</a>
        </div>
      </main>
    </div>
  );
}
