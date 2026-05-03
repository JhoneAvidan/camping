import { cn } from "@/lib/utils";

type InitialsAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
};

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  // Use Intl.Segmenter when available for proper grapheme handling (Hebrew + emoji safe).
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const graphemes: string[] = [];
    for (const part of seg.segment(trimmed)) {
      if (part.segment.trim()) graphemes.push(part.segment);
      if (graphemes.length === 2) break;
    }
    if (graphemes.length > 0) return graphemes.join("");
  }
  // Fallback: split on whitespace, take first letter of first two tokens.
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    return (tokens[0][0] + tokens[1][0]).slice(0, 2);
  }
  return trimmed.slice(0, 2);
}

export function InitialsAvatar({
  name,
  avatarUrl,
  size = 28,
  className,
}: InitialsAvatarProps) {
  const dimensionStyle = { width: size, height: size };
  const fontSize = Math.max(10, Math.round(size * 0.42));

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name}
        style={dimensionStyle}
        className={cn(
          "rounded-full object-cover ring-2 ring-background",
          className,
        )}
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={name}
      style={dimensionStyle}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold ring-2 ring-background select-none",
        className,
      )}
    >
      <span style={{ fontSize, lineHeight: 1 }}>{getInitials(name)}</span>
    </span>
  );
}
