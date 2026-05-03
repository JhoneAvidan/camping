"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { createClient } from "@/lib/supabase/server";

export type ItemActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: { name?: string; quantity?: string };
};

const NAME_MIN = 1;
const NAME_MAX = 120;
const UNIT_MAX = 32;
const NOTES_MAX = 1000;
const KINDS = ["gear", "food", "task"] as const;
type ItemKind = (typeof KINDS)[number];

const GENERIC_ERROR =
  "לא הצלחנו לבצע את הפעולה. נסו שוב בעוד רגע.";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function parseKind(raw: string): ItemKind | null {
  if ((KINDS as readonly string[]).includes(raw)) {
    return raw as ItemKind;
  }
  return null;
}

function parseQuantity(raw: string): number | "invalid" {
  if (!raw) return 1;
  if (!/^\d+$/.test(raw)) return "invalid";
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 100000) return "invalid";
  return n;
}

export async function createItem(
  _prevState: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  const tripId = String(formData.get("trip_id") ?? "").trim();
  const categoryIdRaw = String(formData.get("category_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "gear").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const unitRaw = String(formData.get("unit") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();

  if (!isUuid(tripId)) {
    return { status: "error", message: GENERIC_ERROR };
  }

  const categoryId =
    categoryIdRaw === "" ? null : isUuid(categoryIdRaw) ? categoryIdRaw : "bad";
  if (categoryId === "bad") {
    return { status: "error", message: GENERIC_ERROR };
  }

  const fieldErrors: { name?: string; quantity?: string } = {};

  if (name.length < NAME_MIN) {
    fieldErrors.name = "צריך לתת לפריט שם.";
  } else if (name.length > NAME_MAX) {
    fieldErrors.name = `שם הפריט ארוך מדי (עד ${NAME_MAX} תווים).`;
  }

  const quantity = parseQuantity(quantityRaw);
  if (quantity === "invalid") {
    fieldErrors.quantity = "כמות חייבת להיות מספר חיובי.";
  }

  if (unitRaw.length > UNIT_MAX) {
    return { status: "error", message: GENERIC_ERROR };
  }
  if (notesRaw.length > NOTES_MAX) {
    return { status: "error", message: GENERIC_ERROR };
  }

  const kind = parseKind(kindRaw);
  if (!kind) {
    return { status: "error", message: GENERIC_ERROR };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "יש לתקן את השדות המסומנים.",
      fieldErrors,
    };
  }

  const { userId } = await auth();
  if (!userId) {
    redirect(`/login?next=/trips/${tripId}`);
  }

  const supabase = await createClient();

  // sort_order: next within (trip_id, category_id) bucket.
  let maxQuery = supabase
    .from("items")
    .select("sort_order")
    .eq("trip_id", tripId);
  if (categoryId === null) {
    maxQuery = maxQuery.is("category_id", null);
  } else {
    maxQuery = maxQuery.eq("category_id", categoryId);
  }
  const { data: maxRow } = await maxQuery
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder =
    maxRow && typeof maxRow.sort_order === "number"
      ? maxRow.sort_order + 1
      : 0;

  const { error: insertError } = await supabase.from("items").insert({
    trip_id: tripId,
    category_id: categoryId,
    name,
    kind,
    quantity: quantity as number,
    unit: unitRaw || null,
    notes: notesRaw || null,
    created_by: userId,
    sort_order: nextSortOrder,
  });

  if (insertError) {
    return { status: "error", message: GENERIC_ERROR };
  }

  revalidatePath(`/trips/${tripId}`);
  return { status: "success", message: "" };
}

export async function updateItem(
  _prevState: ItemActionState,
  formData: FormData,
): Promise<ItemActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const tripId = String(formData.get("trip_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const quantityRaw = String(formData.get("quantity") ?? "").trim();
  const unitRaw = String(formData.get("unit") ?? "").trim();
  const notesRaw = String(formData.get("notes") ?? "").trim();

  if (!isUuid(id) || !isUuid(tripId)) {
    return { status: "error", message: GENERIC_ERROR };
  }

  const fieldErrors: { name?: string; quantity?: string } = {};

  if (name.length < NAME_MIN) {
    fieldErrors.name = "צריך לתת לפריט שם.";
  } else if (name.length > NAME_MAX) {
    fieldErrors.name = `שם הפריט ארוך מדי (עד ${NAME_MAX} תווים).`;
  }

  const quantity = parseQuantity(quantityRaw);
  if (quantity === "invalid") {
    fieldErrors.quantity = "כמות חייבת להיות מספר חיובי.";
  }

  if (unitRaw.length > UNIT_MAX || notesRaw.length > NOTES_MAX) {
    return { status: "error", message: GENERIC_ERROR };
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "יש לתקן את השדות המסומנים.",
      fieldErrors,
    };
  }

  const { userId } = await auth();
  if (!userId) {
    redirect(`/login?next=/trips/${tripId}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({
      name,
      quantity: quantity as number,
      unit: unitRaw || null,
      notes: notesRaw || null,
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: GENERIC_ERROR };
  }

  revalidatePath(`/trips/${tripId}`);
  return { status: "success", message: "" };
}

export async function deleteItem(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const tripId = String(formData.get("trip_id") ?? "").trim();

  if (!isUuid(id) || !isUuid(tripId)) {
    return;
  }

  const { userId } = await auth();
  if (!userId) {
    redirect(`/login?next=/trips/${tripId}`);
  }

  const supabase = await createClient();
  await supabase.from("items").delete().eq("id", id);

  revalidatePath(`/trips/${tripId}`);
}
