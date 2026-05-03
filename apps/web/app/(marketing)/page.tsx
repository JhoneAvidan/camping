import Link from "next/link";
import { Backpack, CheckSquare, MapPin, Sparkles, Tent } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col">
      <SiteHeader />
      <Hero />
      <Features />
      <SiteFooter />
    </main>
  );
}

function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-6 py-5 text-white sm:px-10">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <Tent className="size-5" aria-hidden />
        <span className="text-lg tracking-tight">מחנאות</span>
      </Link>
      <Link
        href="/login"
        className="text-sm font-medium text-white/85 transition-colors hover:text-white"
      >
        התחברות
      </Link>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative isolate flex min-h-[88vh] items-center overflow-hidden text-white">
      <HeroBackground />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-32 text-center sm:px-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/90 backdrop-blur-md">
          <Sparkles className="size-3.5" aria-hidden />
          תכנון משותף לטיולי מחנאות
        </span>
        <h1 className="mt-8 text-balance text-5xl font-bold leading-tight tracking-tight sm:text-7xl">
          הטיול הבא מתחיל
          <br />
          <span className="bg-gradient-to-l from-amber-200 via-orange-200 to-rose-200 bg-clip-text text-transparent">
            סביב המדורה.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-balance text-lg leading-relaxed text-white/80 sm:text-xl">
          אתם מביאים את החברים, אנחנו מארגנים את הציוד, המטלות והיעדים.
          הכול במקום אחד — בלי קבוצות וואטסאפ אינסופיות.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-white px-8 text-base text-zinc-900 shadow-lg hover:bg-white/90"
          >
            <Link href="/login">התחילו לתכנן טיול</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="ghost"
            className="h-12 rounded-full px-8 text-base text-white hover:bg-white/10 hover:text-white"
          >
            <Link href="#features">איך זה עובד</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10" aria-hidden>
      {/* Twilight sky → warm horizon */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1733] via-[#3b2256] to-[#c25a3c]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#1a1226] to-transparent" />

      {/* Stars */}
      <svg
        className="absolute inset-0 h-full w-full opacity-80 mix-blend-screen"
        preserveAspectRatio="none"
      >
        <defs>
          <radialGradient id="star" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={`${s.x}%`}
            cy={`${s.y}%`}
            r={s.r}
            fill="url(#star)"
          />
        ))}
      </svg>

      {/* Moon */}
      <div className="absolute right-[12%] top-[14%] size-24 rounded-full bg-amber-50/90 shadow-[0_0_80px_30px_rgba(255,240,200,0.35)]" />

      {/* Far mountains */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[55%] w-full"
        viewBox="0 0 1440 600"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0 380 L160 240 L320 320 L480 200 L640 300 L800 220 L960 320 L1120 240 L1280 300 L1440 220 L1440 600 L0 600 Z"
          fill="#1f1638"
          opacity="0.9"
        />
        <path
          d="M0 460 L120 340 L260 420 L420 320 L580 400 L760 320 L920 420 L1080 340 L1240 420 L1440 340 L1440 600 L0 600 Z"
          fill="#15101f"
          opacity="0.95"
        />
        <path
          d="M0 520 L100 460 L220 500 L360 440 L520 500 L680 450 L840 510 L1020 460 L1180 510 L1320 470 L1440 510 L1440 600 L0 600 Z"
          fill="#0a0813"
        />
      </svg>

      {/* Trees in foreground */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[22%] w-full"
        viewBox="0 0 1440 200"
        preserveAspectRatio="none"
        aria-hidden
      >
        {[60, 180, 320, 460, 620, 780, 940, 1100, 1260, 1380].map((x, i) => (
          <polygon
            key={i}
            points={`${x - 18},200 ${x},${130 - (i % 3) * 12} ${x + 18},200`}
            fill="#050410"
          />
        ))}
      </svg>

      {/* Campfire glow */}
      <div className="absolute bottom-[8%] left-1/2 size-40 -translate-x-1/2 rounded-full bg-orange-400/40 blur-3xl" />
      <div className="absolute bottom-[6%] left-1/2 size-20 -translate-x-1/2 rounded-full bg-amber-200/60 blur-xl" />
    </div>
  );
}

const STARS = [
  { x: 8, y: 12, r: 1.2 },
  { x: 18, y: 20, r: 0.8 },
  { x: 24, y: 8, r: 1.4 },
  { x: 32, y: 28, r: 1 },
  { x: 41, y: 14, r: 0.9 },
  { x: 48, y: 22, r: 1.3 },
  { x: 56, y: 10, r: 1 },
  { x: 64, y: 26, r: 0.8 },
  { x: 72, y: 16, r: 1.2 },
  { x: 80, y: 24, r: 1 },
  { x: 88, y: 12, r: 1.4 },
  { x: 14, y: 32, r: 0.7 },
  { x: 36, y: 6, r: 1.1 },
  { x: 60, y: 32, r: 0.9 },
  { x: 84, y: 30, r: 1.1 },
  { x: 4, y: 24, r: 0.8 },
  { x: 28, y: 18, r: 0.7 },
  { x: 52, y: 4, r: 1.3 },
  { x: 68, y: 6, r: 0.9 },
  { x: 92, y: 18, r: 1.2 },
];

function Features() {
  const items = [
    {
      icon: Backpack,
      title: "ציוד משותף",
      body: "מי מביא מה? רשימה אחת חיה, בלי כפילויות ובלי שוכחים את הקומקום.",
    },
    {
      icon: CheckSquare,
      title: "מטלות לקבוצה",
      body: "חלוקת בישול, נהיגה, פירוק והקמה — כל אחד יודע מה האחריות שלו.",
    },
    {
      icon: MapPin,
      title: "יעדים ומסלולים",
      body: "שומרים יעדים אהובים, משתפים מסלולים ומקבלים החלטות יחד.",
    },
  ];

  return (
    <section
      id="features"
      className="border-t border-border bg-background px-6 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          מה תקבלו
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          הכול לטיול אחד מסודר.
        </h2>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          במקום הודעות מפוזרות בקבוצה, מקום אחד שכולם יכולים לראות ולעדכן.
        </p>

        <div className="mt-14 grid gap-6 text-right sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <div className="inline-flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">
                {title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background px-6 py-10 text-center text-sm text-muted-foreground">
      <p>
        מחנאות · נבנה באהבה ב{" "}
        <span dir="ltr" className="font-mono text-xs">
          Next.js · React · Tailwind
        </span>
      </p>
    </footer>
  );
}
