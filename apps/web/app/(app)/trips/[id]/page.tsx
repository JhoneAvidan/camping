import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { AddCategoryForm } from "@/components/categories/add-category-form";
import { AddItemForm } from "@/components/items/add-item-form";
import { InitialsAvatar } from "@/components/items/initials-avatar";
import { ItemRow } from "@/components/items/item-row";
import type { ClaimEntry } from "@/components/items/claim-avatars";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type TripRole = Database["public"]["Enums"]["trip_role"];
type ItemKind = Database["public"]["Enums"]["item_kind"];

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

const KIND_LABEL: Record<ItemKind, string> = {
  gear: "ציוד",
  food: "אוכל",
  task: "משימות",
};

function formatDateRange(starts: string | null, ends: string | null): string {
  if (!starts && !ends) return "תאריכים לא נקבעו";
  if (starts && !ends) {
    return `מתחילים ב־${HE_LONG.format(new Date(starts))}`;
  }
  if (!starts && ends) {
    return `מסתיימים ב־${HE_LONG.format(new Date(ends))}`;
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

type ItemWithClaims = {
  id: string;
  trip_id: string;
  category_id: string | null;
  name: string;
  kind: ItemKind;
  quantity: number;
  unit: string | null;
  sort_order: number;
  item_claims: Array<{
    profile_id: string;
    state: "claimed" | "packed";
    profiles: { display_name: string; avatar_url: string | null } | null;
  }> | null;
};

function toClaimEntries(item: ItemWithClaims): ClaimEntry[] {
  const raw = item.item_claims ?? [];
  return raw
    .map((c) => ({
      profile_id: c.profile_id,
      state: c.state,
      profile: {
        display_name: c.profiles?.display_name ?? "משתתף",
        avatar_url: c.profiles?.avatar_url ?? null,
      },
    }))
    // packed first, then claimed — looks tidy in the avatar stack.
    .sort((a, b) => {
      if (a.state === b.state) return 0;
      return a.state === "packed" ? -1 : 1;
    });
}

export default async function TripPage({ params }: TripPageProps) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) notFound();

  const supabase = await createClient();

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
          profiles ( id, display_name, avatar_url )
        )
      `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !trip) notFound();

  const members = trip.trip_members ?? [];
  const myMembership = members.find((m) => m.profile_id === userId);
  if (!myMembership) notFound();
  const myRole = myMembership.role;

  const [categoriesResp, itemsResp] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, kind, sort_order")
      .eq("trip_id", id)
      .eq("is_archived", false)
      .order("kind")
      .order("sort_order"),
    supabase
      .from("items")
      .select(
        `
          id, trip_id, category_id, name, kind, quantity, unit, sort_order,
          item_claims (
            profile_id, state,
            profiles ( display_name, avatar_url )
          )
        `,
      )
      .eq("trip_id", id)
      .order("sort_order"),
  ]);

  const categories = categoriesResp.data ?? [];
  const allItems = (itemsResp.data ?? []) as unknown as ItemWithClaims[];

  const itemsByCategory = new Map<string | null, ItemWithClaims[]>();
  for (const item of allItems) {
    const key = item.category_id ?? null;
    const arr = itemsByCategory.get(key);
    if (arr) arr.push(item);
    else itemsByCategory.set(key, [item]);
  }
  const uncategorized = itemsByCategory.get(null) ?? [];

  const totalItems = allItems.length;
  const totalPacked = allItems.filter((it) =>
    (it.item_claims ?? []).some((c) => c.state === "packed"),
  ).length;
  const totalClaimed = allItems.filter((it) =>
    (it.item_claims ?? []).some(
      (c) => c.state === "claimed" || c.state === "packed",
    ),
  ).length;

  return (
    <div className="flex flex-col gap-10">
      {/* Hero */}
      <header className="flex flex-col gap-4">
        <Link
          href="/trips"
          className="inline-flex w-fit items-center text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← חזרה לכל הטיולים
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {trip.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {formatDateRange(trip.starts_on, trip.ends_on)}
            </p>
          </div>
          <span className="inline-flex h-7 w-fit items-center gap-1.5 rounded-full bg-accent px-3 text-xs font-medium text-accent-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            {ROLE_LABEL[myRole]}
          </span>
        </div>

        {totalItems > 0 ? (
          <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-2 text-sm">
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground">פריטים</dt>
              <dd className="font-semibold tabular-nums">{totalItems}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground">משובצים</dt>
              <dd className="font-semibold tabular-nums">{totalClaimed}</dd>
            </div>
            <div className="flex items-baseline gap-2">
              <dt className="text-muted-foreground">ארוזים</dt>
              <dd className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                {totalPacked}
              </dd>
            </div>
          </dl>
        ) : null}
      </header>

      {trip.notes ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            הערות
          </h2>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {trip.notes}
            </p>
          </div>
        </section>
      ) : null}

      {/* Members */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          משתתפים · {members.length}
        </h2>
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <ul className="divide-y divide-border">
            {members.map((m) => {
              const name = m.profiles?.display_name ?? "משתתף";
              return (
                <li
                  key={m.profile_id}
                  className="flex items-center justify-between gap-3 px-6 py-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <InitialsAvatar
                      name={name}
                      avatarUrl={m.profiles?.avatar_url ?? null}
                      size={32}
                    />
                    <span className="font-medium text-foreground">{name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {ROLE_LABEL[m.role]}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Packing list */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          רשימת אריזה
        </h2>

        {categories.length === 0 && uncategorized.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              עוד אין קטגוריות.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              התחילו ביצירת קטגוריה ראשונה למטה — למשל ״מטבח״ או ״ציוד שינה״.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {categories.map((category) => {
              const items = itemsByCategory.get(category.id) ?? [];
              return (
                <article
                  key={category.id}
                  className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                >
                  <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-6 py-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold tracking-tight text-foreground">
                        {category.name}
                      </h3>
                      <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                        {KIND_LABEL[category.kind]}
                      </span>
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {items.length === 0
                        ? "אין פריטים"
                        : `${items.length} פריטים`}
                    </span>
                  </header>
                  {items.length > 0 ? (
                    <ul className="flex flex-col">
                      {items.map((item) => (
                        <ItemRow
                          key={item.id}
                          item={{
                            id: item.id,
                            trip_id: item.trip_id,
                            name: item.name,
                            quantity: item.quantity,
                            unit: item.unit,
                          }}
                          claims={toClaimEntries(item)}
                          currentUserId={userId}
                        />
                      ))}
                    </ul>
                  ) : null}
                  <div className="border-t border-border bg-muted/10">
                    <AddItemForm
                      tripId={id}
                      categoryId={category.id}
                      defaultKind={category.kind}
                    />
                  </div>
                </article>
              );
            })}

            {uncategorized.length > 0 ? (
              <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/20 px-6 py-3">
                  <h3 className="text-base font-semibold tracking-tight text-muted-foreground">
                    ללא קטגוריה
                  </h3>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {uncategorized.length} פריטים
                  </span>
                </header>
                <ul className="flex flex-col">
                  {uncategorized.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={{
                        id: item.id,
                        trip_id: item.trip_id,
                        name: item.name,
                        quantity: item.quantity,
                        unit: item.unit,
                      }}
                      claims={toClaimEntries(item)}
                      currentUserId={userId}
                    />
                  ))}
                </ul>
                <div className="border-t border-border bg-muted/10">
                  <AddItemForm
                    tripId={id}
                    categoryId={null}
                    defaultKind="gear"
                  />
                </div>
              </article>
            ) : null}
          </div>
        )}

        <div className="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3">
          <AddCategoryForm tripId={id} />
        </div>
      </section>
    </div>
  );
}
