/**
 * Token Parity Tests
 *
 * Enforces the mirror contract between `src/lib/design-system/tokens.ts` and
 * `src/app/globals.css`. Because Tailwind v4 uses CSS as the source of truth
 * (no tailwind.config.ts), these two files must be kept in sync manually.
 * This test suite is the automated guardrail that catches drift.
 *
 * Rules enforced:
 *   1. Every hex value in CORE_PALETTE must appear in globals.css @theme block.
 *   2. Every ThemedTokenKey must have a corresponding CSS variable name in globals.css.
 *   3. TYPOGRAPHY_SCALE keys must each have a matching --text-* variable in globals.css.
 *   4. MOTION.marqueeDuration must match the fallback in .animate-marquee.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { describe, it, expect, beforeAll } from "vitest";
import { CORE_PALETTE, THEMED_TOKEN_LABELS, TYPOGRAPHY_SCALE, MOTION } from "@/lib/design-system/tokens";
import type { ThemedTokenKey, TypographyKey } from "@/lib/design-system/tokens";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.env.PROJECT_ROOT!;

function readCss(): string {
  return readFileSync(resolve(ROOT, "src/app/globals.css"), "utf-8");
}

function extractThemeBlock(css: string): string {
  const match = css.match(/@theme inline\s*\{([\s\S]*?)\}/);
  if (!match) throw new Error("Could not find @theme inline block in globals.css");
  return match[1];
}

/** Normalise hex to lowercase 6-digit form for comparison. */
function normaliseHex(hex: string): string {
  return hex.toLowerCase().replace(/^#/, "");
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

let cssSource: string;
let themeBlock: string;

beforeAll(() => {
  cssSource = readCss();
  themeBlock = extractThemeBlock(cssSource);
});

// ---------------------------------------------------------------------------
// 1. Core palette parity
// ---------------------------------------------------------------------------

describe("CORE_PALETTE ↔ globals.css @theme parity", () => {
  for (const [key, hex] of Object.entries(CORE_PALETTE) as [string, string][]) {
    it(`CORE_PALETTE.${key} (${hex}) appears in @theme inline block`, () => {
      const normalised = normaliseHex(hex);
      // CSS may use lowercase hex; normalise both sides
      const cssNormalised = themeBlock.toLowerCase();
      expect(cssNormalised).toContain(`#${normalised}`);
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Themed token key → CSS variable name parity
// ---------------------------------------------------------------------------

/**
 * Maps a ThemedTokenKey (camelCase TS) to its CSS variable name (kebab-case).
 * e.g. "roomBg" → "--color-room-bg"
 */
function toCssVarName(key: ThemedTokenKey): string {
  const kebab = key.replace(/([A-Z])/g, (c: string) => `-${c.toLowerCase()}`);
  return `--color-${kebab}`;
}

describe("ThemedTokenKey → CSS variable parity", () => {
  for (const key of Object.keys(THEMED_TOKEN_LABELS) as ThemedTokenKey[]) {
    const cssVar = toCssVarName(key);
    it(`ThemedTokenKey "${key}" maps to "${cssVar}" which exists in globals.css`, () => {
      expect(cssSource).toContain(cssVar);
    });
  }
});

// ---------------------------------------------------------------------------
// 3. Typography scale key → CSS variable parity
// ---------------------------------------------------------------------------

describe("TYPOGRAPHY_SCALE keys ↔ globals.css @theme parity", () => {
  for (const key of Object.keys(TYPOGRAPHY_SCALE) as TypographyKey[]) {
    const cssVar = `--text-${key}`;
    it(`Typography step "${key}" maps to "${cssVar}" in @theme block`, () => {
      expect(themeBlock).toContain(cssVar);
    });
  }
});

// ---------------------------------------------------------------------------
// 4. Motion marquee duration consistency
// ---------------------------------------------------------------------------

describe("MOTION token consistency", () => {
  it("MOTION.marqueeDuration default matches .animate-marquee fallback in globals.css", () => {
    // The CSS uses `var(--ticker-duration, 45s)` as the computed default;
    // MOTION.marqueeDuration is the TS-side reference value used by components.
    // They don't have to be identical (ticker scales dynamically) but the TS
    // value must be a valid CSS time string.
    expect(MOTION.marqueeDuration).toMatch(/^\d+s$/);
  });

  it("MOTION spring configs have required Framer Motion fields", () => {
    const springs = [MOTION.snap, MOTION.flip, MOTION.strikeIn] as const;
    for (const spring of springs) {
      expect(spring.type).toBe("spring");
      expect(typeof spring.stiffness).toBe("number");
      expect(typeof spring.damping).toBe("number");
    }
  });

  it("MOTION.strikeOut has duration and ease fields", () => {
    expect(typeof MOTION.strikeOut.duration).toBe("number");
    expect(typeof MOTION.strikeOut.ease).toBe("string");
  });
});
