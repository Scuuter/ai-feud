# Epic 3: Game Vertical Slice & Integration

## 1. Data Quality Notice (Data Pipeline)

- [ ] Address LLM hallucination in data-pipeline outputs where `flavorQuotes` occasionally have swapped `personaName` and `text` (this is a prompt engineering fix for Epic 1, but doesn't block this MVP runtime since both are just strings).

## 2. Implement `useGameLoop` Hook

- [x] Create `src/app/hooks/useGameLoop.ts`.
- [x] Initialize `GameState` (`createRound(survey)`) and store it via `useState`.
- [x] Manage a `currentWildcard` state to display wildcard flavor text on a successful wildcard guess.
- [x] Manage a `showStrike` transient state to trigger the strike animation overlay.
- [x] Implement `handleGuess(input: string)`:
  - Construct a `Guess` object.
  - Filter `activeSurvey.clusters` to exclude `revealedClusters` (un-revealed clusters only).
  - Pass the remaining clusters and wildcards to `matchGuess(guess, remainingClusters, wildcards)`.
  - If match `isWildCard == false`: Call `applyCorrectGuess`, clear any active wildcard overlays, and update state.
  - If match `isWildCard == true`: Set `currentWildcard` to the matched wildcard (no score/strike penalty).
  - If `matched == false`: Call `applyStrike`, set `showStrike` transient state, and update state.
- [x] Return properties: `round`, `score` (via `getScore`), `handleGuess`, `currentWildcard`, `clearWildcard`, `isComplete` (via `isRoundComplete`).

## 3. Wire Up Core UI Components

- [x] Update `src/app/page.tsx` to instantiate `useGameLoop` with MVP survey data (importing `scripts/output/game-of-thrones/suspicious-activity-3am-game-of-thrones-v1.json` statically for the vertical slice).
- [x] Pass the total `activeSurvey.clusters` and the `revealedClusters` state to the `<Board />` component so it knows which tiles to render face-up vs face-down.
- [x] Wire `<InputTerminal />` `onSubmit` prop to `handleGuess`. Disable input if `isComplete` is true.
- [x] Pass `round.strikes` length and `currentWildcard` to `<StrikeIndicator />` to show the correct overlays.
- [x] Ensure demographic themes sync seamlessly by reading `activeSurvey.demographicName`.
