import { clsx } from "clsx";

/**
 * Game `<Tile />` — horizontal row layout.
 *
 *   ┌──────┬───────────────────────────────┬───────┐
 *   │      │  A ROLLED-UP NEWSPAPER        │       │
 *   │  #1  │  — Tired Dad Wizard: "…"      │  32   │
 *   │      │                               │  PTS  │
 *   └──────┴───────────────────────────────┴───────┘
 *     rank       answer (title + quote)      score
 *
 * Visual hierarchy by size: score > rank > answer > quote. Rank cell is
 * themed (tile-rank-bg / tile-rank-ink) so each channel carries its own
 * accent color at a glance. Tile surface and ink are also themed, so the
 * whole board repaints when the channel changes.
 *
 * Sizing contract: the tile fills its grid cell. Parent is responsible for
 * geometry (grid-cols, grid-rows, optional col-span-2 for the hero tile).
 * No intrinsic aspect-ratio.
 *
 * Container queries (`cqi` on the width axis, `cqb` on the height axis) let
 * the score / rank / answer scale with the tile itself. This is what makes
 * the same component read well at 3-tile vertical (wide + short) and 8-tile
 * grid (narrow + short) sizes.
 *
 * See `docs/design-system.md` §4.1 for the contract.
 */

type FlavorQuote = { personaName: string; text: string };

type TileProps = {
  rank?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  text?: string;
  score?: number;
  isRevealed: boolean;
  flavorQuote?: FlavorQuote;
  /** Extra classes for grid-placement tweaks (e.g. `col-span-2`). */
  className?: string;
};

export function Tile({
  rank,
  text,
  score,
  isRevealed,
  flavorQuote,
  className,
}: TileProps) {
  if (!isRevealed) {
    return (
      <article
        className={clsx(
          "relative flex h-full min-h-0 w-full min-w-0 items-center justify-center border-4 border-ink",
          className,
        )}
        style={{
          backgroundColor: "var(--color-ink)",
          color: "var(--color-tile-shadow)",
          containerType: "inline-size",
        }}
        aria-label={`Unrevealed answer ${rank ?? ""}`}
      >
        {typeof rank === "number" ? (
          <span className="absolute left-2 top-2 inline-flex h-5 min-w-5 items-center justify-center bg-[var(--color-tile-shadow)] px-1 font-blocks text-[11px] leading-none text-ink">
            {rank}
          </span>
        ) : null}
        <span
          className="font-blocks leading-none"
          style={{ fontSize: "clamp(2rem, 10cqb, 5rem)" }}
          aria-hidden="true"
        >
          ?
        </span>
      </article>
    );
  }

  return (
    <article
      className={clsx(
        "relative flex h-full min-h-0 w-full min-w-0 flex-row items-stretch border-4 border-ink",
        className,
      )}
      style={{
        backgroundColor: "var(--color-tile-bg)",
        color: "var(--color-tile-ink)",
        boxShadow: "4px 4px 0px var(--color-tile-shadow)",
        containerType: "inline-size",
      }}
      aria-label={
        typeof score === "number"
          ? `Answer ${rank ?? ""}: ${text} — ${score} points`
          : `Answer: ${text}`
      }
    >
      {/* Rank cell — themed accent, vertically centered, mid-weight numeral */}
      {typeof rank === "number" ? (
        <div
          className="flex shrink-0 items-center justify-center border-r-4 border-ink px-2"
          style={{
            backgroundColor: "var(--color-tile-rank-bg)",
            color: "var(--color-tile-rank-ink)",
            minWidth: "clamp(2.5rem, 12cqi, 4.5rem)",
          }}
        >
          <span
            className="font-blocks leading-none tabular-nums"
            style={{ fontSize: "clamp(1.5rem, 7cqi, 2.25rem)" }}
          >
            {rank}
          </span>
        </div>
      ) : null}

      {/* Answer column — title on top, optional quote below, both centered */}
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-3 py-1.5 text-center">
        <p
          className="font-base font-bold uppercase leading-tight text-balance"
          style={{ fontSize: "clamp(0.8rem, 4.2cqi, 1.25rem)" }}
        >
          {text}
        </p>
        {flavorQuote ? (
          <p
            className="font-base italic leading-snug text-pretty opacity-70"
            style={{ fontSize: "clamp(0.6rem, 2.6cqi, 0.8rem)" }}
          >
            <span className="not-italic font-bold">
              &mdash; {flavorQuote.personaName}:
            </span>{" "}
            {`"${flavorQuote.text}"`}
          </p>
        ) : null}
      </div>

      {/* Score cell — vertically centered, biggest numeral on the tile */}
      {typeof score === "number" ? (
        <div className="flex shrink-0 items-center justify-center border-l-2 border-ink/20 px-3">
          <span className="flex items-baseline gap-1 tabular-nums">
            <span
              className="font-blocks leading-none"
              style={{ fontSize: "clamp(1.5rem, 9cqi, 2.75rem)" }}
            >
              {score}
            </span>
            <span className="font-base text-[10px] font-bold uppercase tracking-widest opacity-60">
              PTS
            </span>
          </span>
        </div>
      ) : null}
    </article>
  );
}
