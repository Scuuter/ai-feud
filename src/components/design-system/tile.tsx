import { clsx } from "clsx";

/**
 * Design-system preview of the game `<Tile />`.
 *
 * This is a **static** preview — no Framer Motion, no 3D flip. The animated
 * gameplay tile will live under `src/components/game/` once the core UI epic
 * begins. Both versions MUST share the same token references (never hardcode
 * `#00FFFF` — always use `var(--color-tile-shadow)`).
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

export function Tile({ rank, text, score, isRevealed, flavorQuote }: TileProps) {
  return (
    <article
      className={clsx(
        "relative flex aspect-[16/9] w-full border-4 border-ink",
        isRevealed
          ? "bg-paper text-ink shadow-[4px_4px_0px_var(--color-tile-shadow)]"
          : "bg-ink text-[var(--color-tile-shadow)]",
      )}
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
            "absolute left-2 top-2 inline-flex h-6 w-6 items-center justify-center font-blocks text-[var(--text-base-xs)] leading-none",
            isRevealed ? "bg-ink text-paper" : "bg-[var(--color-tile-shadow)] text-ink",
          )}
        >
          {rank}
        </span>
      ) : null}

      {isRevealed ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-3 text-center">
          <p className="font-base text-[var(--text-base-md)] font-bold leading-tight text-balance uppercase">
            {text}
          </p>
          {flavorQuote ? (
            <p className="mt-2 font-base text-[var(--text-base-sm)] italic leading-snug text-pretty opacity-80">
              <span className="not-italic font-bold">— {flavorQuote.personaName}:</span>{" "}
              {`"${flavorQuote.text}"`}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <span
            className="font-blocks leading-none"
            style={{ fontSize: "clamp(3rem, 12cqi, 6rem)" }}
            aria-hidden="true"
          >
            ?
          </span>
        </div>
      )}

      {/* Score pill (bottom-right, revealed only) */}
      {isRevealed && typeof score === "number" ? (
        <span className="absolute bottom-2 right-2 bg-ink px-2 py-0.5 font-blocks text-[var(--text-base-sm)] leading-none text-paper">
          {score}
        </span>
      ) : null}
    </article>
  );
}
