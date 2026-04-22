import type { ReactNode } from "react";
import { clsx } from "clsx";

type TVFrameProps = {
  children: ReactNode;
  /** Extra className for the outer chassis. */
  className?: string;
  /** Channel label shown on the chin display (e.g., "CH 04 · VICE CITY FEED"). */
  channelLabel?: string;
  /** Current demographic id — drives the scoped theme via [data-demographic]. */
  demographicId?: string;
  /** Slot for chassis chin buttons (rendered on the right side of the chin). */
  chinButtons?: ReactNode;
};

/**
 * The Y2K CRT TV chassis. Pure CSS/Tailwind — no image assets. Composes:
 *   - Left/right speaker grilles
 *   - An inner screen slot (passed as children, typically <TVScreen />)
 *   - A chin housing the physical buttons and the channel-label LCD strip
 *
 * The chassis is sized to fill its parent's available height (the parent is
 * expected to cap it to the viewport). Use `h-full` on a containing element.
 *
 * Theming: the `data-demographic` attribute lives HERE, not on <html>, so
 * demographic tokens are scoped to the TV only.
 */
export function TVFrame({
  children,
  className,
  channelLabel,
  demographicId = "default",
  chinButtons,
}: TVFrameProps) {
  return (
    <div
      data-demographic={demographicId}
      className={clsx(
        "chassis-gradient relative flex flex-col mx-auto w-full max-w-6xl h-full",
        "rounded-3xl border-4 border-tv-silver-dark",
        "shadow-[inset_0_2px_0_var(--color-tv-silver-light),inset_0_-4px_0_rgba(0,0,0,0.2),12px_12px_0_rgba(0,0,0,0.35)]",
        "p-3 sm:p-5",
        className,
      )}
    >
      {/* Screen + speakers row — grows to fill the chassis height */}
      <div className="flex gap-3 sm:gap-4 flex-1 min-h-0">
        <div
          aria-hidden="true"
          className="speaker-grille hidden sm:block w-5 lg:w-6 self-stretch border-2 border-tv-silver-dark"
        />
        <div className="flex-1 min-h-0 min-w-0">{children}</div>
        <div
          aria-hidden="true"
          className="speaker-grille hidden sm:block w-5 lg:w-6 self-stretch border-2 border-tv-silver-dark"
        />
      </div>

      {/* Chin: channel LCD + physical buttons */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        {channelLabel ? (
          <div className="bg-ink border-2 border-tv-silver-dark px-3 py-1 shadow-[inset_2px_2px_0px_rgba(0,0,0,0.6)]">
            <span
              className="font-blocks text-[var(--text-base-sm)] uppercase tracking-widest"
              style={{ color: "var(--color-tile-shadow)" }}
            >
              {channelLabel}
            </span>
          </div>
        ) : (
          <span aria-hidden="true" />
        )}

        <div className="flex items-center gap-1.5">{chinButtons}</div>
      </div>
    </div>
  );
}

type TVScreenProps = {
  children: ReactNode;
  className?: string;
};

/**
 * The inner playable area. Applies scanlines + vignette and a hard black
 * inner border. Fills the parent height (no forced aspect ratio) so the
 * ticker reliably lands on the bottom rail. Position: relative so overlays
 * (StrikeIndicator, ChannelMenu) can use absolute positioning.
 *
 * `containerType: inline-size` is set so children can use `cqi` sizing.
 */
export function TVScreen({ children, className }: TVScreenProps) {
  return (
    <div
      className={clsx(
        "tv-scanlines tv-vignette relative overflow-hidden",
        "bg-tv-static border-4 border-ink",
        "h-full w-full",
        className,
      )}
      style={{ containerType: "inline-size" }}
    >
      {children}
    </div>
  );
}
