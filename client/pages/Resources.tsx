import { Link } from "react-router-dom";

export default function Resources(){
  return (
    <div className="min-h-screen bg-background">
      <main className="container py-10">
        <h1 className="text-3xl font-extrabold">Resources</h1>
        <p className="text-muted-foreground mt-1">Guides for parents and teachers, dyslexia-friendly reading tips, and curriculum-aligned practice sets.</p>

        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="card-soft p-6">
            <h3 className="font-semibold">For Parents</h3>
            <p className="text-sm text-muted-foreground mt-2">How to support your child, interpretation of progress metrics, and safe settings.</p>
            <div className="mt-4">
              <Link to="/dashboard" className="text-primary font-semibold">View progress dashboard</Link>
            </div>
          </div>

          <div className="card-soft p-6">
            <h3 className="font-semibold">For Teachers</h3>
            <p className="text-sm text-muted-foreground mt-2">Classroom-ready activities, printable tip cards, and assessment suggestions.</p>
          </div>
        </div>

        <div className="mt-8 text-sm text-muted-foreground">If you need specific resources, email support@pronounceaid.example (demo address).</div>
      </main>
    </div>
  );
}
