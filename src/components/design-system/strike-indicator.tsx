type StrikeIndicatorProps =
  | { mode: "miss" }
  | { mode: "wildcard"; personaName: string; flavorQuote: string };

/**
 * Static preview of the <StrikeIndicator />. Rendered as an absolute overlay
 * inside the parent's position:relative container. The real gameplay version
 * will wrap this in a Framer Motion presence wrapper with the spring configs
 * in `tokens.ts`.
 *
 * Wildcard copy hierarchy (top → bottom):
 *   1. announcer label — "YOU ANSWERED EXACTLY LIKE" (small, uppercase, wide track)
 *   2. persona name — blocks font, hero size
 *   3. persona quote — italic body, balanced
 *
 * See `docs/design-system.md` §4.2.
 */
export function StrikeIndicator(props: StrikeIndicatorProps) {
  if (props.mode === "miss") {
    return (
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        style={{
          backgroundColor:
            "color-mix(in srgb, var(--color-miss-accent) 18%, transparent)",
        }}
        role="alert"
        aria-label="Strike"
      >
        <span
          className="font-blocks leading-none"
          style={{
            fontSize: "clamp(6rem, 28cqi, 12rem)",
            color: "var(--color-miss-accent)",
            WebkitTextStroke: "6px var(--color-ink)",
            textShadow: "8px 8px 0px var(--color-ink)",
          }}
          aria-hidden="true"
        >
          X
        </span>
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center p-6"
      role="alert"
      aria-label={`Wildcard: ${props.personaName}`}
    >
      <div
        className="max-w-md border-4 border-ink p-5 shadow-[8px_8px_0px_var(--color-ink)]"
        style={{ backgroundColor: "var(--color-wildcard-accent)" }}
      >
        <p className="font-base text-[11px] font-bold uppercase leading-none tracking-[0.22em] text-ink/75">
          You answered exactly like
        </p>
        <p className="mt-2 font-blocks text-[var(--text-blocks-md)] uppercase leading-none text-ink">
          {props.personaName}
        </p>
        <p className="mt-3 font-base text-[var(--text-base-md)] font-bold leading-snug text-balance text-ink">
          {`"${props.flavorQuote}"`}
        </p>
      </div>
    </div>
  );
}
