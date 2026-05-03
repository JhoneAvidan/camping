"use client";

import { useActionState, useEffect, useRef } from "react";

import { createItem, type ItemActionState } from "@/lib/items/actions";

const INITIAL_STATE: ItemActionState = {
  status: "idle",
  message: "",
};

type AddItemFormProps = {
  tripId: string;
  categoryId: string | null;
  defaultKind: "gear" | "food" | "task";
};

export function AddItemForm({
  tripId,
  categoryId,
  defaultKind,
}: AddItemFormProps) {
  const [state, formAction, pending] = useActionState(
    createItem,
    INITIAL_STATE,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  const nameError = state.fieldErrors?.name;
  const qtyError = state.fieldErrors?.quantity;

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      className="flex flex-wrap items-end gap-2 px-4 py-3"
    >
      <input type="hidden" name="trip_id" value={tripId} />
      <input
        type="hidden"
        name="category_id"
        value={categoryId ?? ""}
      />
      <input type="hidden" name="kind" value={defaultKind} />

      <div className="flex min-w-[160px] flex-1 flex-col gap-1">
        <label
          htmlFor={`item-name-${categoryId ?? "uncat"}`}
          className="sr-only"
        >
          שם פריט
        </label>
        <input
          id={`item-name-${categoryId ?? "uncat"}`}
          name="name"
          type="text"
          required
          maxLength={120}
          placeholder="פריט חדש"
          aria-invalid={Boolean(nameError) || undefined}
          disabled={pending}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {nameError ? (
          <p role="alert" className="text-xs text-destructive">
            {nameError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`item-qty-${categoryId ?? "uncat"}`}
          className="sr-only"
        >
          כמות
        </label>
        <input
          id={`item-qty-${categoryId ?? "uncat"}`}
          name="quantity"
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          defaultValue={1}
          dir="ltr"
          aria-invalid={Boolean(qtyError) || undefined}
          disabled={pending}
          className="flex h-9 w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        {qtyError ? (
          <p role="alert" className="text-xs text-destructive">
            {qtyError}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor={`item-unit-${categoryId ?? "uncat"}`}
          className="sr-only"
        >
          יחידה
        </label>
        <input
          id={`item-unit-${categoryId ?? "uncat"}`}
          name="unit"
          type="text"
          maxLength={32}
          placeholder="יח'"
          disabled={pending}
          className="flex h-9 w-20 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {pending ? "מוסיף…" : "+ הוסף פריט"}
      </button>

      {state.status === "error" && !nameError && !qtyError ? (
        <p role="alert" className="w-full text-xs text-destructive">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
