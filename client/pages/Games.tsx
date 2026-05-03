import { useMemo } from "react";
import { Link } from "react-router-dom";

export default function Games() {
  const cards = useMemo(() => [
    { id: 'sound-match', title: 'Sound Match', desc: 'Identify the correct phoneme for the target sound.' },
    { id: 'repeat-race', title: 'Repeat Race', desc: 'Repeat words quickly to earn XP.' },
    { id: 'mystery-word', title: 'Mystery Word', desc: 'Guess the word from clues and sounds.' },
    { id: 'spelling-learning', title: 'Spelling Learning', desc: 'Listen and spell words correctly with feedback.' },
  ], []);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <h1 className="text-3xl font-extrabold">Games</h1>
        <p className="text-muted-foreground mt-1">Play short, focused games that reinforce pronunciation in a fun way.</p>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {cards.map(c => (
            <div key={c.id} className="card-soft p-5 shadow-sm">
              <h3 className="font-semibold text-lg">{c.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{c.desc}</p>
              <div className="mt-4">
                <Link to={`/games/${c.id}`} className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground">Play</Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-sm text-muted-foreground">More games will be added soon. Teachers: contact us to request custom activities.</div>
      </main>
    </div>
  );
}
