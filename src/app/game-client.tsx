"use client";

import { useState, useRef, useEffect } from "react";
import { getDemographic } from "@/lib/design-system/demographics";
import { TVFrame, TVScreen } from "@/components/design-system/tv-frame";
import { InputTerminal } from "@/components/design-system/input-terminal";
import { NewsTicker } from "@/components/design-system/news-ticker";
import { StrikeIndicator } from "@/components/design-system/strike-indicator";
import { ScoreCounter } from "@/components/design-system/score-counter";
import { GameBoard } from "@/components/game/GameBoard";
import { useGameLoop } from "@/hooks/useGameLoop";
import type { SurveyResult } from "@/lib/game-logic/types";
import type { SampleAnswer } from "@/lib/design-system/demographics";

export function GameClient({ surveyData }: { surveyData: SurveyResult }) {
  const {
    round,
    score,
    isComplete,
    handleGuess,
    currentWildcard,
    clearWildcard,
    showStrike,
    clearStrike,
  } = useGameLoop(surveyData);

  const [guess, setGuess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus orchestration: guarantee the input gets focus back right after an overlay clears
  useEffect(() => {
    if (!showStrike && !currentWildcard && !isComplete) {
      inputRef.current?.focus();
    }
  }, [showStrike, currentWildcard, isComplete]);

  const handleSubmit = (value: string) => {
    if (!value) return;
    handleGuess(value);
    setGuess("");
  };

  // Enforce Game of Thrones skin for MVP since data is GoT
  const skin = getDemographic("game-of-thrones");

  // Map JSON clusters to GameBoard answers format
  const answers: SampleAnswer[] = round.activeSurvey.clusters.map((c, i) => ({
    rank: (i + 1) as SampleAnswer["rank"],
    text: c.text,
    score: c.score,
    flavorQuote: c.flavorQuotes?.[0]
      ? {
          personaName: c.flavorQuotes[0].personaName,
          text: c.flavorQuotes[0].text,
        }
      : undefined,
  }));

  // Identify which ranks are revealed
  const revealedRanks = round.revealedClusters.map(
    (rc) => answers.find((a) => a.text === rc.text)!.rank
  );

  return (
    <main className="studio-backdrop flex h-dvh min-h-[560px] w-full items-center justify-center p-3 sm:p-5">
      <TVFrame
        demographicId={skin.id}
        channelLabel={skin.channelLabel}
        chinButtons={<></>}
      >
        <TVScreen>
          <div className="flex h-full flex-col">
            {/* Header strip */}
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

            {/* Subject strip */}
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

            {/* Topic strip */}
            <div className="border-b-4 border-ink bg-[var(--color-screen-base)] px-3 py-2">
              <p
                className="font-base font-bold leading-snug text-ink text-balance text-center"
                style={{ fontSize: "clamp(0.9rem, 2.5cqi, 1.1rem)" }}
              >
                {round.activeSurvey.topicText}
              </p>
            </div>

            {/* Board */}
            <div className="relative flex-1 min-h-0 bg-[var(--color-screen-base)] p-2.5">
              <GameBoard answers={answers} revealedRanks={revealedRanks} />
            </div>

            {/* Input terminal */}
            <div className="border-t-4 border-ink bg-[var(--color-room-bg)] px-3 py-2">
              <InputTerminal
                ref={inputRef}
                value={guess}
                onChange={setGuess}
                onSubmit={handleSubmit}
              />
            </div>

            {/* News ticker */}
            <NewsTicker phrases={skin.tickerPhrases} />
          </div>

          {/* Overlays */}
          {showStrike ? <StrikeIndicator mode="miss" onDismiss={clearStrike} /> : null}
          {currentWildcard ? (
            <StrikeIndicator
              mode="wildcard"
              personaName={currentWildcard.flavorQuote.personaName}
              flavorQuote={currentWildcard.flavorQuote.text}
              onDismiss={clearWildcard}
            />
          ) : null}
          {isComplete && !showStrike && !currentWildcard ? (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="text-center text-white p-6 border-4 border-white bg-ink">
                <h2 className="text-4xl font-blocks mb-4">ROUND OVER</h2>
                <p className="text-xl font-base font-bold">Final Score: {score}</p>
              </div>
            </div>
          ) : null}
        </TVScreen>
      </TVFrame>
    </main>
  );
}
