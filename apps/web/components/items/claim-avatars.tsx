import { cn } from "@/lib/utils";

import { InitialsAvatar } from "./initials-avatar";

export type ClaimEntry = {
  profile_id: string;
  state: "claimed" | "packed";
  profile: {
    display_name: string;
    avatar_url: string | null;
  };
};

type ClaimAvatarsProps = {
  claims: ClaimEntry[];
  max?: number;
};

export function ClaimAvatars({ claims, max = 3 }: ClaimAvatarsProps) {
  if (claims.length === 0) return null;

  const visible = claims.slice(0, max);
  const overflow = claims.length - visible.length;

  return (
    // RTL: flex-row-reverse so the first claimer appears rightmost; negative
    // start margin overlaps the next one to its left, giving a stacked look.
    <div
      className="flex flex-row-reverse items-center"
      aria-label={`${claims.length} משתתפים`}
    >
      {visible.map((claim, idx) => (
        <div
          key={claim.profile_id}
          className={cn("relative", idx > 0 && "-ms-2")}
        >
          <InitialsAvatar
            name={claim.profile.display_name}
            avatarUrl={claim.profile.avatar_url}
            size={28}
            className={cn(
              claim.state === "packed" && "ring-emerald-500",
            )}
          />
          {claim.state === "packed" ? (
            <span
              aria-hidden
              className="absolute -bottom-0.5 -end-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white ring-2 ring-background"
            >
              ✓
            </span>
          ) : null}
        </div>
      ))}
      {overflow > 0 ? (
        <div
          className="-ms-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground ring-2 ring-background"
          aria-label={`עוד ${overflow}`}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}
