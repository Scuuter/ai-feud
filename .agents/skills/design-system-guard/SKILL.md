---
name: design-system-guard
description: Design system constraints — tokens, typography, animation physics, demographic skins, component contracts. Read before editing any UI component, CSS, or design-system file.
disable-model-invocation: true
---

# Design System Guard

Before editing UI components or styling, read the full design system specification.

## Required reading

Read `docs/design-system.md` — it is the canonical source of truth for the visual language.

## Key constraints to enforce

### Tokens
- **Never reference raw palette tokens** (e.g., `--color-vice-blue`) from components
- **Always use semantic tokens** (e.g., `--color-tile-shadow`) — this is how demographic skins reskin cleanly
- New demographic skins may only override the **6 sanctioned tokens** defined in §5.1

### Typography
- Only two font families: `font-blocks` (Silkscreen) and `font-base` (Inter)
- No other fonts. No exceptions.

### Shadows
- **Hard drop-shadows only** — `shadow-[Xpx_Ypx_0px_...]`
- **Never** use `shadow-md`, `shadow-lg`, or anything with blur. Soft shadows are banned.

### Motion
- Spring physics only: `stiffness: 300, damping: 20` default
- No easing curves longer than 400ms
- If it looks like a banking app, delete it

### Styling
- Tailwind CSS utility classes exclusively
- No `.css` or `.module.css` files (except `globals.css`)
- No inline `style={}` props
- Dynamic class merging via `clsx` + `tailwind-merge` only
