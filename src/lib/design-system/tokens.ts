/**
 * Typed mirror of the CSS tokens defined in `src/app/globals.css`.
 *
 * This file exists so that non-CSS contexts (showcase swatches, tests, copy
 * generators) can reference the same source of truth. If you update a hex
 * value here, you MUST update the corresponding CSS variable. The showcase
 * page is the visual parity check.
 *
 * See `docs/design-system.md` §2 for the canonical specification.
 */

export type HexColor = `#${string}`;

/* ---------------------------------------------------------------------------
 * Core Vice City palette — never changes between demographics.
 * ------------------------------------------------------------------------- */

export const CORE_PALETTE = {
  vicePink: "#FFC0CB",
  tvSilver: "#C0C0C0",
  tvSilverLight: "#E6E6E6",
  tvSilverDark: "#8F8F8F",
  tvStatic: "#F5F5F5",
  viceBlue: "#00FFFF",
  alertRed: "#FF0000",
  wildcardYellow: "#FFD700",
  ink: "#000000",
  paper: "#FFFFFF",
} as const satisfies Record<string, HexColor>;

export type CorePaletteKey = keyof typeof CORE_PALETTE;

/* ---------------------------------------------------------------------------
 * Themed semantic tokens — default values shown. Overridden per demographic.
 * ------------------------------------------------------------------------- */

export type ThemedTokenKey =
  | "roomBg"
  | "roomInk"
  | "tileShadow"
  | "wildcardAccent"
  | "missAccent"
  | "channelDot";

export const THEMED_TOKEN_LABELS: Record<ThemedTokenKey, string> = {
  roomBg: "Room background",
  roomInk: "Room ink",
  tileShadow: "Tile drop-shadow",
  wildcardAccent: "Wildcard accent",
  missAccent: "Miss / strike accent",
  channelDot: "LIVE bug color",
};

/* ---------------------------------------------------------------------------
 * Typography
 * ------------------------------------------------------------------------- */

/**
 * Keyed typography scale. Use the key to reference a step without magic
 * array indexing. Each entry maps to a CSS class pair: `font-{family}` +
 * `text-{key}` (e.g. `font-blocks text-blocks-xl`).
 */
export const TYPOGRAPHY_SCALE = {
  "blocks-xl": { family: "blocks", px: 72, sample: "AI FEUD",                                                    purpose: "Wordmark, giant ? and X." },
  "blocks-lg": { family: "blocks", px: 48, sample: "0",                                                          purpose: "Score and strike counters." },
  "blocks-md": { family: "blocks", px: 28, sample: "CH 04",                                                      purpose: "Channel label, OSD headers." },
  "base-lg":   { family: "base",   px: 22, sample: "Name a weapon a wizard would use if they lost their wand.",  purpose: "Question header text." },
  "base-md":   { family: "base",   px: 18, sample: "A Rolled-Up Newspaper",                                      purpose: "Revealed tile answer." },
  "base-sm":   { family: "base",   px: 14, sample: "— Tyrion Lannister: \"I drink and I know things.\"",         purpose: "Flavor quote (italic), OSD labels, ticker body." },
  "base-xs":   { family: "base",   px: 12, sample: "VOL  ·  CH  ·  MUTE",                                        purpose: "Bezel labels, footer credits." },
} as const satisfies Record<string, { family: "blocks" | "base"; px: number; sample: string; purpose: string }>;

export type TypographyKey = keyof typeof TYPOGRAPHY_SCALE;
export type TypographyStep = (typeof TYPOGRAPHY_SCALE)[TypographyKey];

/* ---------------------------------------------------------------------------
 * Motion
 * ------------------------------------------------------------------------- */

export const MOTION = {
  snap: { type: "spring", stiffness: 300, damping: 20 },
  flip: { type: "spring", stiffness: 260, damping: 22 },
  strikeIn: { type: "spring", stiffness: 500, damping: 18 },
  strikeOut: { duration: 0.3, ease: "easeIn" },
  marqueeDuration: "30s",
} as const;
