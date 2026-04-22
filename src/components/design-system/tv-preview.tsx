"use client";

import { useState } from "react";
import {
  DEFAULT_DEMOGRAPHIC_ID,
  getDemographic,
  type DemographicSkin,
} from "@/lib/design-system/demographics";
import { ChannelMenu } from "./demographic-switcher";
import { TVFrame, TVScreen } from "./tv-frame";
import { Tile } from "./tile";
import { InputTerminal } from "./input-terminal";
import { NewsTicker } from "./news-ticker";
import { StrikeIndicator } from "./strike-indicator";
import { PhysicalButton } from "./physical-button";

type OverlayMode = "none" | "miss" | "wildcard";

/**
 * The live, composed broadcast. Single full-viewport surface:
 *   - <html> / page chrome: neutral "studio" background (never themed).
 *   - TV chassis: centered, capped to viewport height, hosts all controls.
 *   - TV screen: full height of chassis, ticker always lands on bottom rail.
 *   - All testing controls live on the chassis bezel as physical buttons:
 *       CH     → toggles in-screen channel menu (replaces external switcher)
 *       STRIKE → toggles the red-X miss overlay
 *       WILD   → toggles the wildcard persona overlay
 *   - Theming is scoped to the TV frame via `data-demographic`; the studio
 *     background never changes with the channel.
 */
export function TVPreview() {
  const [skin, setSkin] = useState<DemographicSkin>(() =>
    getDemographic(DEFAULT_DEMOGRAPHIC_ID),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [overlay, setOverlay] = useState<OverlayMode>("none");

  // Ensure we always have 4 answers; pad with unrevealed if short.
  const answers = skin.sampleAnswers.slice(0, 4);

  const handlePick = (next: DemographicSkin) => {
    setSkin(next);
    setMenuOpen(false);
    setOverlay("none"); // clean board on channel change
  };

  const toggleOverlay = (mode: Exclude<OverlayMode, "none">) => {
    setOverlay((cur) => (cur === mode ? "none" : mode));
    setMenuOpen(false); // overlays and menu are mutually exclusive
  };

  return (
    <main className="studio-backdrop flex h-dvh min-h-[560px] w-full items-center justify-center p-3 sm:p-5">
      <TVFrame
        demographicId={skin.id}
        channelLabel={skin.channelLabel}
        chinButtons={
          <>
            <PhysicalButton
              label="CH"
              variant="menu"
              pressed={menuOpen}
              onClick={() => {
                setMenuOpen((v) => !v);
                setOverlay("none");
              }}
              title="Channel menu"
            />
            <PhysicalButton
              label="STRIKE"
              pressed={overlay === "miss"}
              onClick={() => toggleOverlay("miss")}
              title="Toggle strike overlay"
            />
            <PhysicalButton
              label="WILD"
              pressed={overlay === "wildcard"}
              onClick={() => toggleOverlay("wildcard")}
              title="Toggle wildcard overlay"
            />
            <PhysicalButton label="VOL-" />
            <PhysicalButton label="VOL+" />
            <PhysicalButton label="SHARE" />
            <PhysicalButton label="PWR" variant="power" />
          </>
        }
      >
        <TVScreen>
          <div className="flex h-full flex-col">
            {/* Header strip */}
            <header className="flex items-center justify-between gap-3 border-b-4 border-ink bg-paper px-3 py-1.5">
              <span className="font-base text-[var(--text-base-xs)] font-bold uppercase tracking-widest text-ink/80">
                SINGLE PLAYER
              </span>
              <h1
                className="font-blocks text-[clamp(1rem,3.2cqi,1.5rem)] leading-none tracking-wider text-ink"
                style={{ textShadow: "2px 2px 0px var(--color-tile-shadow)" }}
              >
                AI FEUD
              </h1>
              <span className="font-blocks text-[var(--text-base-sm)] leading-none text-[var(--color-miss-accent)]">
                STRIKE {overlay === "miss" ? "1" : "0"}
              </span>
            </header>

            {/* Topic */}
            <div className="border-b-4 border-ink bg-[var(--color-tv-static)] px-3 py-2">
              <p className="font-base font-bold leading-snug text-ink text-balance" style={{ fontSize: "clamp(0.85rem, 2.4cqi, 1.05rem)" }}>
                {skin.sampleTopic}
              </p>
            </div>

            {/* Board */}
            <div className="relative flex-1 min-h-0 p-3">
              <div className="grid h-full grid-cols-2 grid-rows-2 gap-2.5">
                {answers.map((answer) => (
                  <Tile
                    key={answer.rank}
                    rank={answer.rank}
                    text={answer.text}
                    score={answer.score}
                    flavorQuote={answer.flavorQuote}
                    isRevealed={answer.rank % 2 === 1}
                  />
                ))}
              </div>
            </div>

            {/* Input terminal */}
            <div className="border-t-4 border-ink bg-[var(--color-tv-static)] px-3 py-2">
              <InputTerminal value="A ROLLED UP" focused />
            </div>

            {/* News ticker — always on the bottom rail */}
            <NewsTicker phrases={skin.tickerPhrases} />
          </div>

          {/* Overlays: menu and strike share the same z layer above the board */}
          {overlay === "miss" ? <StrikeIndicator mode="miss" /> : null}
          {overlay === "wildcard" ? (
            <StrikeIndicator
              mode="wildcard"
              personaName={skin.sampleWildcard.personaName}
              flavorQuote={skin.sampleWildcard.flavorQuote}
            />
          ) : null}
          {menuOpen ? (
            <ChannelMenu
              activeId={skin.id}
              onPick={handlePick}
              onClose={() => setMenuOpen(false)}
            />
          ) : null}
        </TVScreen>
      </TVFrame>
    </main>
  );
}
