---
name: IN Academy
description: Centre de formation professionnelle certifiante — un registre feutré, chaleureux et crédible, porté par un réseau de formateurs experts.
colors:
  navy-deep: "#0f2340"
  navy-ink: "#0a1a30"
  navy-abyss: "#060f1e"
  teal-deep: "#2e7d84"
  teal-dark: "#1f5f65"
  teal-soft: "#3d9aa2"
  gold-warm: "#c4922a"
  gold-ember: "#a07520"
  gold-glow: "#d4a843"
  gold-pale: "#f0deb0"
  parchment: "#f2ede6"
  parchment-light: "#f8f5f0"
  parchment-deep: "#e4ddd3"
  cream: "#ede8e0"
  white: "#ffffff"
  ink: "#0d1a29"
  slate: "#3a4050"
  stone: "#6b7280"
  border-stone: "#d0c8bb"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(38px, 4.6vw, 60px)"
    fontWeight: 800
    lineHeight: 1.08
    letterSpacing: "-1px"
  headline:
    fontFamily: "Bricolage Grotesque, Helvetica Neue, Arial, sans-serif"
    fontSize: "clamp(30px, 3.5vw, 44px)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "normal"
  title:
    fontFamily: "Bricolage Grotesque, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Inter, Helvetica Neue, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.75
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, Courier New, monospace"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "2px"
rounded:
  xs: "8px"
  sm: "10px"
  md: "14px"
  lg: "20px"
  pill: "50px"
  full: "50%"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "40px"
  xl: "96px"
components:
  button-primary:
    backgroundColor: "linear-gradient(135deg, {colors.gold-glow}, {colors.gold-warm} 55%, {colors.gold-ember})"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "15px 34px"
  button-primary-hover:
    backgroundColor: "linear-gradient(135deg, {colors.gold-glow}, {colors.gold-warm})"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "15px 34px"
  button-outline:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy-deep}"
    rounded: "{rounded.pill}"
    padding: "15px 34px"
  button-outline-hover:
    backgroundColor: "{colors.white}"
    textColor: "{colors.navy-deep}"
    rounded: "{rounded.pill}"
    padding: "15px 34px"
  nav-pill:
    backgroundColor: "{colors.teal-deep}"
    rounded: "{rounded.pill}"
    padding: "6px 8px"
  input:
    backgroundColor: "{colors.parchment-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "11px 14px"
  input-focus:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "11px 14px"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: IN Academy

## Overview

**Creative North Star: "The Trade Guild"**

IN Academy isn't a faceless training platform — it's a guild of named, credible experts, and the design carries that: warm, feutré (felted, muted) surfaces in navy and parchment, with gold used sparingly as a seal of validation rather than decoration. Nothing about the system reaches for cold institutional formality; it reaches for the confidence of a well-kept ledger — precise, a little worn-in, trustworthy.

The signature gesture is the floating header: a translucent parchment-glass bar (`backdrop-filter: blur(24px)`) with a solid teal pill nested inside it holding the navigation. That teal pill is the guild's seal — a distinct, saturated shape floating on a soft, blurred ground. The rest of the system stays quiet around it: navy carries authority in headings, gold marks the one action that matters per view, and warm-tinted shadows (never pure black) keep every surface feeling lit from within rather than cut out with hard edges.

**Key Characteristics:**
- Warm neutral ground (parchment/beige), never stark white or cold gray, as the resting surface.
- Navy for authority (headings, primary text, footer), gold for validation (the one primary action), teal for wayfinding (the nav pill, links, secondary accents).
- Pill shape (`50px`/`50%` radius) owns every clickable chrome element — buttons, nav, avatars, badges; soft rectangular radii (`14–20px`) own content containers — cards, modals, dropdowns.
- Shadows are warm-tinted glows (navy or gold rgba, 5–13% opacity), not structural drop shadows.
- Mono uppercase labels (`IBM Plex Mono`, wide letter-spacing) mark every eyebrow/section-label — the one place the system speaks in a technical register.

## Colors

The palette reads as an old ledger bound in navy leather with a gold seal — warm parchment for the pages, teal as the one saturated accent that isn't gold.

### Primary
- **Navy Deep** (`#0f2340`): headings, primary body text on light surfaces, the base for the darkest UI chrome (mobile drawer buttons, KPI tiles).
- **Navy Ink** (`#0a1a30`): footer background, deep hover states.
- **Navy Abyss** (`#060f1e`): the darkest chrome — page overlays, deepest gradient stop, admin sidebar depth.

### Secondary
- **Teal Deep** (`#2e7d84`): the nav-pill seal, links, focus accents on dark surfaces — the system's wayfinding color.
- **Teal Dark** (`#1f5f65`): hover/active state for teal elements, active nav-link text on white.
- **Teal Soft** (`#3d9aa2`): lighter teal accent, used sparingly for tertiary emphasis.

### Tertiary
- **Gold Warm** (`#c4922a`): the primary CTA color — reserved for the one action per view that should win. Never used decoratively.
- **Gold Ember** (`#a07520`): the deep stop in every gold gradient, hover darkening.
- **Gold Glow** (`#d4a843`): the light stop in every gold gradient, gives buttons their lit-from-within warmth.
- **Gold Pale** (`#f0deb0`): tint fills for badges and soft highlight backgrounds — never text.

### Neutral
- **Parchment** (`#f2ede6`): the default page background.
- **Parchment Light** (`#f8f5f0`): input backgrounds, card-on-parchment surfaces, alternating section bands.
- **Parchment Deep** (`#e4ddd3`): borders and dividers on parchment.
- **Cream** (`#ede8e0`): a slightly warmer neutral used interchangeably with Parchment Deep for texture variation.
- **White** (`#ffffff`): card and modal surfaces, primary button text.
- **Ink** (`#0d1a29`): the darkest body text.
- **Slate** (`#3a4050`): standard paragraph/body text.
- **Stone** (`#6b7280`): muted/secondary text — timestamps, hints, captions.
- **Border Stone** (`#d0c8bb`): the default hairline border on parchment surfaces.

### Named Rules
**The One Gold Rule.** Gold marks exactly one primary action per view. If a screen already has a gold button, every other action is Navy Outline or plain text — never a second gold surface competing for the same attention.

**The Warm Shadow Rule.** No shadow is ever a neutral or pure-black `rgba(0,0,0,…)`. Every shadow ties back to Navy Abyss or Gold Warm at low opacity (5–13%), so depth always reads as this system's light, not a generic one.

## Typography

**Display Font:** Bricolage Grotesque (with Helvetica Neue, Arial fallback)
**Body Font:** Inter (with Helvetica Neue, Arial fallback)
**Label/Mono Font:** IBM Plex Mono (with Courier New fallback)

**Character:** Bricolage Grotesque is a geometric grotesque with just enough personality in its curves to feel crafted rather than templated — it carries every headline at heavy weight (700–800) so authority never has to come from size alone. Inter stays quiet and highly legible for the reading experience. IBM Plex Mono is reserved entirely for the system's "technical" register — eyebrows, nav labels, badges, timestamps — so a switch to mono anywhere in the UI always signals "this is a label, not prose."

### Hierarchy
- **Display** (800, `clamp(38px, 4.6vw, 60px)`, 1.08): hero titles only — the homepage hero slider, page-hero headlines.
- **Headline** (700–800, `clamp(30px, 3.5vw, 44px)`, 1.15): section titles (`Nos Missions`, `Nos Formations`, etc.), always paired with a gold or blue-gradient accent span on the emphasized word.
- **Title** (700, 16px, 1.3): card and component titles — dashboard cards, partner cards, event cards, admin table primary cells.
- **Body** (300–400, 16px, 1.75): paragraph copy. Weight 300 for hero/page-hero subtitles (a lighter, more editorial touch at large size); weight 400 for standard section descriptions. Comfortable line length, generally capped `460–560px` in its container rather than a strict character count.
- **Label** (500, 10–12px, 1.2–3px letter-spacing, uppercase): eyebrows (`section-eyebrow`, gold), nav links (mono, uppercase, wide tracking), badges, timestamps.

### Named Rules
**The Mono-Means-Label Rule.** IBM Plex Mono never appears in paragraph copy or headings — only in short, uppercase, letter-spaced fragments. It is the system's tell for "this text is UI chrome, not content."

## Layout

Content sits in a `1200px` max-width container with `40px` horizontal padding (`--container-width`, `--container-padding`), centered. Sections use a generous `96px` vertical rhythm (`--section-padding`) — the system breathes; it does not stack content densely. Component-internal spacing steps roughly `8px → 16px → 24px → 40px`, with `24px` as the default card padding.

The header is `position: fixed`, floating above content with a translucent `blur(24px)` parchment glass background rather than a solid bar — page content scrolls beneath it, not away from it. Below `900px` the layout collapses hero/choice grids to a single column and swaps the desktop nav pill for a full-height off-canvas drawer (`fixed`, slides in from the right, parchment-light background, teal/gold nav states preserved).

## Elevation & Depth

Depth in this system is an **ambient glow**, not a structural stack. Shadows are soft, wide, and low-opacity (`0 8–48px` blur, `5–22%` alpha), always warm-tinted toward Navy Abyss or Gold Warm — they suggest a surface is gently lit, not that it's physically resting on another layer. The one place the system leans structural is transient overlays (dropdowns, profile menus, modals), which carry a heavier, tighter shadow (`0 16–28px`, `18–25%` alpha) to read as clearly "above" the page — but even there, the color stays warm-tinted, never neutral black.

The header's glass blur is the clearest expression of this: rather than a hard-edged bar with a shadow beneath it, it's a soft, blurred threshold the page scrolls through.

### Shadow Vocabulary
- **Ambient Small** (`0 2px 8px rgba(10, 26, 48, 0.07)`): resting-state cards, subtle lift on static elements.
- **Ambient Medium** (`0 8px 24px rgba(10, 26, 48, 0.10)`): hover state for outline buttons, medium-emphasis surfaces.
- **Ambient Large** (`0 20px 48px rgba(10, 26, 48, 0.13)`): hero visuals, large feature panels.
- **Card Warmth** (`0 4px 20px rgba(196, 146, 42, 0.07), 0 1px 3px rgba(10, 26, 48, 0.05)`): the default card shadow — a whisper of gold under the navy base.
- **Gold Glow** (`0 4px 20px rgba(196, 146, 42, 0.30)`): under primary gold buttons — the shadow that makes gold read as "lit" rather than flat.
- **Overlay** (`0 16px 40px rgba(0, 0, 0, 0.25)` to `0 28px 80px rgba(15, 35, 64, 0.22)`): dropdowns, profile menus, admin modals — the system's one genuinely structural shadow family.

### Named Rules
**The Glow-Not-Stack Rule.** Reach for a wider, softer, warm-tinted shadow before reaching for a darker or tighter one. Depth here is atmosphere, not architecture.

## Shapes

Two radius families, applied by role rather than by component type:

- **Pill (`50px`) and Circle (`50%`)** — every clickable piece of chrome: buttons, nav links, nav pill container, avatars, badge dots, dot indicators, toggle icons. If it's an action or an identity marker, it's round.
- **Soft rectangle (`8–20px`, scaling with surface size)** — every content container: `8–10px` for inputs and small icon tiles, `14px` for dropdowns and choice cards, `16px` for data/dashboard cards, `20px` for modals and auth cards, up to `22px` for large hero image frames.

Borders are thin (`1–1.5px`) and low-contrast (`Border Stone` or `rgba(15,35,64,0.16–0.18)`) — they mark an edge without competing with the shadow-driven depth.

## Components

### Buttons
- **Shape:** full pill (`50px` radius) — no exceptions across the system.
- **Primary:** gold gradient (`135deg`, Gold Glow → Gold Warm 55% → Gold Ember), white text, no border, `Gold Glow` shadow. `15px 34px` padding.
- **Outline:** white background, Navy Deep text, `1.5px` low-contrast navy border, `Ambient Small` shadow.
- **Hover / Focus (tactile and engaging):** both variants lift `translateY(-2px)` and deepen their shadow (`Gold Glow` → a stronger gold glow for primary; `Ambient Small` → `Ambient Medium` for outline). The lift is the system's signature micro-interaction — every primary click target should feel like it rises slightly to meet the cursor.
- **Gold variant on colored backgrounds** (e.g. `.btn--gold` in the collaborator CTA): same gradient, but hover swaps to solid `Gold Ember` rather than re-gradienting, for contrast against busier surrounding art.

### Cards / Containers
- **Corner Style:** `14–20px` depending on size (see Shapes).
- **Background:** White, occasionally Parchment Light for cards embedded in an already-white section.
- **Shadow Strategy:** `Card Warmth` at rest; status/type is carried by a `4px` left border accent (e.g. dashboard enrollment cards: teal for confirmed, gold for pending) rather than by changing the shadow.
- **Border:** `1px solid Border Stone` on data cards; borderless on marketing cards where the shadow alone carries the edge.
- **Internal Padding:** `24px` standard.

### Inputs / Fields
- **Style:** Parchment Light background, `1.5px Parchment Deep` border, `10px` radius, `11px 14px` padding.
- **Focus:** border shifts to Gold Warm, background lightens to White, and a soft `3px` gold glow ring appears (`0 0 0 3px rgba(196, 146, 42, 0.12)`) — the same "lit from within" language as button hover.
- **Error:** border shifts to a clear red (`#e74c3c`), the only place the palette departs from navy/gold/teal/parchment.

### Navigation
- **Style:** desktop nav lives inside a solid Teal Deep pill nested in the translucent glass header — mono, uppercase, `12px`, `1.2px` letter-spacing, `75%`-opacity white text at rest, full white on hover/active. The active link inverts to a white pill with Teal Dark text.
- **Mobile:** the pill collapses; a full-height off-canvas drawer (Parchment Light, slides from the right) takes over, with the same nav labels in Navy at larger size and Gold Dark for the active state.
- **Sub-navigation:** dropdown panels (e.g. "Nos Formations") are white, `14px` radius, `0 20px 45px rgba(10,22,44,0.18)` shadow — Overlay-family depth, not Ambient.

### Nav Pill (signature component)
The teal pill nested inside the blurred glass header is this system's one unmistakable signature: a saturated, opaque shape floating on a translucent, blurred ground. It should not be reused for anything other than primary navigation — its rarity is what makes the header instantly recognizable as IN Academy's.

## Do's and Don'ts

### Do:
- **Do** keep gold to one primary action per view (see The One Gold Rule).
- **Do** tint every shadow toward Navy Abyss or Gold Warm — never a neutral black.
- **Do** use the pill radius for anything clickable and a soft rectangle radius for anything that contains content.
- **Do** reserve IBM Plex Mono for short, uppercase, letter-spaced labels — never for paragraph copy.
- **Do** lift primary and outline buttons on hover (`translateY(-2px)` + deepened shadow) — the tactile response is load-bearing for this system's warmth.
- **Do** show named, real trainer/expert profiles wherever the design references credibility — the guild is made of named people, not generic icons.

### Don't:
- **Don't** introduce a cold gray or pure-white resting background — Parchment/Beige is the ground this system stands on.
- **Don't** use a second saturated accent (teal or gold) competing with an existing primary action on the same view.
- **Don't** give cards or modals a hard, high-contrast drop shadow — depth here is a glow, not a stack (see The Glow-Not-Stack Rule).
- **Don't** fabricate testimonials, client logos, or accreditations beyond the confirmed Ministère algérien de la Formation professionnelle recognition — this is a product-truth constraint from PRODUCT.md that the visual system must not visually imply beyond.
- **Don't** square off the nav pill, buttons, or avatars — pill/circle shape is this system's clearest signature and squaring it off reads as a different brand.
