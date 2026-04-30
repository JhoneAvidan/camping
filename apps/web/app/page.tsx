export default function HomePage() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-24">
      <div className="max-w-2xl text-center space-y-6">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Phase 0 · Scaffold
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          מחנאות
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          תכנון משותף של טיולי מחנאות — ציוד, מטלות, יעדים ומוזמנים, הכול
          במקום אחד.
        </p>
        <p className="text-sm text-muted-foreground">
          Next.js 16 · React 19 · Tailwind v4 · RTL ready
        </p>
      </div>
    </main>
  );
}
