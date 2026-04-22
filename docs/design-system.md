# Design System: Survey Says — AI Feud

> **Scope.** This document is the canonical source of truth for the "Survey Says: AI Feud" visual language. It extends — and does not replace — [`visual-guide.md`](visual-guide.md). Where this file and the visual guide conflict, the visual guide wins on component-level specifics; this file wins on global tokens, typography scale, layout geometry, and **Demographic Skins** (the per-game flavor layer).
>
> **Constraints.** Next.js App Router · Tailwind CSS v4 · Framer Motion · no UI component libraries. Tokens are declared once in `src/app/globals.css` via `@theme inline`; everything else consumes them.

---

## 1. Design Principles

1. **The TV is a physical object.** It sits inside a room (the viewport). The browser window is furniture, not the game. Widening the window expands the room, never the screen.
2. **Y2K Broadcast Brutalism meets Vice City.** Hard, unblurred shadows. Thick black borders. Hot, saturated pinks. Chrome bezels. News-broadcast chrome everywhere (LIVE bug, lower third, ticker).
3. **Sterile text, unhinged content.** The chrome is rigid and authoritative; the AI output that appears inside it is chaotic. The tension between the two *is* the brand.
4. **80 / 20 typography.** Dot-matrix display font for scores, titles, and iconography. Boring broadcast sans for everything humans actually read.
5. **Demographics are channels, not redesigns.** When the host picks *Game of Thrones* or *Modern Berlin*, we are tuning the same TV to a different channel. The chassis, borders, layout geometry, and ticker format are untouched — only the room, accents, channel label, and broadcast copy change.
6. **Snappy, not floaty.** All motion uses spring physics (`stiffness: 300, damping: 20`). No easing curves longer than 400 ms. If it looks like a banking app, delete it.

---

## 2. Design Tokens

All tokens are defined in `src/app/globals.css` and exposed as Tailwind utilities via `@theme inline`. A typed mirror lives in [`src/lib/design-system/tokens.ts`](../src/lib/design-system/tokens.ts) for use in non-CSS contexts (story copy, README swatches, tests).

### 2.1 Core Palette (immutable)

These never change between demographics. They define the chassis.

| Token              | Hex       | Tailwind Class        | Usage                                              |
| ------------------ | --------- | --------------------- | -------------------------------------------------- |
| `--color-vice-pink`       | `#FFC0CB` | `bg-vice-pink`        | Default room wall (outside the TV).                |
| `--color-tv-silver`       | `#C0C0C0` | `bg-tv-silver`        | The TV chassis / bezel.                            |
| `--color-tv-silver-light` | `#E6E6E6` | `bg-tv-silver-light`  | Bezel highlight edge.                              |
| `--color-tv-silver-dark`  | `#8F8F8F` | `bg-tv-silver-dark`   | Bezel shadow edge, speaker grille.                 |
| `--color-tv-static`       | `#F5F5F5` | `bg-tv-static`        | Inner screen (with scanlines, see §2.5).           |
| `--color-vice-blue`       | `#00FFFF` | `text/shadow-vice-blue`| Default hard drop-shadow color on revealed tiles. |
| `--color-alert-red`       | `#FF0000` | `bg/text-alert-red`   | LIVE dot. Miss strike background. Ticker strip.    |
| `--color-wildcard-yellow` | `#FFD700` | `bg-wildcard-yellow`  | Default wildcard hit background.                   |
| `--color-ink`             | `#000000` | `bg/text/border-ink`  | All borders, primary text, unrevealed tiles.       |
| `--color-paper`           | `#FFFFFF` | `bg/text-paper`       | Revealed tile fill, input field background.        |

### 2.2 Themed Semantic Tokens (demographic-aware)

These default to the Vice City palette but are **overridden per demographic** (see §5). Components reference these tokens rather than the raw palette whenever the value might change between channels.

| Token                  | Default Value   | Purpose                                                            |
| ---------------------- | --------------- | ------------------------------------------------------------------ |
| `--color-room-bg`      | `#FFC0CB`       | The wall color outside the TV. Sets the room's mood.               |
| `--color-room-ink`     | `#000000`       | Text color used on the room wall (room labels, credits).           |
| `--color-tile-shadow`  | `#00FFFF`       | Hard drop-shadow on revealed `<Tile />` elements.                  |
| `--color-wildcard-accent` | `#FFD700`    | Fill of the `<StrikeIndicator />` wildcard alert box.              |
| `--color-miss-accent`  | `#FF0000`       | Fill behind the giant "X" for complete misses.                     |
| `--color-channel-dot`  | `#FF0000`       | The LIVE bug color in the header.                                  |

> **Rule.** Never reference `--color-vice-blue` directly from a `<Tile />` shadow. Use `--color-tile-shadow`. This is how channels reskin cleanly.

### 2.3 Typography Scale

Two families. No exceptions.

| Token           | Family (fallback)                         | Tailwind      | Usage                                                                                                                      |
| --------------- | ----------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `--font-blocks` | **Silkscreen** *(stand-in for "Blocks" by Sam Horne)* → `Courier New`, monospace | `font-blocks` | "AI FEUD" wordmark. Score numbers. Strike count. The giant `?` on unrevealed tiles. The screen-filling `X`. LIVE icon. `<InputTerminal />` cursor block `█`. |
| `--font-base`   | **Inter** → system-ui, Helvetica, Arial, sans-serif | `font-base`   | Questions. Revealed answer text. Flavor quotes (italic). Player input text (uppercase). Ticker body.                      |

Size ramp (use `font-blocks` or `font-base` + one of these sizes):

| Class               | Size  | Use                                                    |
| ------------------- | ----- | ------------------------------------------------------ |
| `text-blocks-xl`    | 72 px | Wordmark, giant `?`, strike `X`.                       |
| `text-blocks-lg`    | 48 px | Big score / strike counters.                           |
| `text-blocks-md`    | 28 px | Channel label, OSD headers.                            |
| `text-base-lg`      | 22 px | Question text on header.                               |
| `text-base-md`      | 18 px | Revealed answer body.                                  |
| `text-base-sm`      | 14 px | Flavor quote (italic), OSD labels, ticker body.        |
| `text-base-xs`      | 12 px | Bezel labels ("VOL", "CH"), footer credits.            |

### 2.4 Borders, Shadows, Radius

| Purpose                   | Value                                             |
| ------------------------- | ------------------------------------------------- |
| Interactive element border | `border-4 border-ink`                             |
| Hard drop-shadow (generic)| `shadow-[4px_4px_0px_var(--color-ink)]`           |
| Hard drop-shadow (tile)   | `shadow-[4px_4px_0px_var(--color-tile-shadow)]`   |
| Wildcard alert box        | `shadow-[8px_8px_0px_var(--color-ink)]`           |
| TV chassis outer radius   | `rounded-3xl` (24 px)                             |
| Inner screen radius       | `rounded-none` (square — CRT)                     |
| Tile radius               | `rounded-none`                                    |
| Button radius (chassis)   | `rounded-sm`                                      |

**Never** use `shadow-md` / `shadow-lg` / anything with `blur`. Soft shadows are banned.

### 2.5 Surface Treatments

- **Inner screen static.** `bg-tv-static` plus a repeating horizontal scanline overlay (1 px dark / 2 px transparent) applied via the `.tv-scanlines` utility class.
- **CRT vignette.** A radial gradient (`.tv-vignette`) darkens the four corners of the inner screen ~12 %.
- **Chassis gradient.** `bg-tv-silver` uses a top→bottom linear gradient from `--color-tv-silver-light` to `--color-tv-silver-dark` plus `shadow-inner` to fake injection-molded plastic.
- **Speaker grilles.** Vertical bands on the left/right bezel, rendered as a repeating linear gradient of dots (3 px `--color-ink`, 3 px `--color-tv-silver`).

### 2.6 Motion Tokens

| Token                | Value                                       | Use                                   |
| -------------------- | ------------------------------------------- | ------------------------------------- |
| `motion-snap`        | `spring, stiffness: 300, damping: 20`       | Default for everything.               |
| `motion-flip`        | `spring, stiffness: 260, damping: 22`       | `<Tile />` 3D flip on reveal.         |
| `motion-strike-in`   | `spring, stiffness: 500, damping: 18`       | `<StrikeIndicator />` hard snap.      |
| `motion-strike-out`  | `duration: 0.3, ease: "easeIn"`             | Strike indicator fade-out only.       |
| `marquee-duration`   | `30s linear infinite`                       | `<NewsTicker />` translation.         |

---

## 3. Layout Geometry

```
┌─────────────────────────── viewport (bg-room-bg) ───────────────────────────┐
│                                                                             │
│           ┌───────────── TV chassis (bg-tv-silver, rounded-3xl) ─────┐      │
│     ░░░   │ ░                                                      ░ │  ░░░ │
│    grille │ ░  ┌──── Inner screen (bg-tv-static, tv-scanlines) ──┐ ░ │ grille│
│           │ ░  │ ┌─ Header (SINGLE PLAYER · AI FEUD · STRIKE 0)─┐ │ ░ │      │
│           │ ░  │ └──────────────────────────────────────────────┘ │ ░ │      │
│           │ ░  │ ┌────────── Board · grid-cols-2 ──────────────┐ │ ░ │      │
│           │ ░  │ │  [ ? ]   [ ? ]                              │ │ ░ │      │
│           │ ░  │ │  [ ? ]   [ ? ]                              │ │ ░ │      │
│           │ ░  │ └──────────────────────────────────────────────┘ │ ░ │      │
│           │ ░  │ ┌──────── <InputTerminal /> ──────────────────┐ │ ░ │      │
│           │ ░  │ └──────────────────────────────────────────────┘ │ ░ │      │
│           │ ░  │ ┌──── <NewsTicker /> (bg-alert-red) ──────────┐ │ ░ │      │
│           │ ░  │ └──────────────────────────────────────────────┘ │ ░ │      │
│           │ ░  └──────────────────────────────────────────────────┘ ░ │      │
│           │ ░   [VOL−]  [VOL+]  [MUTE]  [SHARE]  [●]                ░ │      │
│           └───────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

- **Viewport wrapper.** `min-h-dvh w-full bg-[var(--color-room-bg)] flex items-center justify-center p-6 lg:p-10`.
- **TV chassis.** `w-full max-w-5xl aspect-[4/3] bg-tv-silver rounded-3xl p-6 lg:p-10 shadow-inner border-4 border-tv-silver-dark` — never stretches past 1024 px on desktop.
- **Inner screen.** `h-full w-full bg-tv-static border-4 border-ink relative overflow-hidden` with `.tv-scanlines` + `.tv-vignette`.
- **Chassis controls strip.** A flex row glued to the bottom of the bezel *below* the inner screen (outside the screen, on the silver casing) — chunky physical buttons with `shadow-inner`.

### Responsive rules

| Breakpoint | Behavior                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------- |
| `< 640 px` | Room padding collapses to `p-3`. Chassis fills nearly the viewport. Grille bands hide.            |
| `640–1024` | Full chassis, single speaker band per side, buttons wrap to two rows if needed.                   |
| `≥ 1024`   | Full geometry above. Board may upgrade to `grid-cols-4` at `xl:` for 8-cluster SurveyResults.     |

---

## 4. Component Inventory

Each component lives in `src/components/design-system/` as a showcase-ready primitive. Gameplay components (`<Board />`, `<Tile />` with Framer Motion, `<InputTerminal />`, etc.) live under `src/components/game/` and consume the same tokens.

| Component                  | File                                          | Purpose                                                                 |
| -------------------------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| `<TVFrame />`              | `tv-frame.tsx`                                | The chassis + speaker grilles + chin with physical buttons.             |
| `<TVScreen />`             | `tv-frame.tsx`                                | Inner screen with scanlines, vignette, header/board/ticker slots.       |
| `<Tile />`                 | `tile.tsx`                                    | Unrevealed `?` / Revealed answer + flavor quote. Static preview only.   |
| `<InputTerminal />`        | `input-terminal.tsx`                          | Chunky white bar above the ticker. Blinking cyan cursor block.          |
| `<StrikeIndicator />`      | `strike-indicator.tsx`                        | `mode="miss"` (giant red X) · `mode="wildcard"` (yellow alert box).     |
| `<NewsTicker />`           | `news-ticker.tsx`                             | Red strip at the bottom of the screen. CSS marquee.                     |
| `<PhysicalButton />`       | `physical-button.tsx`                         | Chassis-mounted buttons (Mute, Share, Settings).                        |
| `<Swatch />`               | `swatch.tsx`                                  | Showcase-only. Renders a token chip with label + hex.                   |
| `<ShowcaseSection />`      | `showcase-section.tsx`                        | Showcase-only. Labeled section wrapper.                                 |
| `<DemographicSwitcher />`  | `demographic-switcher.tsx`                    | Showcase-only client component. Live-swaps `data-demographic`.          |

### 4.1 `<Tile />` contract

Props match the schema in `schema.md`:

```ts
type TileProps = {
  text?: string;
  score?: number;
  rank?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  isRevealed: boolean;
  flavorQuote?: { personaName: string; text: string };
};
```

- **Unrevealed.** `bg-ink border-4 border-ink` with a giant cyan `?` (`font-blocks text-[var(--color-tile-shadow)]`). Rank number top-left (small, ink-on-silver dot).
- **Revealed.** `bg-paper text-ink border-4 border-ink shadow-[4px_4px_0px_var(--color-tile-shadow)]`. Text container uses CSS `cqi` sizing so 30-char answers shrink gracefully. Score pill bottom-right (`bg-ink text-paper font-blocks px-2 py-1`). If `flavorQuote` is present, render below answer in `font-base italic text-base-sm` prefixed with `— {personaName}:`.

### 4.2 `<StrikeIndicator />` contract

```ts
type StrikeIndicatorProps =
  | { mode: "miss" }
  | { mode: "wildcard"; personaName: string; flavorQuote: string };
```

- **Miss.** Full-screen overlay. `bg-[var(--color-miss-accent)]/20` backdrop, centered giant `X` in `font-blocks text-[12rem] text-[var(--color-miss-accent)]` with `-webkit-text-stroke: 6px var(--color-ink)`. Duration: 400 ms in/out.
- **Wildcard.** Centered card. `bg-[var(--color-wildcard-accent)] border-4 border-ink shadow-[8px_8px_0px_var(--color-ink)] p-6 max-w-md`. Line 1: persona name in `font-blocks text-blocks-md uppercase`. Line 2: quote in `font-base text-base-md` (not italic — this is literally their broadcast voice).

### 4.3 `<NewsTicker />` contract

```ts
type NewsTickerProps = {
  phrases: string[];   // comes from demographic.tickerPhrases
  liveLabel?: string;  // defaults to "LIVE"
};
```

- Leftmost element: a `bg-paper text-ink border-4 border-ink font-blocks px-3` "LIVE" badge with a pulsing `--color-channel-dot` dot.
- Remainder: `overflow-hidden` with a content strip that doubles the phrases and translates `-50%` over `30s linear infinite` for seamless loop.

---

## 5. Demographic Skins (Channels)

A **Demographic** is a themed collection of 100 AI personas (see `glossary.md`). Visually, each demographic is a **channel** — it overrides the semantic tokens in §2.2 via `[data-demographic="<id>"]` on `<html>` or any ancestor.

### 5.1 The skin contract

A demographic skin may set **only** these properties. Anything else is a violation of §1.5 and must be rejected in review.

```css
[data-demographic="..."] {
  --color-room-bg:         /* wall outside the TV */;
  --color-room-ink:        /* text color on that wall */;
  --color-tile-shadow:     /* hard shadow under revealed tiles */;
  --color-wildcard-accent: /* wildcard alert fill */;
  --color-miss-accent:     /* miss X color */;
  --color-channel-dot:     /* LIVE bug color */;
}
```

Additionally, each skin contributes the following non-CSS metadata via [`src/lib/design-system/demographics.ts`](../src/lib/design-system/demographics.ts):

```ts
type DemographicSkin = {
  id: "default" | "game-of-thrones" | "modern-berlin" | "italian-village";
  displayName: string;        // "GAME OF THRONES"
  channelLabel: string;       // "CH 07 · WESTEROS BROADCAST"
  tagline: string;            // One-line mood description.
  roomDescription: string;    // Copy for the showcase room wall.
  tickerPhrases: string[];    // News-runner headlines in that world's voice.
  sampleTopic: string;        // A topic whose flavor this channel nails.
  sampleAnswers: SampleAnswer[]; // 4 short board answers for previews.
  palette: {                  // Mirrors the CSS overrides for TS-side swatches.
    roomBg: string;
    tileShadow: string;
    wildcardAccent: string;
    missAccent: string;
  };
};
```

### 5.2 Registry

Four channels ship. All four preserve the Y2K Vice City chassis exactly; only the values in the contract above diverge.

---

#### 5.2.1 `default` — *Vice City Broadcast (v1)*

The canonical look. The one in `visual-guide.md`.

- **Room:** hot Miami flamingo pink, a 1995 hotel lobby at 2 a.m.
- **Channel label:** `CH 04 · VICE CITY FEED`
- **Tile shadow:** `#00FFFF` (cyan)
- **Wildcard accent:** `#FFD700` (gold)
- **Miss accent:** `#FF0000` (red)
- **Ticker voice:** generic late-night infomercial hallucinations.
- **Sample topic:** *"Name something you'd find in a wizard's suitcase."*

---

#### 5.2.2 `game-of-thrones` — *Westeros Royal Broadcast Corporation*

The TV is propped on a stone table in a drafty castle. Fires flicker off-camera. The ticker has absolutely no business existing in this century.

- **Room:** `#3A3F44` — wet slate stone. Optional `.room-texture-stone` overlay (diagonal hatched noise at 6 % opacity).
- **Room ink:** `#D7D2C8` — bone white.
- **Tile shadow:** `#A8D8EA` — frost blue ("Winter is coming" on every reveal).
- **Wildcard accent:** `#D4AF37` — King's gold. The Lannister foil.
- **Miss accent:** `#8B0000` — blood red. Not stop-sign red.
- **Channel dot:** `#8B0000` — the LIVE bug is a drop of blood.
- **Channel label:** `CH 07 · WESTEROS ROYAL BROADCAST`
- **Ticker voice:** House sigils, raven bulletins, small-council gossip, wildling alerts — all in broadcast uppercase.
  - `"BREAKING · SMALL COUNCIL VOTES 6-1 TO IGNORE NORTH AGAIN"`
  - `"WEATHER · WINTER STILL COMING · ETA: ACCORDING TO SOURCES, IMMINENT"`
  - `"SPORTS · TOURNEY POSTPONED AFTER THIRD UNEXPECTED BEHEADING"`
- **Sample topic:** *"Name something a Lannister does when they feel insulted."*

---

#### 5.2.3 `modern-berlin` — *Kanal Kreuzberg Spätkauf FM*

The TV is on a milk crate in a Neukölln apartment at 6 a.m. Someone's cigarette smoke is drifting across the lens. Bassline leaks through the walls.

- **Room:** `#2A2A2A` — concrete, graffiti-tagged. Optional `.room-texture-concrete` overlay.
- **Room ink:** `#F5F5F0` — cold off-white.
- **Tile shadow:** `#FF00FF` — magenta. Club flyer magenta.
- **Wildcard accent:** `#39FF14` — acid green. Slime rave.
- **Miss accent:** `#FF0040` — Späti neon sign red, not broadcast red.
- **Channel dot:** `#39FF14`.
- **Channel label:** `CH 24 · KANAL KREUZBERG`
- **Ticker voice:** U-Bahn delay announcements, BVG apologies, club door drama, pfand headlines.
  - `"U8 STÖRUNG · ERSATZVERKEHR · OBVIOUSLY"`
  - `"BERGHAIN DOOR · 4 H QUEUE · SVEN SAYS NEIN"`
  - `"SPÄTI ROUND: EIN BIER, EIN WASSER, EIN KUSS VON DER KASSE"`
- **Sample topic:** *"Name something you'd pull out of a Späti fridge at 5 a.m."*

---

#### 5.2.4 `italian-village` — *RAI Quattro · Il Canale del Paese*

The TV lives on top of a crocheted doily in a stone-walled kitchen in Puglia. A grandmother is judging you. The ticker discusses pasta politics.

- **Room:** `#F4E4BC` — fresh-baked cream / tufo limestone.
- **Room ink:** `#3B2A1A` — burnt-umber ink.
- **Tile shadow:** `#6B8E23` — olive branch.
- **Wildcard accent:** `#E25822` — terracotta pot.
- **Miss accent:** `#9B2335` — Chianti spill.
- **Channel dot:** `#9B2335`.
- **Channel label:** `CH 04 · RAI QUATTRO · IL PAESE`
- **Ticker voice:** sagra del pomodoro, scooter traffic, gossip from the piazza, weather reported by cats.
  - `"METEO · SOLE · MA LA NONNA DICE DI PORTARE UNA FELPA"`
  - `"SAGRA DEL PEPERONCINO · INGRESSO GRATIS · LIVELLO DI PICCANTEZZA: DIO"`
  - `"TRAFFICO · UNA VESPA · UN PASTORE · UN DIBATTITO"`
- **Sample topic:** *"Nomina una cosa che la nonna dice quando sbagli la pasta."*

### 5.3 Authoring a new skin

1. Add a CSS block `[data-demographic="<id>"] { ... }` in `globals.css` using **only** the six tokens in §5.1.
2. Append a `DemographicSkin` object to the array exported from `src/lib/design-system/demographics.ts`.
3. Verify in the design-system showcase page (`/`) via the `<DemographicSwitcher />` that:
   - the TV bezel, borders, fonts, and layout have **not** changed,
   - the room wall reads the new mood instantly,
   - the ticker copy feels native to the world,
   - no tile shadow hex is directly hardcoded in any component.

---

## 6. Accessibility & Content Rules

- **Contrast.** Every themed token pair (room-bg ↔ room-ink, tile-paper ↔ ink, ticker-red ↔ paper) is validated at WCAG AA 4.5:1. Test with the `<DemographicSwitcher />` before shipping a skin.
- **Motion.** Respect `prefers-reduced-motion`. The `<Tile />` flip collapses to a 150 ms opacity crossfade. The news ticker pauses. The strike indicator skips the spring and hard-cuts.
- **Capitals.** The ticker is **always** uppercase. Questions on the header are sentence case. Tile answers are title case (normalized at the data layer, not CSS, because `text-transform` breaks screen readers).
- **Emoji.** Banned in gameplay UI. Only allowed in the post-game Wordle-style share grid.

---

## 7. File Map

```
src/
  app/
    globals.css                 # tokens, scanlines, marquee, demographic overrides
    layout.tsx                  # loads font-blocks (Silkscreen) + font-base (Inter)
    page.tsx                    # the design-system showcase
  lib/
    design-system/
      tokens.ts                 # typed mirror of globals.css tokens
      demographics.ts           # the four DemographicSkin registry entries
  components/
    design-system/
      tv-frame.tsx              # <TVFrame /> + <TVScreen />
      tile.tsx                  # <Tile />
      input-terminal.tsx        # <InputTerminal />
      strike-indicator.tsx      # <StrikeIndicator />
      news-ticker.tsx           # <NewsTicker />
      physical-button.tsx       # <PhysicalButton />
      swatch.tsx                # <Swatch />
      showcase-section.tsx      # <ShowcaseSection />
      demographic-switcher.tsx  # <DemographicSwitcher />  (client)
docs/
  design-system.md              # this file
  visual-guide.md               # component-level source of truth (unchanged)
```
