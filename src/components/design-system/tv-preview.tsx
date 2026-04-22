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
import { ScoreCounter } from "./score-counter";

type OverlayMode = "none" | "miss" | "wildcard";

/**
 * The live, composed broadcast. Single full-viewport surface:
 *   - <html> / page chrome: neutral "studio" background (never themed).
 *   - TV chassis: centered, capped to viewport height, hosts all controls.
 *   - TV screen: full height of chassis. Ticker always lands on bottom rail.
 *   - All testing controls live on the chassis chin as physical buttons:
 *       CH     → toggles in-screen channel menu
 *       STRIKE → toggles the red-X miss overlay
 *       WILD   → toggles the wildcard persona overlay
 *
 * Layout inside the screen, top → bottom:
 *   1. Header strip: player-label · AI FEUD wordmark · ScoreCounter
 *   2. Subject strip: "WE ASKED 100 [SUBJECT PLURAL]…"  (themed)
 *   3. Topic strip:   the actual question               (themed)
 *   4. Board:         dynamic 3 / 5 / 7 / 8 tile grid
 *   5. InputTerminal: interactive guess input
 *   6. NewsTicker:    broadcast ticker
 */
export function TVPreview() {
  const [skin, setSkin] = useState<DemographicSkin>(() =>
    getDemographic(DEFAULT_DEMOGRAPHIC_ID),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [overlay, setOverlay] = useState<OverlayMode>("none");
  const [guess, setGuess] = useState("");
  const [score, setScore] = useState(0);

  // Channel-driven board content.
  const tileCount = skin.tileCount;
  const answers = skin.sampleAnswers.slice(0, tileCount);
  const rows = Math.ceil(tileCount / 2);
  const isOdd = tileCount % 2 === 1;

  const handlePick = (next: DemographicSkin) => {
    setSkin(next);
    setMenuOpen(false);
    setOverlay("none");
    setScore(0);
    setGuess("");
  };

  const toggleOverlay = (mode: Exclude<OverlayMode, "none">) => {
    setOverlay((cur) => (cur === mode ? "none" : mode));
    setMenuOpen(false);
  };

  // For now input is cosmetic: Enter bumps the local score so the counter
  // visibly reacts during design QA. Real scoring lands with useGameLoop.
  const handleSubmit = (value: string) => {
    if (!value) return;
    setScore((s) => Math.min(999, s + 10));
    setGuess("");
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
            {/* Header strip — themed */}
            <header className="flex items-center justify-between gap-3 border-b-4 border-ink bg-[var(--color-room-bg)] px-3 py-1.5">
              <span
                className="font-base text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "var(--color-room-ink)", opacity: 0.75 }}
              >
                SINGLE PLAYER
              </span>
              <h1
                className="font-blocks leading-none tracking-wider"
                style={{
                  fontSize: "clamp(1rem, 3.2cqi, 1.5rem)",
                  color: "var(--color-room-ink)",
                  textShadow: "2px 2px 0px var(--color-tile-shadow)",
                }}
              >
                AI FEUD
              </h1>
              <ScoreCounter score={score} />
            </header>

            {/* Subject strip — "We asked 100 …" */}
            <div
              className="border-b-4 border-ink px-3 py-1"
              style={{
                backgroundColor: "var(--color-room-bg)",
                filter: "brightness(0.92)",
              }}
            >
              <p
                className="font-base text-center font-bold uppercase tracking-[0.18em] leading-tight"
                style={{
                  color: "var(--color-room-ink)",
                  fontSize: "clamp(0.65rem, 1.8cqi, 0.85rem)",
                }}
              >
                &mdash; We asked 100 {skin.subjectPlural}&hellip; &mdash;
              </p>
            </div>

            {/* Topic strip — reads as the question */}
            <div className="border-b-4 border-ink bg-[var(--color-screen-base)] px-3 py-2">
              <p
                className="font-base font-bold leading-snug text-ink text-balance text-center"
                style={{ fontSize: "clamp(0.9rem, 2.5cqi, 1.1rem)" }}
              >
                {skin.sampleTopic}
              </p>
            </div>

            {/* Board — dynamic tile count. Odd counts: final tile spans full row. */}
            <div className="relative flex-1 min-h-0 bg-[var(--color-screen-base)] p-2.5">
              <div
                className="grid h-full grid-cols-2 gap-2"
                style={{
                  gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                }}
              >
                {answers.map((answer, i) => (
                  <Tile
                    key={answer.rank}
                    rank={answer.rank}
                    text={answer.text}
                    score={answer.score}
                    flavorQuote={answer.flavorQuote}
                    isRevealed={i < Math.ceil(tileCount / 2)}
                    className={
                      isOdd && i === tileCount - 1 ? "col-span-2" : undefined
                    }
                  />
                ))}
              </div>
            </div>

            {/* Input terminal — interactive */}
            <div className="border-t-4 border-ink bg-[var(--color-room-bg)] px-3 py-2">
              <InputTerminal
                value={guess}
                onChange={setGuess}
                onSubmit={handleSubmit}
              />
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
