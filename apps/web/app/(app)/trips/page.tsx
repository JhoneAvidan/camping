import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "הטיולים שלי" };

const HE_LONG = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const HE_SHORT = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "long",
});

function formatDateRange(starts: string | null, ends: string | null): string {
  if (!starts && !ends) return "תאריכים לא נקבעו";
  if (starts && !ends) {
    return `מתחילים ב-${HE_LONG.format(new Date(starts))}`;
  }
  if (!starts && ends) {
    return `מסתיימים ב-${HE_LONG.format(new Date(ends))}`;
  }
  // both present
  const a = new Date(starts!);
  const b = new Date(ends!);
  if (a.getFullYear() === b.getFullYear()) {
    return `${HE_SHORT.format(a)} – ${HE_LONG.format(b)}`;
  }
  return `${HE_LONG.format(a)} – ${HE_LONG.format(b)}`;
}

export default async function TripsPage() {
  const supabase = await createClient();

  // RLS (is_trip_member) restricts the rows to trips the current user belongs
  // to, so a single SELECT is sufficient — no extra membership filter needed.
  const { data: trips, error } = await supabase
    .from("trips")
    .select("id, name, starts_on, ends_on, notes, archived_at")
    .is("archived_at", null)
    .order("starts_on", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">הטיולים שלי</h1>
          <p className="text-muted-foreground">
            כאן כל הטיולים שאתם מתכננים או מוזמנים אליהם.
          </p>
        </div>
        <Button asChild>
          <Link href="/trips/new">טיול חדש</Link>
        </Button>
      </div>

      {error ? (
        <Card>
          <CardHeader>
            <CardTitle>משהו השתבש</CardTitle>
            <CardDescription>
              לא הצלחנו לטעון את רשימת הטיולים. רעננו את הדף בעוד רגע.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : !trips || trips.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>עוד אין לכם טיולים</CardTitle>
            <CardDescription>
              פתחו טיול חדש כדי להתחיל לתכנן יחד עם החברים — ציוד, מטלות, יעדים
              ומוזמנים.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/trips/new">טיול חדש</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {trips.map((trip) => (
            <li key={trip.id}>
              <Link
                href={`/trips/${trip.id}`}
                className="block rounded-xl outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card className="h-full transition-colors hover:bg-accent/40">
                  <CardHeader>
                    <CardTitle className="text-xl">{trip.name}</CardTitle>
                    <CardDescription>
                      {formatDateRange(trip.starts_on, trip.ends_on)}
                    </CardDescription>
                  </CardHeader>
                  {trip.notes ? (
                    <CardContent>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {trip.notes}
                      </p>
                    </CardContent>
                  ) : null}
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
