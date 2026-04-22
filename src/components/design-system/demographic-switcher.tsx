"use client";

import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import {
  DEFAULT_DEMOGRAPHIC_ID,
  DEMOGRAPHICS,
  type DemographicId,
  type DemographicSkin,
} from "@/src/lib/design-system/demographics";

type DemographicSwitcherProps = {
  /** Called whenever the active demographic changes (for parent previews). */
  onChange?: (demographic: DemographicSkin) => void;
  /** Optional className applied to the root. */
  className?: string;
};

/**
 * A chunky broadcast-style channel selector. Writes `data-demographic` on
 * `document.documentElement` so the CSS token overrides in `globals.css`
 * cascade to every component on the page. Also applies the demographic's
 * optional `roomTextureClass` to the body.
 */
export function DemographicSwitcher({
  onChange,
  className,
}: DemographicSwitcherProps) {
  const [active, setActive] = useState<DemographicId>(DEFAULT_DEMOGRAPHIC_ID);

  const applyDemographic = useCallback((id: DemographicId) => {
    const skin = DEMOGRAPHICS.find((d) => d.id === id) ?? DEMOGRAPHICS[0];
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-demographic", skin.id);
      // Reset then apply texture class on body, if any
      const body = document.body;
      body.classList.remove("room-texture-stone", "room-texture-concrete");
      if (skin.roomTextureClass) {
        body.classList.add(skin.roomTextureClass);
      }
    }
    setActive(skin.id);
    onChange?.(skin);
  }, [onChange]);

  useEffect(() => {
    // Emit initial skin to the parent on mount
    const skin = DEMOGRAPHICS.find((d) => d.id === active) ?? DEMOGRAPHICS[0];
    onChange?.(skin);
    // We intentionally only want this on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={clsx(
        "bg-ink border-4 border-ink p-3 shadow-[6px_6px_0px_var(--color-tile-shadow)]",
        className,
      )}
      role="radiogroup"
      aria-label="Channel / demographic skin"
    >
      <p className="mb-3 font-blocks text-[var(--text-base-sm)] uppercase tracking-widest text-paper">
        CHANNEL SELECT
      </p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {DEMOGRAPHICS.map((skin) => {
          const isActive = skin.id === active;
          return (
            <button
              key={skin.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => applyDemographic(skin.id)}
              className={clsx(
                "group flex flex-col items-start gap-2 border-4 p-3 text-left transition-transform",
                "hover:-translate-y-0.5 hover:-translate-x-0.5",
                isActive
                  ? "border-paper bg-paper text-ink shadow-[4px_4px_0px_var(--color-wildcard-accent)]"
                  : "border-paper/30 bg-ink text-paper hover:border-paper/70",
              )}
            >
              <div className="flex w-full items-center gap-2">
                <span
                  aria-hidden="true"
                  className="inline-block h-3 w-3 border border-current"
                  style={{ backgroundColor: skin.palette.tileShadow }}
                />
                <span className="font-blocks text-[var(--text-base-xs)] uppercase tracking-wider">
                  CH {String(DEMOGRAPHICS.indexOf(skin) + 1).padStart(2, "0")}
                </span>
              </div>
              <span className="font-blocks text-[var(--text-base-md)] leading-tight uppercase">
                {skin.displayName}
              </span>
              <span className="font-base text-[var(--text-base-xs)] leading-snug opacity-80 text-pretty">
                {skin.tagline}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
