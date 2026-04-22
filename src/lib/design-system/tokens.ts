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

export const TYPOGRAPHY_SCALE = [
  { key: "blocks-xl", sample: "AI FEUD", family: "blocks", px: 72, purpose: "Wordmark, giant ? and X." },
  { key: "blocks-lg", sample: "0", family: "blocks", px: 48, purpose: "Score and strike counters." },
  { key: "blocks-md", sample: "CH 04", family: "blocks", px: 28, purpose: "Channel label, OSD headers." },
  { key: "base-lg", sample: "Name a weapon a wizard would use if they lost their wand.", family: "base", px: 22, purpose: "Question header text." },
  { key: "base-md", sample: "A Rolled-Up Newspaper", family: "base", px: 18, purpose: "Revealed tile answer." },
  { key: "base-sm", sample: "— Tyrion Lannister: \"I drink and I know things.\"", family: "base", px: 14, purpose: "Flavor quote (italic), OSD labels, ticker body." },
  { key: "base-xs", sample: "VOL  ·  CH  ·  MUTE", family: "base", px: 12, purpose: "Bezel labels, footer credits." },
] as const;

export type TypographyStep = (typeof TYPOGRAPHY_SCALE)[number];

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
