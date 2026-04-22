type NewsTickerProps = {
  /** Headlines to loop through. Rendered UPPERCASE. */
  phrases: string[];
  /** Label inside the white LIVE badge. Defaults to "LIVE". */
  liveLabel?: string;
  /** Pixels-per-second scroll speed. Duration is derived from content width
   *  so speed stays visually consistent regardless of phrase-pool length.
   *  Defaults to 80 px/s (comfortable broadcast cadence). */
  pxPerSecond?: number;
};

/**
 * Bottom-of-screen broadcast news ticker. Pure-CSS marquee (see
 * `.animate-marquee` in globals.css). The strip is duplicated so translating
 * the track by -50% produces a seamless loop.
 *
 * Seamlessness contract: both halves MUST render identically, with no padding
 * on the spans (the `◆` separator handles spacing) and a trailing separator
 * on each half so the loop point reads as "… PHRASE ◆ PHRASE …" rather than
 * "… PHRASE PHRASE …".
 *
 * Speed contract: we approximate the rendered strip width from character
 * count (~10.5 px/char at the current font) and set `--ticker-duration` so
 * the track traverses one full strip-length in `stripWidth / pxPerSecond`
 * seconds, regardless of whether a channel has 3 phrases or 12.
 */
export function NewsTicker({
  phrases,
  liveLabel = "LIVE",
  pxPerSecond = 80,
}: NewsTickerProps) {
  const separator = "   \u25C6   "; // spaced diamond
  // Build the half-strip. Trailing separator keeps the loop seam readable.
  const stripText = phrases.map((p) => p.toUpperCase()).join(separator) + separator;

  // Approx glyph width of uppercase Space-Grotesk Bold at text-base-sm.
  // We tune to 10.5 px/char which is close enough at the preview breakpoint.
  const approxStripPx = Math.max(600, stripText.length * 10.5);
  const durationSeconds = Math.max(20, Math.round(approxStripPx / pxPerSecond));

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
        <div
          className="animate-marquee flex w-max whitespace-nowrap will-change-transform"
          style={{ ["--ticker-duration" as string]: `${durationSeconds}s` }}
        >
          {/* Two identical halves; no padding so the seam matches perfectly */}
          <span className="font-base text-[var(--text-base-sm)] font-bold uppercase tracking-wider leading-10">
            {stripText}
          </span>
          <span
            className="font-base text-[var(--text-base-sm)] font-bold uppercase tracking-wider leading-10"
            aria-hidden="true"
          >
            {stripText}
          </span>
        </div>
      </div>
    </div>
  );
}
