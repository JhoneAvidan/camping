import {
  claimItem,
  packItem,
  releaseClaim,
  unpackItem,
} from "@/lib/item-claims/actions";

import { ClaimAvatars, type ClaimEntry } from "./claim-avatars";

type ItemSummary = {
  id: string;
  trip_id: string;
  name: string;
  quantity: number;
  unit: string | null;
};

type ItemRowProps = {
  item: ItemSummary;
  claims: ClaimEntry[];
  currentUserId: string;
};

export function ItemRow({ item, claims, currentUserId }: ItemRowProps) {
  const myClaim = claims.find((c) => c.profile_id === currentUserId);
  const qtyLabel =
    item.quantity > 1 || item.unit
      ? `${item.quantity}${item.unit ? ` ${item.unit}` : ""}`
      : null;

  return (
    <li className="flex items-center justify-between gap-4 border-b border-border/60 px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {item.name}
          </span>
          {qtyLabel ? (
            <span
              dir="ltr"
              className="shrink-0 text-xs text-muted-foreground"
            >
              {qtyLabel}
            </span>
          ) : null}
        </div>
      </div>

      <ClaimAvatars claims={claims} />

      <div className="flex shrink-0 items-center gap-2">
        {!myClaim ? (
          <form action={claimItem}>
            <input type="hidden" name="item_id" value={item.id} />
            <input type="hidden" name="trip_id" value={item.trip_id} />
            <button
              type="submit"
              className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              הצטרפו
            </button>
          </form>
        ) : myClaim.state === "claimed" ? (
          <>
            <form action={packItem}>
              <input type="hidden" name="item_id" value={item.id} />
              <input type="hidden" name="trip_id" value={item.trip_id} />
              <button
                type="submit"
                className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ארזתי
              </button>
            </form>
            <form action={releaseClaim}>
              <input type="hidden" name="item_id" value={item.id} />
              <input type="hidden" name="trip_id" value={item.trip_id} />
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                ביטול
              </button>
            </form>
          </>
        ) : (
          <form action={unpackItem}>
            <input type="hidden" name="item_id" value={item.id} />
            <input type="hidden" name="trip_id" value={item.trip_id} />
            <button
              type="submit"
              className="rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              בטלו אריזה
            </button>
          </form>
        )}
      </div>
    </li>
  );
}
