import type { HexColor } from "@/lib/design-system/tokens";

type SwatchProps = {
  /** CSS color value or custom property reference. */
  color: HexColor | `var(--${string})`;
  /** Token name (e.g. "vice-pink"). Shown as title. */
  name: string;
  /** Hex value shown under the name. */
  hex: HexColor;
  /** CSS variable or Tailwind utility the token is exposed as. */
  token: string;
  /** Optional description, one line. */
  description?: string;
};

/**
 * Showcase-only. Renders a 160-square chip with the token metadata stacked below.
 * The chip has a thick ink border and a 4px hard drop-shadow so it reads as "UI",
 * not a design-tool swatch.
 */
export function Swatch({ color, name, hex, token, description }: SwatchProps) {
  return (
    <figure className="flex flex-col gap-2">
      <div
        className="aspect-square w-full border-4 border-ink shadow-[4px_4px_0px_var(--color-ink)]"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <figcaption className="flex flex-col gap-0.5">
        <span className="font-blocks text-[var(--text-base-md)] leading-none tracking-wider uppercase">
          {name}
        </span>
        <span className="font-base text-[var(--text-base-xs)] font-mono uppercase opacity-70">
          {hex}
        </span>
        <span className="font-base text-[var(--text-base-xs)] opacity-60">
          {token}
        </span>
        {description ? (
          <span className="font-base text-[var(--text-base-xs)] opacity-80 pt-1 leading-snug">
            {description}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
