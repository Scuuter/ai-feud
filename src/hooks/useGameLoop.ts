import { useState, useCallback, useRef } from "react";
import { createRound, getScore, isRoundComplete, applyCorrectGuess, applyStrike } from "@/lib/game-logic/GameState";
import { matchGuess } from "@/lib/game-logic/Matcher";
import type { SurveyResult, WildCard, Round, AnswerCluster } from "@/lib/game-logic/types";
import { GAME_CONFIG } from "@/lib/config";

export function useGameLoop(survey: SurveyResult) {
  const [round, setRound] = useState<Round>(() => createRound(survey));
  const [currentWildcard, setCurrentWildcard] = useState<WildCard | null>(null);
  const [showStrike, setShowStrike] = useState(false);
  const strikeTimerRef = useRef<number | null>(null);

  const clearWildcard = useCallback(() => setCurrentWildcard(null), []);

  const handleGuess = useCallback((input: string) => {
    // Ignore input if the game is over, or if an overlay is currently blocking the screen.
    if (isRoundComplete(round) || currentWildcard || showStrike) return;

    const guess = { rawInput: input, submittedAt: Date.now() };
    
    // Filter clusters to only those that haven't been revealed yet.
    const unrevealedClusters = round.activeSurvey.clusters.filter(
      (c) => !round.revealedClusters.some((rc) => rc.text === c.text)
    );
    const wildcards = round.activeSurvey.wildcards;

    const result = matchGuess(guess, unrevealedClusters, wildcards);

    if (result.matched) {
      if (result.isWildCard) {
        setCurrentWildcard(result.target as WildCard);
      } else {
        const nextRound = applyCorrectGuess(round, result.target as AnswerCluster);
        setRound(nextRound);
        setCurrentWildcard(null);
      }
    } else {
      const nextRound = applyStrike(round, input);
      setRound(nextRound);
      setShowStrike(true);

      if (strikeTimerRef.current !== null) {
        window.clearTimeout(strikeTimerRef.current);
      }
      strikeTimerRef.current = window.setTimeout(() => {
        setShowStrike(false);
      }, GAME_CONFIG.STRIKE_TIMEOUT_MS);
    }
  }, [round, currentWildcard, showStrike]);

  const clearStrike = useCallback(() => {
    if (strikeTimerRef.current !== null) {
      window.clearTimeout(strikeTimerRef.current);
    }
    setShowStrike(false);
  }, []);

  return {
    round,
    score: getScore(round),
    isComplete: isRoundComplete(round),
    handleGuess,
    currentWildcard,
    clearWildcard,
    showStrike,
    clearStrike,
  };
}
