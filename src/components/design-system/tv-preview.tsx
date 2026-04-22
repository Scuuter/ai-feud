"use client";

import { useState } from "react";
import { clsx } from "clsx";
import {
  DEFAULT_DEMOGRAPHIC_ID,
  DEMOGRAPHICS,
  getDemographic,
  type DemographicSkin,
} from "@/lib/design-system/demographics";
import { DemographicSwitcher } from "./demographic-switcher";
import { TVFrame, TVScreen } from "./tv-frame";
import { Tile } from "./tile";
import { InputTerminal } from "./input-terminal";
import { NewsTicker } from "./news-ticker";
import { StrikeIndicator } from "./strike-indicator";

type OverlayMode = "none" | "miss" | "wildcard";

const OVERLAY_MODES: { id: OverlayMode; label: string }[] = [
  { id: "none", label: "CLEAN" },
  { id: "miss", label: "STRIKE" },
  { id: "wildcard", label: "WILDCARD" },
];

/**
 * The live, composed broadcast: a working TV chassis fed by whichever
 * demographic is currently selected. Rooting the state here (rather than in
 * the page) lets the switcher drive the inner screen AND the ticker AND the
 * channel label AND the overlay in lockstep.
 */
export function TVPreview() {
  const [skin, setSkin] = useState<DemographicSkin>(() =>
    getDemographic(DEFAULT_DEMOGRAPHIC_ID),
  );
  const [overlay, setOverlay] = useState<OverlayMode>("none");

  // Ensure we always have 4 answers; pad with unrevealed if short.
  const answers = skin.sampleAnswers.slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      {/* Channel switcher + overlay demo controls */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <DemographicSwitcher
          onChange={(next) => {
            setSkin(next);
            // Reset overlay when switching channels so the user sees a clean board first
            setOverlay("none");
          }}
        />

        <div
          className="bg-ink border-4 border-ink p-3 shadow-[6px_6px_0px_var(--color-tile-shadow)] flex flex-col gap-3"
          role="radiogroup"
          aria-label="Overlay state"
        >
          <p className="font-blocks text-[var(--text-base-sm)] uppercase tracking-widest text-paper">
            OVERLAY
          </p>
          <div className="flex gap-2">
            {OVERLAY_MODES.map((mode) => {
              const isActive = mode.id === overlay;
              return (
                <button
                  key={mode.id}
                  type="button"
                  role="radio"
                  aria-checked={isActive}
                  onClick={() => setOverlay(mode.id)}
                  className={clsx(
                    "border-4 px-3 py-2 font-blocks text-[var(--text-base-xs)] uppercase tracking-widest",
                    isActive
                      ? "border-paper bg-paper text-ink shadow-[3px_3px_0px_var(--color-wildcard-accent)]"
                      : "border-paper/30 bg-ink text-paper hover:border-paper/70",
                  )}
                >
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* The TV */}
      <TVFrame channelLabel={skin.channelLabel}>
        <TVScreen>
          <div className="flex h-full flex-col">
            {/* Header strip */}
            <header className="flex items-center justify-between gap-3 border-b-4 border-ink bg-paper px-4 py-2">
              <span className="font-base text-[var(--text-base-xs)] font-bold uppercase tracking-widest text-ink/80">
                SINGLE PLAYER
              </span>
              <h1
                className="font-blocks text-[var(--text-blocks-md)] leading-none tracking-wider text-ink"
                style={{
                  textShadow: "3px 3px 0px var(--color-tile-shadow)",
                }}
              >
                AI FEUD
              </h1>
              <span className="font-blocks text-[var(--text-base-md)] leading-none text-[var(--color-miss-accent)]">
                STRIKE 0
              </span>
            </header>

            {/* Topic */}
            <div className="border-b-4 border-ink bg-[var(--color-tv-static)] px-4 py-3">
              <p className="font-base text-[var(--text-base-md)] font-bold leading-snug text-ink text-balance">
                {skin.sampleTopic}
              </p>
            </div>

            {/* Board */}
            <div
              className="relative flex-1 p-4"
              style={{ containerType: "inline-size" }}
            >
              <div className="grid h-full grid-cols-2 gap-3">
                {answers.map((answer) => (
                  <Tile
                    key={answer.rank}
                    rank={answer.rank}
                    text={answer.text}
                    score={answer.score}
                    flavorQuote={answer.flavorQuote}
                    // Alternate revealed/unrevealed so the preview shows both states
                    isRevealed={answer.rank % 2 === 1}
                  />
                ))}
              </div>

              {overlay === "miss" ? <StrikeIndicator mode="miss" /> : null}
              {overlay === "wildcard" ? (
                <StrikeIndicator
                  mode="wildcard"
                  personaName={skin.sampleWildcard.personaName}
                  flavorQuote={skin.sampleWildcard.flavorQuote}
                />
              ) : null}
            </div>

            {/* Input terminal */}
            <div className="border-t-4 border-ink bg-[var(--color-tv-static)] px-4 py-3">
              <InputTerminal value="A ROLLED UP" focused />
            </div>

            {/* News ticker */}
            <NewsTicker phrases={skin.tickerPhrases} />
          </div>
        </TVScreen>
      </TVFrame>

      {/* Room wall caption */}
      <aside
        className="border-4 border-ink p-4 shadow-[6px_6px_0px_var(--color-ink)] max-w-3xl"
        style={{
          backgroundColor: "var(--color-room-bg)",
          color: "var(--color-room-ink)",
        }}
      >
        <p className="font-blocks text-[var(--text-base-sm)] uppercase tracking-widest opacity-80">
          ROOM · {skin.displayName}
        </p>
        <p className="mt-2 font-base text-[var(--text-base-md)] leading-relaxed text-pretty">
          {skin.roomDescription}
        </p>
      </aside>
    </div>
  );
}

// Re-export for convenience in the page
export { DEMOGRAPHICS };
