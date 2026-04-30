"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type CreateTripState = {
  status: "idle" | "error";
  message: string;
  fieldErrors?: { name?: string; dates?: string };
  values?: { name?: string; starts_on?: string; ends_on?: string; notes?: string };
};

const NAME_MIN = 1;
const NAME_MAX = 120;
const NOTES_MAX = 4000;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function normalizeOptionalDate(raw: string): string | null | "invalid" {
  if (!raw) return null;
  if (!ISO_DATE.test(raw)) return "invalid";
  // Date.parse on YYYY-MM-DD treats it as UTC midnight which is fine for ordering.
  const t = Date.parse(raw);
  if (Number.isNaN(t)) return "invalid";
  return raw;
}

export async function createTrip(
  _prevState: CreateTripState,
  formData: FormData,
): Promise<CreateTripState> {
  const name = String(formData.get("name") ?? "").trim();
  const startsRaw = String(formData.get("starts_on") ?? "").trim();
  const endsRaw = String(formData.get("ends_on") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();

  const values = {
    name,
    starts_on: startsRaw,
    ends_on: endsRaw,
    notes: notesRaw,
  };

  const fieldErrors: { name?: string; dates?: string } = {};

  if (name.length < NAME_MIN) {
    fieldErrors.name = "צריך לתת לטיול שם.";
  } else if (name.length > NAME_MAX) {
    fieldErrors.name = `שם הטיול ארוך מדי (עד ${NAME_MAX} תווים).`;
  }

  const starts = normalizeOptionalDate(startsRaw);
  const ends = normalizeOptionalDate(endsRaw);
  if (starts === "invalid" || ends === "invalid") {
    fieldErrors.dates = "תאריך לא תקין. השתמשו בבורר התאריכים.";
  } else if (starts && ends && ends < starts) {
    fieldErrors.dates = "תאריך הסיום לא יכול להקדים את תאריך ההתחלה.";
  }

  if (notesRaw.length > NOTES_MAX) {
    return {
      status: "error",
      message: "ההערות ארוכות מדי.",
      fieldErrors,
      values,
    };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "יש לתקן את השדות המסומנים.",
      fieldErrors,
      values,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/trips/new");
  }

  const { data: trip, error: insertError } = await supabase
    .from("trips")
    .insert({
      name,
      starts_on: starts || null,
      ends_on: ends || null,
      notes: notesRaw || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError || !trip) {
    return {
      status: "error",
      message: "לא הצלחנו ליצור את הטיול. נסו שוב בעוד רגע.",
      values,
    };
  }

  const { error: memberError } = await supabase.from("trip_members").insert({
    trip_id: trip.id,
    profile_id: user.id,
    role: "owner",
  });

  if (memberError) {
    // Best-effort rollback: trip exists but membership failed. RLS on trips
    // SELECT relies on is_trip_member, so the orphan trip will be invisible.
    // Surface a friendly error and let the user retry.
    return {
      status: "error",
      message:
        "הטיול נוצר אבל הצירוף שלך כחבר נכשל. פנו לתמיכה אם זה קורה שוב.",
      values,
    };
  }

  revalidatePath("/trips");
  redirect(`/trips/${trip.id}`);
}
