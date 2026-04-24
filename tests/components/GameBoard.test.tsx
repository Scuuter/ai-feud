/**
 * GameBoard layout logic tests.
 *
 * GameBoard owns the structural math that determines how tiles are arranged:
 * cols, rows, and whether a hero tile (col-span-2) is needed.
 * TVPreview owns state (which tiles are revealed); GameBoard owns geometry.
 */

import { describe, it, expect } from "vitest";
import { computeBoardShape } from "@/components/game/GameBoard";

describe("computeBoardShape", () => {
  it("tileCount ≤ 4 → single column, no hero tile", () => {
    for (const n of [1, 2, 3, 4] as const) {
      const shape = computeBoardShape(n);
      expect(shape.cols).toBe(1);
      expect(shape.hasHeroTile).toBe(false);
      expect(shape.rows).toBe(n);
    }
  });

  it("tileCount = 5 → 2 cols, hero tile, 3 rows (1 hero + 2 pairs)", () => {
    const shape = computeBoardShape(5);
    expect(shape.cols).toBe(2);
    expect(shape.hasHeroTile).toBe(true);
    expect(shape.rows).toBe(3); // 1 hero row + (5-1)/2 = 2 rows
  });

  it("tileCount = 6 → 2 cols, no hero tile, 3 rows", () => {
    const shape = computeBoardShape(6);
    expect(shape.cols).toBe(2);
    expect(shape.hasHeroTile).toBe(false);
    expect(shape.rows).toBe(3);
  });

  it("tileCount = 7 → 2 cols, hero tile, 4 rows (1 hero + 3 pairs)", () => {
    const shape = computeBoardShape(7);
    expect(shape.cols).toBe(2);
    expect(shape.hasHeroTile).toBe(true);
    expect(shape.rows).toBe(4); // 1 hero row + (7-1)/2 = 3 rows
  });

  it("tileCount = 8 → 2 cols, no hero tile, 4 rows", () => {
    const shape = computeBoardShape(8);
    expect(shape.cols).toBe(2);
    expect(shape.hasHeroTile).toBe(false);
    expect(shape.rows).toBe(4);
  });
});
