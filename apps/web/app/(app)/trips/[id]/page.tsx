import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type TripRole = Database["public"]["Enums"]["trip_role"];

const HE_LONG = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const HE_SHORT = new Intl.DateTimeFormat("he-IL", {
  day: "numeric",
  month: "long",
});

const ROLE_LABEL: Record<TripRole, string> = {
  owner: "בעלים",
  editor: "עורך",
  viewer: "צופה",
};

function formatDateRange(starts: string | null, ends: string | null): string {
  if (!starts && !ends) return "תאריכים לא נקבעו";
  if (starts && !ends) {
    return `מתחילים ב-${HE_LONG.format(new Date(starts))}`;
  }
  if (!starts && ends) {
    return `מסתיימים ב-${HE_LONG.format(new Date(ends))}`;
  }
  const a = new Date(starts!);
  const b = new Date(ends!);
  if (a.getFullYear() === b.getFullYear()) {
    return `${HE_SHORT.format(a)} – ${HE_LONG.format(b)}`;
  }
  return `${HE_LONG.format(a)} – ${HE_LONG.format(b)}`;
}

type TripPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: TripPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select("name")
    .eq("id", id)
    .maybeSingle();
  return { title: data?.name ?? "טיול" };
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  // Single round-trip: trip + members + member profiles. RLS hides the trip
  // entirely if the user isn't a member, so a missing row == 404.
  const { data: trip, error } = await supabase
    .from("trips")
    .select(
      `
        id,
        name,
        starts_on,
        ends_on,
        notes,
        created_by,
        archived_at,
        trip_members (
          role,
          joined_at,
          profile_id,
          profiles ( id, display_name )
        )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !trip) notFound();

  const members = trip.trip_members ?? [];
  const myMembership = members.find((m) => m.profile_id === user.id);
  if (!myMembership) notFound();

  const myRole = myMembership.role;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href="/trips"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← חזרה לכל הטיולים
        </Link>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{trip.name}</h1>
            <p className="text-muted-foreground">
              {formatDateRange(trip.starts_on, trip.ends_on)}
            </p>
          </div>
          <span className="inline-flex h-7 items-center rounded-full border border-border bg-muted px-3 text-xs font-medium text-foreground">
            התפקיד שלך: {ROLE_LABEL[myRole]}
          </span>
        </div>
      </div>

      {trip.notes ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">הערות</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {trip.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">משתתפים ({members.length})</CardTitle>
          <CardDescription>
            כולם רואים את הטיול. תפקידים שולטים על מי יכול לערוך.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y divide-border">
            {members.map((m) => {
              const name = m.profiles?.display_name ?? "משתתף";
              return (
                <li
                  key={m.profile_id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABEL[m.role]}
                  </span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ציוד</CardTitle>
            <CardDescription>בקרוב — Phase 3</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" size="sm">
              הוסיפו פריטי ציוד
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">קטגוריות</CardTitle>
            <CardDescription>בקרוב — Phase 3</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" size="sm">
              ניהול קטגוריות
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
