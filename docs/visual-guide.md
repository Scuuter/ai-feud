# Visual & UI Guide: Survey Says MVP (Y2K Vice City TV)

**CONTEXT FOR AGENTS:** This document outlines the strict constraints for the "Survey Says: AI Feud" MVP. You must implement this using Next.js (App Router), Tailwind CSS, and Framer Motion. DO NOT use external component libraries. All logic must be React Server Components where possible, pushing `"use client"` only to interactive leaf nodes.

## 01. Global Aesthetic Directives
* **Theme:** Y2K Broadcast Brutalism meets Vice City.
* **Styling Rules:** Heavy use of hard, unblurred drop shadows (`shadow-[4px_4px_0px_rgba(0,0,0,1)]`). Thick, solid black borders (`border-4 border-black`) around all interactive elements.
* **Vibe:** Loud, slightly obnoxious TV presentation containing highly sterile, hallucinatory AI text.
* **Responsive Paradigm:** The "TV" is a physical object placed in a room, not the entire browser window. The TV maintains a fixed aspect ratio (e.g., 4:3 or similar CRT proportions) centered in the viewport, surrounded by a distinct background color.

## 02. Design Tokens
**A. Typography (Strict 80/20 Rule)**
* **Display Font (20%):** `font-blocks` ("Blocks" by Sam Horne).
  * *Usage:* Game Title ("AI FEUD"), Big Numbers (Scores, Strikes), the "LIVE" icon, `<InputTerminal />` cursor block.
* **Base Font (80%):** Standard, highly legible, "boring" Broadcast Sans (Helvetica, Arial, or standard system sans-serif).
  * *Usage:* The survey questions, revealed answers inside the `<Tile />`, text inside the `<InputTerminal />`, Persona Names, and Flavor Quotes.
* **Ticker Usage:** The news runner line uses this base font strictly in UPPERCASE and BOLD to mimic 2000s news broadcast tickers.

**B. Color Palette (Vice City TV)**
* **Backgrounds:**
  * `bg-vice-pink`: `#FFC0CB` (Base page viewport background outside the TV).
  * `bg-tv-silver`: `#C0C0C0` (The CSS-rendered TV bezel/casing).
  * `bg-tv-static`: Off-white `#F5F5F5` with a subtle CSS scanline pattern or repeating linear gradient (Inner TV screen playable area).
* **Accents & Shadows:**
  * `color-vice-blue`: `#00FFFF` (Cyan/Light Blue - used for hard drop shadows on elements inside the TV, or active terminal borders).
  * `color-alert-red`: `#FF0000` (Used strictly for the "LIVE" dot and `<StrikeIndicator />` complete miss backgrounds).
  * `color-wildcard-yellow`: `#FFD700` (Used for Wildcard hit backgrounds).
* **Neutrals:**
  * `color-black`: `#000000` (All borders, primary text, and unrevealed tiles).
  * `color-white`: `#FFFFFF` (Tile text, input text background).

## 03. Structural Layout & Responsive Strategy
* **The Viewport:** The `<body>` or `<main>` wrapper is fully filled with `bg-vice-pink`.
* **The TV Container:** Placed centrally within the viewport. Built entirely with CSS/Tailwind (no image assets). Uses `bg-tv-silver`, heavy inner shadows (`shadow-inner`), and rounded outer corners (`rounded-3xl`) with square inner screen corners. Aspect ratio utilizes `aspect-[4/3]` or `aspect-video` with a `max-w-5xl` constraint so it never stretches awkwardly on wide desktop monitors.
* **The Screen Grid:** The inner `<Board />` uses a standard CSS Grid (`grid-cols-2` or `grid-cols-4`).
* **The Header:** Contains "SINGLE PLAYER" (Base Font), "AI FEUD" (Display Font, Cyan shadow), and "-STRIKE 0" (Display Font).
* **The Footer Ticker:** A persistent bottom bar inside the TV screen (`w-full overflow-hidden bg-alert-red text-white flex items-center`).

## 04. Component Specifications & Agent Instructions

**Tailwind Configuration Directives:**
Before building components, you must explicitly output or rely on the exact `theme.extend.colors` and `theme.extend.fontFamily` objects matching the Hex codes and fonts provided above. Use these custom theme classes in all components.

**Framer Motion Directives:**
For Framer Motion animations, avoid floaty or slow transitions. Use snappy spring physics (e.g., `type: "spring", stiffness: 300, damping: 20`) to match the harsh, fast-paced Brutalist aesthetic.

**A. `<Tile />`**
* **Props Signature:** Assume `<Tile />` receives: `{ text: string, score: number, isRevealed: boolean, flavorQuote?: string }`.
* **Unrevealed State:** `bg-black border-4 border-black`. Contains a giant Cyan question mark `?` using `font-blocks`.
* **Revealed State:** Uses Framer Motion to execute a 3D flip on the Y-axis. Post-flip: `bg-white border-4 border-black text-black`. Hard drop shadow (`shadow-[4px_4px_0px_#00FFFF]`).
* **Content:** Text is strictly `font-base`. Use dynamic CSS scaling (e.g., standard `cqi` container queries or a text-fit wrapper) so longer AI answers gracefully reduce in font size to fill the exact dimensions of the tile without breaking the layout. 
* **Flavor Quote Integration:** When revealed, explicitly display the `flavorQuote` (if present) formatted below the main answer text using a slightly smaller, italicized variant of the `font-base`.

**B. `<InputTerminal />`**
* **Styling:** A wide, chunky box at the bottom of the playable TV screen (just above the ticker). `bg-white border-4 border-black`.
* **Typography:** The user's typed guess is rendered in `font-base`, Uppercase.
* **Interaction:** Focus state changes the border to `border-vice-blue`. The cursor is a blinking solid block `█` rendered in `color-vice-blue`. Clears instantly on "Enter".

**C. `<StrikeIndicator />`**
* **State 1 (Complete Miss):** A giant, screen-filling "X" (using `font-blocks`) overlays the inner TV screen. Framer Motion rapid scale-up and fade-out (duration: 0.4s). `text-alert-red` with a heavy black outline.
* **State 2 (Wildcard Hit):** A chunky, broadcast-interruption style alert box centered on the screen (`bg-wildcard-yellow border-4 border-black shadow-[8px_8px_0px_#000]`). Displays the AI Persona Name heavily bolded, followed by their specific FlavorQuote using `font-base`. Framer Motion hard snap into view, lingering, then sliding out downwards.

**D. `<NewsTicker />`**
* **Styling:** `bg-alert-red` strip at the absolute bottom of the TV casing. Text is `text-white font-base font-bold uppercase whitespace-nowrap`.
* **Animation:** Standard CSS infinite linear translation (`animate-marquee`).

**E. Auxiliary Controls & Menus (The Hybrid OSD Approach)**
* **Physical Buttons:** Auxiliary controls (Mute, Share Score, Settings) must NOT float in the pink viewport. They must be designed as chunky, physical CSS-rendered buttons located on the outer `bg-tv-silver` casing (e.g., along the bottom or right-side bezel). They must use `shadow-inner` and dark borders to look like tactile hardware switches.
* **OSD Menu:** When these physical buttons are clicked, they open an On-Screen Display (OSD) menu *inside* the inner playable TV screen. The OSD overlays the game board using a semi-transparent black background (`bg-black/80`). The menu content should use a highly rigid grid, blocky retro typography (`font-base` uppercase or `font-blocks`), and bright green or white text, mimicking a retro VCR/TV hardware setup menu.

---

**ACTION REQUIRED:**
Read this design system carefully. Do not generate any code yet. Reply with "SYSTEM ACKNOWLEDGED" and provide a brief bulleted summary of the core Tailwind rules, typography scales, and structural layout you will be enforcing. Wait for my command to build the first component.
