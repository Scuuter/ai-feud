"use client";

import { useEffect, useRef } from "react";
import { clsx } from "clsx";
import {
  DEMOGRAPHICS,
  type DemographicId,
  type DemographicSkin,
} from "@/lib/design-system/demographics";

type ChannelMenuProps = {
  /** Currently-active demographic id. */
  activeId: DemographicId;
  /** Called when a channel is picked. */
  onPick: (skin: DemographicSkin) => void;
  /** Called when the menu should close (Escape / backdrop). */
  onClose: () => void;
  /** Optional className applied to the root overlay. */
  className?: string;
};

/**
 * In-TV channel-select menu. Rendered as a full-screen overlay inside the
 * `<TVScreen />` when the chassis "CH" button is pressed. Styled like a real
 * CRT OSD: dimmed scrim, hard-bordered panel, monospace channel numbers.
 *
 * Escape closes the menu. Focus is auto-moved to the active channel on open.
 */
export function ChannelMenu({
  activeId,
  onPick,
  onClose,
  className,
}: ChannelMenuProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    // Focus the currently-active channel when the menu opens
    activeRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className={clsx(
        "absolute inset-0 z-20 flex items-center justify-center p-5",
        className,
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Channel select"
    >
      {/* Scrim — click to dismiss */}
      <button
        type="button"
        aria-label="Close channel menu"
        onClick={onClose}
        className="absolute inset-0 bg-ink/70 cursor-default"
      />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-lg border-4 border-paper bg-ink shadow-[8px_8px_0px_var(--color-tile-shadow)]"
        role="radiogroup"
        aria-label="Channels"
      >
        <header className="flex items-center justify-between gap-3 border-b-4 border-paper bg-paper px-3 py-2">
          <span className="font-blocks text-[var(--text-base-sm)] uppercase tracking-widest text-ink">
            CHANNEL SELECT
          </span>
          <span className="font-blocks text-[var(--text-base-xs)] uppercase tracking-widest text-ink/60">
            ESC TO CLOSE
          </span>
        </header>

        <ul className="divide-y-2 divide-paper/20">
          {DEMOGRAPHICS.map((skin, i) => {
            const isActive = skin.id === activeId;
            const channelNumber = String(i + 1).padStart(2, "0");
            return (
              <li key={skin.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  ref={isActive ? activeRef : undefined}
                  onClick={() => onPick(skin)}
                  className={clsx(
                    "group flex w-full items-center gap-3 px-3 py-2.5 text-left",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-tile-shadow)]",
                    isActive
                      ? "bg-paper text-ink"
                      : "text-paper hover:bg-paper/10",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "inline-block h-5 w-8 border-2 text-center font-blocks leading-none text-[12px] tabular-nums flex items-center justify-center",
                      isActive ? "border-ink bg-ink text-paper" : "border-paper/60",
                    )}
                  >
                    {channelNumber}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block font-blocks text-[var(--text-base-md)] leading-tight uppercase">
                      {skin.displayName}
                    </span>
                    <span className="block font-base text-[var(--text-base-xs)] leading-snug opacity-80 text-pretty truncate">
                      {skin.tagline}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "inline-block h-3 w-3 border",
                      isActive ? "border-ink" : "border-paper/60",
                    )}
                    style={{ backgroundColor: skin.palette.tileShadow }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
