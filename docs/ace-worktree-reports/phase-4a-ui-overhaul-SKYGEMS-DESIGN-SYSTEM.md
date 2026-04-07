# SkyGems Design System

**Version:** 1.0.0
**Date:** 2026-04-06
**Status:** Canonical design specification. All frontend work must follow this document.

---

## 1. Visual Theme & Atmosphere

### Philosophy

**"Precious minimalism."** The interface recedes so the jewelry speaks. Every surface, every interaction, every transition serves one purpose: making the user's design feel valuable.

SkyGems is a premium jewelry design studio, not a SaaS dashboard. The visual language draws from:
- **High-end jewelry retail** — dark velvet display cases, spotlit pieces, gold fixtures
- **Premium creative tools** (OpenArt, Midjourney) — image-first, generous space, confident hierarchy
- **Automotive luxury** (BMW, Porsche configurators) — dark surfaces, restrained chrome, product-as-hero

### Density

**Low density, high signal.** Fewer elements per screen, each given generous breathing room. White space is a luxury signal. If a screen feels cluttered, remove elements before adjusting spacing.

### Mood keywords

Dark. Warm. Confident. Editorial. Precious. Restrained. Cinematic.

### Anti-mood keywords

Busy. Corporate. Playful. Neon. Flat. Generic. Dashboard-like.

---

## 2. Color Palette & Roles

### Backgrounds (dark-first hierarchy)

| Token | Hex | Role |
|---|---|---|
| `--bg-primary` | `#0A0A0A` | Page background. Deepest surface. |
| `--bg-secondary` | `#111111` | Nav bar, header areas. Slightly elevated. |
| `--bg-tertiary` | `#1A1A1A` | Cards, panels, content containers. |
| `--bg-elevated` | `#222222` | Hover states, active panels, popovers. |
| `--bg-hover` | `#2A2A2A` | Interactive element hover fill. |

### Accent (gold — the ONLY chromatic accent)

| Token | Hex | Role |
|---|---|---|
| `--accent-gold` | `#D4AF37` | Primary accent. CTAs, active states, selected indicators, progress fills. |
| `--accent-gold-muted` | `#B8941F` | Hover/pressed state of gold elements. |
| `--accent-gold-light` | `#F5DEB3` | Light gold for text highlights, subtle emphasis. |
| `--accent-gold-glow` | `rgba(212,175,55,0.15)` | Background glow behind gold elements. Subtle warmth. |

**Rule: Gold is the ONLY chromatic color in the UI.** No purple. No blue gradients. No teal. No orange. Status colors (below) are the sole exception and are used sparingly for functional feedback only.

### Text

| Token | Hex | Role |
|---|---|---|
| `--text-primary` | `#E5E5E5` | Body text, headings. Warm off-white, not pure white. |
| `--text-secondary` | `#999999` | Captions, labels, breadcrumbs, metadata. |
| `--text-muted` | `#666666` | Placeholders, disabled text, tertiary info. |
| `--text-inverse` | `#0A0A0A` | Text on gold backgrounds (buttons, badges). |

### Borders

| Token | Value | Role |
|---|---|---|
| `--border-default` | `rgba(255,255,255,0.06)` | Default card/container borders. Barely visible. |
| `--border-hover` | `rgba(255,255,255,0.12)` | Hover state border brightening. |
| `--border-active` | `rgba(255,255,255,0.20)` | Active/focus state. |
| `--border-gold` | `rgba(212,175,55,0.3)` | Gold selection ring, active pipeline stage. |

### Status (functional only — never decorative)

| Token | Hex | Role |
|---|---|---|
| `--status-success` | `#4CAF50` | Ready, completed, available. |
| `--status-warning` | `#FF9800` | Stale, needs attention, risk flag (amber). |
| `--status-error` | `#EF5350` | Failed, blocking, critical risk flag. |
| `--status-info` | `#64B5F6` | Processing, informational, info risk flag. |

### Color rules

1. **Never use pure black (`#000000`) or pure white (`#FFFFFF`)** for backgrounds or text. Always use the warm variants above.
2. **Gold is the hero.** It marks what matters: CTAs, selected states, active indicators, progress.
3. **Status colors appear only in status contexts** (pills, banners, risk flags). Never as decorative accents.
4. **No gradients** on interactive elements. Solid gold or solid dark. The exception: subtle page-level decorative glows using `--accent-gold-glow`.
5. **Dark mode is the only mode.** There is no light mode toggle. The entire brand is built on dark luxury.

---

## 3. Typography Rules

### Font families

| Role | Family | Fallback | Usage |
|---|---|---|---|
| **Display** | `Playfair Display` | `Georgia, serif` | Page headings (h1, h2), hero text, marketing headlines. The luxury voice. |
| **Body/UI** | `Inter` | `system-ui, -apple-system, sans-serif` | Everything else: body text, labels, buttons, inputs, navigation, captions. The functional voice. |

### Type scale

| Level | Size | Weight | Line height | Letter spacing | Font | Usage |
|---|---|---|---|---|---|---|
| **Display XL** | `48px` | 600 | 1.1 | `-0.5px` | Playfair Display | Landing page hero only |
| **Display** | `32px` | 600 | 1.2 | `-0.3px` | Playfair Display | Page headings ("Your Studio", "Gallery") |
| **Heading** | `24px` | 600 | 1.3 | `-0.2px` | Playfair Display | Section headings, workspace design name |
| **Subheading** | `18px` | 500 | 1.4 | `0` | Inter | Sub-section headers, card titles |
| **Body** | `16px` | 400 | 1.5 | `0` | Inter | Default body text, descriptions |
| **Body Small** | `14px` | 400 | 1.5 | `0` | Inter | Secondary descriptions, metadata values |
| **Caption** | `12px` | 500 | 1.4 | `0.2px` | Inter | Labels, timestamps, badges, status text |
| **Overline** | `11px` | 600 | 1.2 | `1.5px` | Inter | Section labels, eyebrow text. UPPERCASE. |

### Typography rules

1. **Playfair Display is for display only.** Never use it below 24px. Never use it for body text, labels, or UI controls.
2. **Negative letter-spacing at display sizes** creates premium density. At 48px: `-0.5px`. At 32px: `-0.3px`.
3. **Positive letter-spacing on overlines** (all-caps labels) improves readability and creates luxury signaling.
4. **Inter weight 400 is the default.** Use 500 for emphasis (subheadings, active states). Use 600 sparingly (buttons, strong labels).
5. **Never use weight 700+ for Inter.** It looks heavy and breaks the refined feel.
6. **Line height is generous** at body sizes (1.5) to create breathing room. Tighter at display sizes (1.1-1.2) for impact.

---

## 4. Component Stylings

### Buttons

**Primary (Gold CTA)**
```
Background: var(--accent-gold)
Text: var(--text-inverse)
Font: Inter 500, 14px
Padding: 12px 24px
Border-radius: 8px
Hover: background var(--accent-gold-muted)
Press: scale(0.98), duration 100ms
Disabled: opacity 0.4, cursor not-allowed
```

**Secondary (Ghost)**
```
Background: transparent
Text: var(--text-primary)
Border: 1px solid var(--border-default)
Padding: 12px 24px
Border-radius: 8px
Hover: border-color var(--border-hover), background var(--bg-hover)
```

**Tertiary (Text)**
```
Background: transparent
Text: var(--text-secondary)
Padding: 8px 16px
Hover: text var(--text-primary)
No border, no background change
```

**Button rules:**
- Only ONE gold CTA per visible screen area. If there are two CTAs, one must be secondary.
- Minimum touch target: 44px height.
- Icon + text buttons: 8px gap, icon 16px size.

### Cards

**Standard card**
```
Background: var(--bg-tertiary)
Border: 1px solid var(--border-default)
Border-radius: 16px
Padding: 24px
Hover: border-color var(--border-hover)
Transition: border-color 250ms ease-out
```

**Selected card**
```
Border: 1px solid transparent
Box-shadow: 0 0 0 2px var(--border-gold)
```

**Image card (Gallery, Pair)**
```
Border-radius: 16px
Overflow: hidden
Hover: image scale(1.03), transition 400ms ease-out
Hover overlay: linear-gradient(transparent 40%, rgba(10,10,10,0.8) 100%)
```

### Inputs

```
Background: var(--bg-elevated)
Border: 1px solid var(--border-default)
Border-radius: 8px
Padding: 12px 16px
Font: Inter 400, 16px
Color: var(--text-primary)
Placeholder: var(--text-muted)
Focus: border-color var(--accent-gold), box-shadow 0 0 0 2px var(--accent-gold-glow)
```

### Navigation (Top Bar)

```
Background: var(--bg-secondary)
Border-bottom: 1px solid var(--border-default)
Height: 56px
Padding: 0 24px
Position: fixed, top, full width
Z-index: 50
```

Nav links:
```
Font: Inter 500, 14px
Color: var(--text-secondary)
Hover: var(--text-primary)
Active: var(--accent-gold)
Underline indicator: 2px solid var(--accent-gold), bottom-aligned
Transition: color 150ms
```

### Badges / Status Pills

```
Font: Inter 500, 12px (Caption level)
Padding: 4px 10px
Border-radius: 9999px (pill)
```

| Status | Background | Text |
|---|---|---|
| Ready | `rgba(76,175,80,0.15)` | `#4CAF50` |
| Processing | `rgba(100,181,246,0.15)` | `#64B5F6` |
| Warning/Stale | `rgba(255,152,0,0.15)` | `#FF9800` |
| Error/Failed | `rgba(239,83,80,0.15)` | `#EF5350` |
| Neutral | `rgba(255,255,255,0.06)` | `var(--text-secondary)` |

Processing pills have a pulse animation (opacity 0.6 → 1.0, 1.5s infinite).

### Drawers / Sheets

```
Background: var(--bg-secondary)
Border-left: 1px solid var(--border-default)
Width: 420px (from right)
Entrance: translateX(100%) → translateX(0), 300ms ease-out
Overlay: rgba(0,0,0,0.5) with backdrop-filter blur(4px)
```

### Skeleton loaders

```
Background: var(--bg-elevated)
Border-radius: matches target component
Animation: shimmer — background linear-gradient sweep, 1.5s infinite
Shimmer highlight: rgba(255,255,255,0.04)
```

---

## 5. Layout Principles

### Spacing scale

Base unit: **4px**

| Token | Value | Usage |
|---|---|---|
| `--space-1` | `4px` | Icon gaps, tight internal padding |
| `--space-2` | `8px` | Badge padding, small gaps |
| `--space-3` | `12px` | Input padding, compact card padding |
| `--space-4` | `16px` | Standard card padding, list item gaps |
| `--space-5` | `20px` | Section gaps within a card |
| `--space-6` | `24px` | Standard card padding (large), column gaps |
| `--space-8` | `32px` | Section margins, major gaps |
| `--space-10` | `40px` | Page section spacing |
| `--space-12` | `48px` | Hero padding, major section breaks |
| `--space-16` | `64px` | Landing page section spacing |
| `--space-20` | `80px` | Major landing page gaps |
| `--space-24` | `96px` | Top-level page vertical padding |

### Grid

| Context | Grid | Max width |
|---|---|---|
| Landing page | Single column centered | `1200px` |
| Home (Projects) | Auto-fill grid, `min 320px` | `1200px` |
| Create page | Two-column: `400px` fixed left + `1fr` right | `1200px` |
| Results page | Centered single pair | `960px` |
| Workspace | Full width hero + centered content below | `1200px` |
| Gallery | Auto-fill grid, `min 280px` | `1400px` |

### Content width

```
--content-width-narrow: 960px    /* Results, focused content */
--content-width-standard: 1200px /* Most pages */
--content-width-wide: 1400px     /* Gallery */
```

All content containers are horizontally centered with `margin: 0 auto` and `padding: 0 24px`.

### Layout rules

1. **Top nav is always 56px fixed.** Content starts below with `padding-top: 56px`.
2. **No sidebar in the app.** The sidebar is an enterprise pattern. Creative tools use full-width layouts with contextual toolbars.
3. **Generous vertical spacing between sections.** Minimum 32px between distinct sections. 48px or more for major breaks.
4. **Cards have minimum 24px padding.** Tight cards (less than 16px padding) feel cheap.
5. **Image containers use aspect-ratio.** Never stretch or squish images. Pairs: `aspect-ratio: 4/3`. Gallery thumbs: `aspect-ratio: 1/1` or `4/5`.
6. **Full-bleed hero images** in Workspace — let the pair viewer touch the content edges.

---

## 6. Depth & Elevation

### Shadow system

| Level | Shadow | Usage |
|---|---|---|
| **Level 0** | None | Page background, flat surfaces |
| **Level 1** | `0 1px 2px rgba(0,0,0,0.3)` | Subtle card lift (optional, most cards don't need it) |
| **Level 2** | `0 4px 16px rgba(0,0,0,0.4)` | Popovers, dropdowns |
| **Level 3** | `0 8px 32px rgba(0,0,0,0.5)` | Modals, drawers |
| **Gold glow** | `0 0 0 2px rgba(212,175,55,0.3)` | Selected cards, active focus rings |
| **Gold ambient** | `0 0 40px rgba(212,175,55,0.08)` | Decorative glow behind hero elements |

### Elevation philosophy

**Elevation through color, not shadows.** In a dark UI, subtle background color steps (0A → 11 → 1A → 22) create elevation more effectively than shadows. Shadows are reserved for overlays (drawers, modals, popovers) that float above the page.

The exception is the **gold glow** — used as a selection/focus ring to make the user's choice feel precious.

### Surface hierarchy

```
Level 0: --bg-primary (#0A0A0A)    ← Page background
Level 1: --bg-secondary (#111111)   ← Nav, header
Level 2: --bg-tertiary (#1A1A1A)    ← Cards, panels
Level 3: --bg-elevated (#222222)    ← Inputs, hover states, active panels
Level 4: --bg-hover (#2A2A2A)      ← Interactive hover fills
Overlay: rgba(0,0,0,0.5)           ← Behind drawers/modals
```

---

## 7. Motion & Animation

### Duration tokens

| Token | Value | Usage |
|---|---|---|
| `--duration-instant` | `100ms` | Button press feedback, micro-interactions |
| `--duration-fast` | `150ms` | Hover state changes, color transitions |
| `--duration-normal` | `250ms` | Standard transitions, card hover |
| `--duration-slow` | `400ms` | Entrance animations, page transitions |
| `--duration-emphasis` | `600ms` | Pair unveiling, celebration moments |

### Easing tokens

| Token | Value | Usage |
|---|---|---|
| `--ease-out` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | Most transitions (things settling) |
| `--ease-in-out` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Symmetrical movements |
| `--ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Selection bounce, picker feedback |

### Motion patterns

**Card hover**
```
transform: scale(1.005)
border-color: var(--border-hover)
transition: all var(--duration-normal) var(--ease-out)
```

**Image hover (within card)**
```
transform: scale(1.03)
transition: transform var(--duration-slow) var(--ease-out)
Container: overflow hidden, border-radius inherited
```

**Button press**
```
transform: scale(0.98)
transition: transform var(--duration-instant)
```

**Entrance animation (cards appearing)**
```
from: opacity 0, translateY(12px)
to: opacity 1, translateY(0)
duration: var(--duration-slow)
easing: var(--ease-out)
Stagger: 50ms between items in a grid
```

**Pair unveiling (generation result arriving)**
```
from: opacity 0, translateY(20px), scale(0.98)
to: opacity 1, translateY(0), scale(1)
duration: var(--duration-emphasis)
easing: var(--ease-out)
```

**Skeleton shimmer**
```
background: linear-gradient(
  90deg,
  var(--bg-elevated) 0%,
  rgba(255,255,255,0.04) 50%,
  var(--bg-elevated) 100%
)
background-size: 200% 100%
animation: shimmer 1.5s infinite
```

**Processing pulse (status pills)**
```
animation: pulse 1.5s ease-in-out infinite
keyframes: opacity 0.6 → 1.0 → 0.6
```

**Drawer entrance**
```
from: translateX(100%)
to: translateX(0)
duration: 300ms
easing: var(--ease-out)
Overlay: opacity 0 → 0.5, same timing
```

### Motion rules

1. **Motion is for clarity, not decoration.** Every animation must answer: "What does this help the user understand?"
2. **Entrances: yes. Exits: fast or instant.** Users care about what's arriving, not what's leaving.
3. **Never animate layout shifts.** Cards should appear in place, not slide from off-screen.
4. **Stagger grid items** to create a sense of revealing a collection (50ms between items, max 8 items staggered).
5. **The pair unveiling is the signature moment.** It should feel like unveiling a jewelry piece — gentle, confident, reverent.
6. **Respect `prefers-reduced-motion`.** All animations should be disabled when the user has this preference set.

---

## 8. Do's and Don'ts

### DO

- **DO lead with the image.** On any screen that shows a design, the generated pair is the largest element.
- **DO use gold sparingly.** One gold CTA per screen area. Gold selection rings. Gold progress fills. That's it.
- **DO use generous whitespace.** When in doubt, add more space, not more content.
- **DO use Playfair Display for page headings.** It's the luxury differentiator. Inter alone feels generic.
- **DO show skeleton states.** Every data-dependent area should have a skeleton that preserves layout.
- **DO use product copy.** "Design your next piece" not "Configure parameters."
- **DO make the pipeline feel like progress.** Connected stages, gold indicators for completion, clear next-step.
- **DO use the overline pattern** (uppercase, 11px, letter-spacing 1.5px) for section labels and categories.
- **DO treat the Workspace hero viewer as sacred.** It's the emotional center of the product.

### DON'T

- **DON'T use a sidebar for navigation.** It creates enterprise dashboard energy.
- **DON'T use purple, blue, teal, or any non-gold chromatic color** as an accent. Status colors are the only exception.
- **DON'T use gradients on buttons or interactive elements.** Solid colors only.
- **DON'T pack multiple actions into card surfaces.** Cards have one primary action (click/select). Secondary actions appear on hover or in a detail view.
- **DON'T show developer-facing text in the UI.** No IDs, no status codes, no "placeholder" labels, no "when backend is wired" copy.
- **DON'T use light mode or light backgrounds.** The entire app is dark. Period.
- **DON'T use more than 3 levels of text hierarchy on a single screen.** Primary (heading) + secondary (body) + tertiary (caption) is enough.
- **DON'T use heavy borders.** Borders are atmospheric — `rgba(255,255,255,0.06)` — not structural. If a border is visible at arm's length, it's too heavy.
- **DON'T animate everything.** Static confidence is premium. Reserve animation for entrances, state changes, and the pair unveiling.
- **DON'T use toast notifications for success.** Success should be visible in the UI state change itself (gold ring appears, status pill changes). Toasts are for errors and warnings only.
- **DON'T use icons without labels** in primary navigation. Icons-only is ambiguous. Label every nav item.
- **DON'T make the create flow feel like a form.** It's a series of confident choices (pickers, not dropdowns). Each selection should feel decisive.

---

## 9. Responsive Behavior

### Breakpoints

| Name | Width | Layout change |
|---|---|---|
| `mobile` | `< 640px` | Single column, stacked pairs, collapsed nav |
| `tablet` | `640px – 1024px` | Two-column where possible, full nav |
| `desktop` | `> 1024px` | Full layout as designed |

### Mobile adaptations

| Screen | Desktop | Mobile |
|---|---|---|
| **Top nav** | Full bar with labels | Hamburger menu with slide-out panel |
| **Home** | 3-4 column project grid | Single column stack |
| **Create** | Two-column (config + preview) | Stacked: config above, preview below (collapsible) |
| **Results** | Side-by-side pair | Stacked: sketch above, render below |
| **Workspace** | Full-width hero pair | Stacked pair, pipeline as vertical list |
| **Gallery** | 3-4 column grid | 2-column grid |

### Touch targets

- Minimum touch target: **44px x 44px**
- Picker items: **56px minimum height**
- Buttons: **48px minimum height on mobile**

### Responsive rules

1. **Mobile is a first-class experience** but desktop is the primary design target (creative professionals work on large screens).
2. **Never hide critical actions** behind hover states on mobile. If it's only visible on hover, add a visible alternative for touch.
3. **Pairs always maintain their sketch-render grouping.** On mobile, they stack vertically but stay together.
4. **The pipeline rail goes vertical on mobile** (horizontal on desktop).

---

## 10. Agent Prompt Guide

Quick reference for AI agents generating SkyGems UI components.

### Color quick reference
```
Page background: #0A0A0A
Card background: #1A1A1A
Input background: #222222
Primary text: #E5E5E5
Secondary text: #999999
Gold accent: #D4AF37
Gold glow: rgba(212,175,55,0.15)
Gold ring: 0 0 0 2px rgba(212,175,55,0.3)
Border: rgba(255,255,255,0.06)
Border hover: rgba(255,255,255,0.12)
```

### Component generation prompts

**Card:**
"Dark card (#1A1A1A background) with subtle border (rgba 255,255,255,0.06), 16px border-radius, 24px padding. On hover: border brightens to rgba 255,255,255,0.12. When selected: gold ring (box-shadow 0 0 0 2px rgba 212,175,55,0.3). Content uses #E5E5E5 primary text, #999999 secondary text."

**Gold CTA button:**
"Solid gold button (#D4AF37 background, #0A0A0A text), Inter 500 14px, 12px 24px padding, 8px border-radius. Hover: darken to #B8941F. Press: scale(0.98). The only gold CTA on the visible screen."

**Image card with hover:**
"16px border-radius, overflow hidden. Image fills container with object-fit cover. On hover: image scales to 1.03 (400ms ease-out), gradient overlay appears from bottom (transparent to rgba(10,10,10,0.8)). Quick-action icons appear in overlay."

**Page heading:**
"Playfair Display 600, 32px, #E5E5E5, letter-spacing -0.3px, line-height 1.2. Below the heading: secondary text in Inter 400, 16px, #999999."

**Status pill:**
"Pill shape (border-radius 9999px), Inter 500 12px, 4px 10px padding. Background is status color at 15% opacity, text is status color at full. Processing status gets pulse animation."

**Skeleton:**
"Matches target component dimensions and border-radius. Background #222222 with shimmer animation (gradient sweep highlight at rgba(255,255,255,0.04), 1.5s infinite loop)."

### Layout prompts

**Create page:**
"Two-column layout: 400px fixed left panel (config), flexible right panel (preview). Left panel has vertical stack of picker components with 24px gaps. Right panel has centered prompt preview card. Gold 'Generate' button at bottom of left panel, full width."

**Results page:**
"Centered layout, max 960px. Large pair display: sketch on left, render on right, each in 4:3 aspect-ratio container with 16px border-radius. 24px gap between images. Status banner above. Select CTA below in gold."

**Workspace page:**
"Full-width hero pair viewer at top (generous height, sketch + render side by side). Below: centered content (1200px max) with design info, action bar, then horizontal pipeline rail showing 4 stages connected by a line. Each stage is a card that expands to show content."
