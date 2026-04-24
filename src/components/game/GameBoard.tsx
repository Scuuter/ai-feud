import { Tile } from "@/components/design-system/tile";
import type { SampleAnswer } from "@/lib/design-system/demographics";

// ---------------------------------------------------------------------------
// Board shape logic — pure, exported for unit tests
// ---------------------------------------------------------------------------

export type TileCount = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type BoardShape = {
  cols: number;
  rows: number;
  hasHeroTile: boolean;
};

/**
 * Derives the grid geometry from the number of tiles.
 *
 * Rules (from docs/design-system.md §3):
 *   - tileCount ≤ 4  → single column, no hero tile
 *   - tileCount odd  → hero tile spans top row (rank 1), rest in 2 cols
 *   - tileCount even → plain 2 × (n/2) grid
 */
export function computeBoardShape(tileCount: TileCount): BoardShape {
  if (tileCount <= 4) {
    return { cols: 1, rows: tileCount, hasHeroTile: false };
  }
  const hasHeroTile = tileCount % 2 === 1;
  const cols = 2;
  const rows = hasHeroTile ? 1 + (tileCount - 1) / 2 : tileCount / 2;
  return { cols, rows, hasHeroTile };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

type GameBoardProps = {
  answers: SampleAnswer[];
  revealedCount: number;
};

/**
 * Owns structural math (cols, rows, hero tile span) and renders the tile grid.
 * TVPreview owns state (which tiles are revealed, which skin is active).
 * Tile owns internal presentation.
 */
export function GameBoard({ answers, revealedCount }: GameBoardProps) {
  const tileCount = answers.length as TileCount;
  const { cols, rows, hasHeroTile } = computeBoardShape(tileCount);

  return (
    <div
      className="grid h-full gap-2"
      style={{
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
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
          isRevealed={i < revealedCount}
          className={hasHeroTile && i === 0 ? "col-span-2" : undefined}
        />
      ))}
    </div>
  );
}
