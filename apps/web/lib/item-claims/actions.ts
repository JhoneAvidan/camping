"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { createClient } from "@/lib/supabase/server";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function requireUser(tripId: string): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    redirect(`/login?next=/trips/${tripId}`);
  }
  return userId;
}

export async function claimItem(formData: FormData): Promise<void> {
  const itemId = String(formData.get("item_id") ?? "").trim();
  const tripId = String(formData.get("trip_id") ?? "").trim();
  if (!isUuid(itemId) || !isUuid(tripId)) return;

  const userId = await requireUser(tripId);
  const supabase = await createClient();

  // Composite PK on (item_id, profile_id) — duplicate insert errors silently swallowed.
  await supabase.from("item_claims").insert({
    item_id: itemId,
    profile_id: userId,
    state: "claimed",
    packed_at: null,
  });

  revalidatePath(`/trips/${tripId}`);
}

export async function packItem(formData: FormData): Promise<void> {
  const itemId = String(formData.get("item_id") ?? "").trim();
  const tripId = String(formData.get("trip_id") ?? "").trim();
  if (!isUuid(itemId) || !isUuid(tripId)) return;

  const userId = await requireUser(tripId);
  const supabase = await createClient();

  // CHECK constraint requires state and packed_at to align — set both atomically.
  await supabase
    .from("item_claims")
    .update({ state: "packed", packed_at: new Date().toISOString() })
    .eq("item_id", itemId)
    .eq("profile_id", userId);

  revalidatePath(`/trips/${tripId}`);
}

export async function unpackItem(formData: FormData): Promise<void> {
  const itemId = String(formData.get("item_id") ?? "").trim();
  const tripId = String(formData.get("trip_id") ?? "").trim();
  if (!isUuid(itemId) || !isUuid(tripId)) return;

  const userId = await requireUser(tripId);
  const supabase = await createClient();

  await supabase
    .from("item_claims")
    .update({ state: "claimed", packed_at: null })
    .eq("item_id", itemId)
    .eq("profile_id", userId);

  revalidatePath(`/trips/${tripId}`);
}

export async function releaseClaim(formData: FormData): Promise<void> {
  const itemId = String(formData.get("item_id") ?? "").trim();
  const tripId = String(formData.get("trip_id") ?? "").trim();
  if (!isUuid(itemId) || !isUuid(tripId)) return;

  const userId = await requireUser(tripId);
  const supabase = await createClient();

  await supabase
    .from("item_claims")
    .delete()
    .eq("item_id", itemId)
    .eq("profile_id", userId);

  revalidatePath(`/trips/${tripId}`);
}
