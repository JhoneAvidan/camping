"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  createCategory,
  type CategoryActionState,
} from "@/lib/categories/actions";

const INITIAL_STATE: CategoryActionState = {
  status: "idle",
  message: "",
};

type AddCategoryFormProps = {
  tripId: string;
};

export function AddCategoryForm({ tripId }: AddCategoryFormProps) {
  const [state, formAction, pending] = useActionState(
    createCategory,
    INITIAL_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  const nameError = state.fieldErrors?.name;

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="trip_id" value={tripId} />

      <div className="flex flex-1 min-w-[200px] flex-col gap-1">
        <label
          htmlFor="category-name"
          className="text-xs font-medium text-muted-foreground"
        >
          שם קטגוריה
        </label>
        <input
          id="category-name"
          name="name"
          type="text"
          required
          maxLength={80}
          aria-invalid={Boolean(nameError) || undefined}
          aria-describedby={nameError ? "category-name-error" : undefined}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="למשל: מטבח"
          disabled={pending}
        />
        {nameError ? (
          <p
            id="category-name-error"
            role="alert"
            className="text-xs text-destructive"
          >
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="category-kind"
          className="text-xs font-medium text-muted-foreground"
        >
          סוג
        </label>
        <select
          id="category-kind"
          name="kind"
          defaultValue="gear"
          disabled={pending}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="gear">ציוד</option>
          <option value="food">אוכל</option>
          <option value="task">משימות</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "מוסיף…" : "הוסף קטגוריה"}
      </button>

      {state.status === "error" && !nameError ? (
        <p role="alert" className="w-full text-xs text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
