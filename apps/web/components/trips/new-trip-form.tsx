"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTrip, type CreateTripState } from "@/lib/trips/actions";

const INITIAL_STATE: CreateTripState = { status: "idle", message: "" };

export function NewTripForm() {
  const [state, formAction, pending] = useActionState(
    createTrip,
    INITIAL_STATE,
  );

  const nameError = state.fieldErrors?.name;
  const datesError = state.fieldErrors?.dates;
  const values = state.values ?? {};

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">שם הטיול</Label>
        <Input
          id="name"
          name="name"
          type="text"
          required
          maxLength={120}
          autoComplete="off"
          defaultValue={values.name ?? ""}
          placeholder="למשל: גליל סוף שבוע"
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "name-error" : undefined}
        />
        {nameError ? (
          <p id="name-error" role="alert" className="text-sm text-destructive">
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="starts_on">תאריך התחלה</Label>
          <Input
            id="starts_on"
            name="starts_on"
            type="date"
            dir="ltr"
            defaultValue={values.starts_on ?? ""}
            aria-invalid={Boolean(datesError)}
            aria-describedby={datesError ? "dates-error" : undefined}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="ends_on">תאריך סיום</Label>
          <Input
            id="ends_on"
            name="ends_on"
            type="date"
            dir="ltr"
            defaultValue={values.ends_on ?? ""}
            aria-invalid={Boolean(datesError)}
            aria-describedby={datesError ? "dates-error" : undefined}
          />
        </div>
      </div>
      {datesError ? (
        <p id="dates-error" role="alert" className="text-sm text-destructive">
          {datesError}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="notes">הערות (לא חובה)</Label>
        <Textarea
          id="notes"
          name="notes"
          maxLength={4000}
          defaultValue={values.notes ?? ""}
          placeholder="פרטים על המסלול, המשתתפים, הציוד הקריטי…"
        />
      </div>

      {state.status === "error" && !nameError && !datesError ? (
        <p role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "יוצר…" : "צרו טיול"}
        </Button>
        <Button asChild variant="ghost">
          <Link href="/trips">ביטול</Link>
        </Button>
      </div>
    </form>
  );
}
