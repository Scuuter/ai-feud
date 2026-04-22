import { clsx } from "clsx";

/**
 * Design-system preview of the game `<Tile />`.
 *
 * Layout hierarchy (revealed state):
 *   ┌───────────────────────────────────┐
 *   │ [#1]                       32 PTS │  ← top bar: rank · BIG score
 *   │                                   │
 *   │        A ROLLED-UP NEWSPAPER      │  ← answer text (centered)
 *   │                                   │
 *   │  — Tired Dad Wizard: "…"          │  ← optional flavor footer
 *   └───────────────────────────────────┘
 *
 * Rationale: the score is the central element of the game — we want it to
 * read at a glance from across the room. It lives in a dedicated top rail,
 * rendered in the blocks font at ~9cqi, so it scales with tile size.
 *
 * Sizing contract: the tile fills its grid cell. Parent is responsible for
 * geometry via `grid-cols` + `grid-rows`. No intrinsic aspect-ratio.
 *
 * Optional `className` lets the parent apply `col-span-2` for the trailing
 * wide tile on odd-count boards (3 / 5 / 7).
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
  return (
    <article
      className={clsx(
        "relative flex h-full min-h-0 w-full min-w-0 flex-col border-4 border-ink",
        isRevealed
          ? "bg-paper text-ink shadow-[4px_4px_0px_var(--color-tile-shadow)]"
          : "bg-ink text-[var(--color-tile-shadow)]",
        className,
      )}
      style={{ containerType: "inline-size" }}
      aria-label={
        isRevealed
          ? `Answer ${rank ?? ""}: ${text} — ${score} points`
          : `Unrevealed answer ${rank ?? ""}`
      }
    >
      {isRevealed ? (
        <>
          {/* Top rail: rank badge + big score */}
          <header
            className={clsx(
              "flex items-center justify-between gap-2 border-b-2 border-ink/20 px-2.5",
            )}
            style={{ paddingTop: "0.35rem", paddingBottom: "0.35rem" }}
          >
            {typeof rank === "number" ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center bg-ink px-1 font-blocks text-[11px] leading-none text-paper">
                {rank}
              </span>
            ) : (
              <span aria-hidden="true" />
            )}
            {typeof score === "number" ? (
              <span className="flex items-baseline gap-1 tabular-nums">
                <span
                  className="font-blocks leading-none text-ink"
                  style={{ fontSize: "clamp(1.25rem, 8cqi, 2.25rem)" }}
                >
                  {score}
                </span>
                <span className="font-base text-[10px] font-bold uppercase tracking-widest text-ink/60">
                  PTS
                </span>
              </span>
            ) : null}
          </header>

          {/* Answer body */}
          <div className="flex flex-1 min-h-0 flex-col items-center justify-center gap-1 px-3 py-1.5 text-center">
            <p
              className="font-base font-bold leading-tight text-balance uppercase"
              style={{ fontSize: "clamp(0.8rem, 4.2cqi, 1.25rem)" }}
            >
              {text}
            </p>
            {flavorQuote ? (
              <p
                className="font-base italic leading-snug text-pretty opacity-75"
                style={{ fontSize: "clamp(0.6rem, 2.6cqi, 0.8rem)" }}
              >
                <span className="not-italic font-bold">
                  &mdash; {flavorQuote.personaName}:
                </span>{" "}
                {`"${flavorQuote.text}"`}
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <>
          {/* Unrevealed: rank chip top-left, huge "?" centered */}
          {typeof rank === "number" ? (
            <span className="absolute left-2 top-2 inline-flex h-5 min-w-5 items-center justify-center bg-[var(--color-tile-shadow)] px-1 font-blocks text-[11px] leading-none text-ink">
              {rank}
            </span>
          ) : null}
          <div className="flex flex-1 items-center justify-center">
            <span
              className="font-blocks leading-none"
              style={{ fontSize: "clamp(2.5rem, 18cqi, 5rem)" }}
              aria-hidden="true"
            >
              ?
            </span>
          </div>
        </>
      )}
    </article>
  );
}
