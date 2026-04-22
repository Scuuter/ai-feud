import type { ReactNode } from "react";
import { clsx } from "clsx";
import { PhysicalButton } from "./physical-button";

type TVFrameProps = {
  children: ReactNode;
  /** Extra className for the outer chassis. */
  className?: string;
  /** Channel label shown on the chin display (e.g., "CH 04 · VICE CITY FEED"). */
  channelLabel?: string;
};

/**
 * The Y2K CRT TV chassis. Pure CSS/Tailwind — no image assets. Composes:
 *   - Left/right speaker grilles
 *   - An inner screen slot (passed as children, typically <TVScreen />)
 *   - A chin housing the physical buttons and the channel-label LCD strip
 *
 * Geometry guaranteed to stay within `max-w-5xl` with an `aspect-[4/3]` feel.
 */
export function TVFrame({ children, className, channelLabel }: TVFrameProps) {
  return (
    <div
      className={clsx(
        "chassis-gradient relative mx-auto w-full max-w-5xl",
        "rounded-3xl border-4 border-tv-silver-dark",
        "shadow-[inset_0_2px_0_var(--color-tv-silver-light),inset_0_-4px_0_rgba(0,0,0,0.2),12px_12px_0_rgba(0,0,0,0.35)]",
        "p-4 sm:p-6 lg:p-8",
        className,
      )}
    >
      <div className="flex gap-3 sm:gap-5">
        {/* Left speaker grille */}
        <div
          aria-hidden="true"
          className="speaker-grille hidden sm:block w-6 lg:w-8 self-stretch border-2 border-tv-silver-dark"
        />

        {/* Inner screen slot */}
        <div className="flex-1">{children}</div>

        {/* Right speaker grille */}
        <div
          aria-hidden="true"
          className="speaker-grille hidden sm:block w-6 lg:w-8 self-stretch border-2 border-tv-silver-dark"
        />
      </div>

      {/* Chin: channel LCD + physical buttons */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        {channelLabel ? (
          <div className="bg-ink border-2 border-tv-silver-dark px-3 py-1.5 shadow-[inset_2px_2px_0px_rgba(0,0,0,0.6)]">
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

        <div className="flex items-end gap-2">
          <PhysicalButton label="VOL−" />
          <PhysicalButton label="VOL+" />
          <PhysicalButton label="MUTE" />
          <PhysicalButton label="SHARE" />
          <PhysicalButton label="PWR" variant="power" />
        </div>
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
 * inner border. Position: relative so the <StrikeIndicator /> can overlay.
 */
export function TVScreen({ children, className }: TVScreenProps) {
  return (
    <div
      className={clsx(
        "tv-scanlines tv-vignette relative overflow-hidden",
        "bg-tv-static border-4 border-ink",
        "aspect-[4/3] w-full",
        className,
      )}
    >
      {children}
    </div>
  );
}
