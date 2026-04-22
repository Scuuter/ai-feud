import { clsx } from "clsx";

/**
 * Design-system preview of the game `<Tile />`.
 *
 * Static preview — no Framer Motion, no 3D flip. The animated gameplay tile
 * will live under `src/components/game/` once the core UI epic begins. Both
 * versions MUST share the same token references (never hardcode `#00FFFF` —
 * always use `var(--color-tile-shadow)`).
 *
 * Sizing contract: the tile fills its grid cell. Parent is responsible for
 * geometry via `grid-cols` + `grid-rows`. No intrinsic aspect-ratio.
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
};

export function Tile({
  rank,
  text,
  score,
  isRevealed,
  flavorQuote,
}: TileProps) {
  return (
    <article
      className={clsx(
        "relative flex h-full min-h-0 w-full min-w-0 border-4 border-ink",
        isRevealed
          ? "bg-paper text-ink shadow-[4px_4px_0px_var(--color-tile-shadow)]"
          : "bg-ink text-[var(--color-tile-shadow)]",
      )}
      style={{ containerType: "inline-size" }}
      aria-label={
        isRevealed
          ? `Answer ${rank ?? ""}: ${text} — ${score} points`
          : `Unrevealed answer ${rank ?? ""}`
      }
    >
      {/* Rank badge (top-left) */}
      {typeof rank === "number" ? (
        <span
          className={clsx(
            "absolute left-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center font-blocks text-[11px] leading-none",
            isRevealed
              ? "bg-ink text-paper"
              : "bg-[var(--color-tile-shadow)] text-ink",
          )}
        >
          {rank}
        </span>
      ) : null}

      {isRevealed ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1 px-4 py-2 text-center">
          <p
            className="font-base font-bold leading-tight text-balance uppercase"
            style={{ fontSize: "clamp(0.85rem, 4.2cqi, 1.25rem)" }}
          >
            {text}
          </p>
          {flavorQuote ? (
            <p
              className="font-base italic leading-snug text-pretty opacity-80"
              style={{ fontSize: "clamp(0.65rem, 2.8cqi, 0.85rem)" }}
            >
              <span className="not-italic font-bold">
                — {flavorQuote.personaName}:
              </span>{" "}
              {`"${flavorQuote.text}"`}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span
            className="font-blocks leading-none"
            style={{ fontSize: "clamp(2.5rem, 18cqi, 5rem)" }}
            aria-hidden="true"
          >
            ?
          </span>
        </div>
      )}

      {/* Score pill (bottom-right, revealed only) */}
      {isRevealed && typeof score === "number" ? (
        <span
          className="absolute bottom-1.5 right-1.5 bg-ink px-1.5 py-0.5 font-blocks leading-none text-paper"
          style={{ fontSize: "clamp(0.65rem, 2.8cqi, 0.85rem)" }}
        >
          {score}
        </span>
      ) : null}
    </article>
  );
}
