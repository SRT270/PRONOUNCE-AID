import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

const key = "pa_progress_v1";

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {}
  return { xp: 0, level: 1, attempts: 0, correct: 0, timeSpent: 0, phonemes: {}, badges: [] };
}

export default function Dashboard() {
  const [data, setData] = useState<Progress>(loadProgress());

  useEffect(() => {
    const onStorage = () => setData(loadProgress());
    window.addEventListener("storage", onStorage);
    const id = setInterval(onStorage, 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(id);
    };
  }, []);

  const accuracy = useMemo(() => (data.attempts ? Math.round((data.correct / Math.max(1, data.attempts)) * 100) : 0), [data]);

  const totalMinutes = Math.floor((data.timeSpent || 0) / 60);

  return (
    <div className="min-h-screen brand-gradient">
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b">
        <div className="container flex h-16 items-center justify-between">
          <a href="/" className="flex items-center gap-2 font-extrabold text-xl">
            <span className="inline-block size-8 rounded-lg" style={{ background: "linear-gradient(135deg,#7C4DFF,#00C2A8)" }} />
            Pronounce Aid
          </a>
          <nav className="flex items-center gap-3">
            <a className="text-sm hover:underline" href="/">Practice</a>
            <a className="text-sm font-semibold" aria-current="page" href="/dashboard">Dashboard</a>
          </nav>
        </div>
      </header>

      <main className="container py-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Learning Progress</h1>
        <p className="text-muted-foreground mt-1">View pronunciation accuracy, time spent, and achievements.</p>

        <section className="grid md:grid-cols-3 gap-6 mt-8">
          <div className="card-soft p-6">
            <p className="text-sm text-muted-foreground">Accuracy</p>
            <p className="text-4xl font-extrabold mt-2">{accuracy}<span className="text-xl">%</span></p>
            <div className="mt-4 h-3 w-full rounded-full bg-muted">
              <div className="h-3 rounded-full bg-primary" style={{ width: `${accuracy}%` }} />
            </div>
          </div>
          <div className="card-soft p-6">
            <p className="text-sm text-muted-foreground">Time Spent</p>
            <p className="text-4xl font-extrabold mt-2">{totalMinutes}<span className="text-xl">m</span></p>
            <p className="text-xs text-muted-foreground mt-1">Across all sessions</p>
          </div>
          <div className="card-soft p-6">
            <p className="text-sm text-muted-foreground">Level</p>
            <p className="text-4xl font-extrabold mt-2">{data.level}</p>
            <p className="text-xs text-muted-foreground mt-1">XP: {data.xp}</p>
          </div>
        </section>

        <section className="mt-10 card-soft p-6">
          <h2 className="text-xl font-bold">Phoneme Breakdown</h2>
          <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Object.entries(data.phonemes).length === 0 && (
              <p className="text-muted-foreground">Practice some words to see phoneme stats.</p>
            )}
            {Object.entries(data.phonemes).map(([p, s]) => {
              const pct = s.attempts ? Math.round((s.correct / s.attempts) * 100) : 0;
              return (
                <div key={p} className="rounded-xl border p-4 bg-background">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{p}</p>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", pct >= 80 ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800")}>{pct}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{s.correct}/{s.attempts} correct</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-10 card-soft p-6">
          <h2 className="text-xl font-bold">Badges</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {data.badges.length === 0 && <p className="text-muted-foreground">No badges yet. Keep practicing!</p>}
            {data.badges.map((b) => (
              <div key={b} className="flex items-center gap-2 rounded-xl border px-3 py-2 bg-gradient-to-br from-yellow-100 to-amber-50">
                <span className="text-2xl">🏅</span>
                <span className="font-semibold">{b}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 flex gap-3">
          <Button variant="secondary" onClick={() => { localStorage.removeItem(key); setData(loadProgress()); }}>Reset Progress</Button>
          <a href="/" className="inline-flex items-center font-semibold text-primary hover:underline">Back to Practice →</a>
        </div>
      </main>

      <footer className="mt-16 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Pronounce Aid
      </footer>
    </div>
  );
}
