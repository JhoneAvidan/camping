"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { createClient } from "@/lib/supabase/server";

export type CategoryActionState = {
  status: "idle" | "error" | "success";
  message: string;
  fieldErrors?: { name?: string };
};

const NAME_MIN = 1;
const NAME_MAX = 80;
const KINDS = ["gear", "food", "task"] as const;
type CategoryKind = (typeof KINDS)[number];

const GENERIC_ERROR =
  "לא הצלחנו לבצע את הפעולה. נסו שוב בעוד רגע.";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function parseKind(raw: string): CategoryKind | null {
  if ((KINDS as readonly string[]).includes(raw)) {
    return raw as CategoryKind;
  }
  return null;
}

export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const tripId = String(formData.get("trip_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "").trim();

  if (!isUuid(tripId)) {
    return { status: "error", message: GENERIC_ERROR };
  }

  const fieldErrors: { name?: string } = {};
  if (name.length < NAME_MIN) {
    fieldErrors.name = "צריך לתת לקטגוריה שם.";
  } else if (name.length > NAME_MAX) {
    fieldErrors.name = `שם הקטגוריה ארוך מדי (עד ${NAME_MAX} תווים).`;
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

  const { data: maxRow } = await supabase
    .from("categories")
    .select("sort_order")
    .eq("trip_id", tripId)
    .eq("kind", kind)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextSortOrder =
    maxRow && typeof maxRow.sort_order === "number"
      ? maxRow.sort_order + 1
      : 0;

  const { error: insertError } = await supabase.from("categories").insert({
    trip_id: tripId,
    name,
    kind,
    sort_order: nextSortOrder,
    is_archived: false,
  });

  if (insertError) {
    return { status: "error", message: GENERIC_ERROR };
  }

  revalidatePath(`/trips/${tripId}`);
  return { status: "success", message: "" };
}

export async function renameCategory(
  _prevState: CategoryActionState,
  formData: FormData,
): Promise<CategoryActionState> {
  const id = String(formData.get("id") ?? "").trim();
  const tripId = String(formData.get("trip_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();

  if (!isUuid(id) || !isUuid(tripId)) {
    return { status: "error", message: GENERIC_ERROR };
  }

  const fieldErrors: { name?: string } = {};
  if (name.length < NAME_MIN) {
    fieldErrors.name = "צריך לתת לקטגוריה שם.";
  } else if (name.length > NAME_MAX) {
    fieldErrors.name = `שם הקטגוריה ארוך מדי (עד ${NAME_MAX} תווים).`;
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
    .from("categories")
    .update({ name })
    .eq("id", id);

  if (error) {
    return { status: "error", message: GENERIC_ERROR };
  }

  revalidatePath(`/trips/${tripId}`);
  return { status: "success", message: "" };
}

export async function archiveCategory(formData: FormData): Promise<void> {
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
  await supabase
    .from("categories")
    .update({ is_archived: true })
    .eq("id", id);

  revalidatePath(`/trips/${tripId}`);
}
