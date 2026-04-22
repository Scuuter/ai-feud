type NewsTickerProps = {
  /** Headlines to loop through. All UPPERCASE at render time. */
  phrases: string[];
  /** Label inside the white LIVE badge. Defaults to "LIVE". */
  liveLabel?: string;
};

/**
 * A bottom-of-screen broadcast news ticker. Pure CSS marquee (see
 * `.animate-marquee` in globals.css). The content strip is duplicated so
 * translating it by -50% produces a seamless infinite loop.
 *
 * Colors: the strip is `bg-alert-red` (immutable — the news ticker is Vice
 * City's voice), but the LIVE badge dot inherits the demographic's
 * `--color-channel-dot` to tint the channel identity.
 */
export function NewsTicker({ phrases, liveLabel = "LIVE" }: NewsTickerProps) {
  const separator = "   ◆   ";
  const content = phrases.map((p) => p.toUpperCase()).join(separator);

  return (
    <div
      className="flex h-10 w-full items-stretch bg-alert-red text-paper border-t-4 border-ink"
      role="marquee"
      aria-label="Broadcast ticker"
    >
      {/* LIVE badge */}
      <div className="flex items-center gap-2 bg-paper px-3 border-r-4 border-ink">
        <span
          aria-hidden="true"
          className="animate-live-pulse inline-block h-3 w-3 rounded-full"
          style={{ backgroundColor: "var(--color-channel-dot)" }}
        />
        <span className="font-blocks text-[var(--text-base-md)] leading-none text-ink">
          {liveLabel}
        </span>
      </div>

      {/* Scrolling strip */}
      <div className="relative flex-1 overflow-hidden">
        <div className="animate-marquee flex w-max whitespace-nowrap will-change-transform">
          <span className="px-6 font-base text-[var(--text-base-sm)] font-bold uppercase tracking-wider leading-10">
            {content}
            {separator}
          </span>
          <span
            className="px-6 font-base text-[var(--text-base-sm)] font-bold uppercase tracking-wider leading-10"
            aria-hidden="true"
          >
            {content}
            {separator}
          </span>
        </div>
      </div>
    </div>
  );
}
