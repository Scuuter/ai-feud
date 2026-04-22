import { clsx } from "clsx";

type ScoreCounterProps = {
  /** The player's current accumulated score (sum of revealed answer points). */
  score: number;
  /** Override label. Defaults to "YOUR SCORE". */
  label?: string;
  /** Visual weight. `compact` for the TV header strip, `hero` for end-of-round
   *  summaries. Defaults to `compact`. */
  size?: "compact" | "hero";
  /** Extra classes for positioning. */
  className?: string;
};

/**
 * The `<ScoreCounter />` is the single, always-visible readout of the
 * player's accumulated score — the central game metric. It replaces the
 * original "STRIKE 0" slot in the TV header and is designed to read at a
 * glance even when everything else on screen is shouting at you.
 *
 * Visual contract:
 *   - Black (ink) chassis with 2px paper inner border — reads like a 7-seg
 *     broadcast scoreboard bolted onto the TV.
 *   - Score digits rendered in the blocks font, tabular-nums, themed with
 *     `--color-tile-shadow` so each channel's accent glow comes through.
 *   - Hard 2px drop-shadow in the tile-shadow color for the brutalist punch.
 *   - Digits zero-padded to 3 characters so the width doesn't dance as the
 *     score grows.
 */
export function ScoreCounter({
  score,
  label = "YOUR SCORE",
  size = "compact",
  className,
}: ScoreCounterProps) {
  const safe = Math.max(0, Math.floor(score));
  const padded = String(safe).padStart(3, "0");

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 bg-ink border-2 border-paper",
        "shadow-[2px_2px_0px_var(--color-tile-shadow)]",
        size === "hero" ? "px-4 py-2" : "px-2.5 py-1",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`${label}: ${safe} points`}
    >
      <span
        className={clsx(
          "font-base font-bold uppercase tracking-widest text-paper/75",
          size === "hero" ? "text-[var(--text-base-sm)]" : "text-[10px]",
        )}
      >
        {label}:
      </span>
      <span
        className="font-blocks leading-none tabular-nums text-[var(--color-tile-shadow)]"
        style={{
          fontSize:
            size === "hero"
              ? "clamp(1.5rem, 6cqi, 2.5rem)"
              : "clamp(0.95rem, 3.2cqi, 1.35rem)",
        }}
      >
        {padded}
      </span>
    </div>
  );
}
