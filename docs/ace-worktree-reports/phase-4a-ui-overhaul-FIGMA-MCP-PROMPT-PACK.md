# Figma MCP Prompt Pack — SkyGems Redesign

**Date:** 2026-04-06
**Purpose:** Complete prompt pack for generating the SkyGems UI redesign in Figma via MCP, Stitch, or equivalent design-generation tooling.
**Status:** Ready to execute. No Figma MCP detected in current environment — this pack is structured to be fed directly when available.

---

## How to Use This Pack

### If using Figma MCP:
1. Create a new Figma file named "SkyGems — UI Redesign v1"
2. Create the pages listed in Section 2 (one Figma page per app screen)
3. For each page, use the corresponding prompt from Section 3
4. Apply the style library from Section 1 as a shared Figma styles/variables set

### If using Stitch API:
1. Use each screen prompt from Section 3 as a Stitch generation request
2. Apply the style constraints from Section 1 as context for each request
3. Generate screens in order (they reference each other)

### If using any other design-generation tool:
1. Feed Section 1 (Style Library) as the global design context
2. Feed each screen prompt individually
3. Review and iterate per the acceptance criteria in Section 4

---

## Section 1: Global Style Library

Feed this ONCE as the foundational style context for all screens.

### PROMPT: Global Design System Setup

```
You are designing a premium jewelry design studio app called SkyGems. Apply these rules to EVERY screen:

ATMOSPHERE:
- Dark luxury jewelry studio aesthetic
- Feels like a premium creative tool (think OpenArt, Midjourney), NOT a SaaS dashboard
- Low density, high signal — generous whitespace as a luxury marker
- Image-first — generated jewelry designs are always the hero visual

COLOR PALETTE:
- Page background: #0A0A0A (near black, warm)
- Secondary background: #111111 (nav, headers)
- Card background: #1A1A1A (panels, containers)
- Elevated: #222222 (inputs, active areas)
- Primary text: #E5E5E5 (warm off-white)
- Secondary text: #999999
- Muted text: #666666
- ACCENT: #D4AF37 (gold) — the ONLY chromatic accent color
- Gold glow: rgba(212,175,55,0.15) for subtle background warmth
- Borders: rgba(255,255,255,0.06) — barely visible
- NO purple, blue, teal, or other chromatic colors except functional status:
  - Success: #4CAF50, Warning: #FF9800, Error: #EF5350, Info: #64B5F6

TYPOGRAPHY:
- Display headings: Playfair Display (serif), 600 weight, negative letter-spacing
- Everything else: Inter (sans-serif), 400-500 weight
- Page headings: 32px Playfair Display 600
- Section headings: 24px Playfair Display 600
- Subheadings: 18px Inter 500
- Body: 16px Inter 400
- Captions: 12px Inter 500
- Overlines: 11px Inter 600, UPPERCASE, 1.5px letter-spacing

COMPONENTS:
- Cards: #1A1A1A, 16px border-radius, 24px padding, subtle border
- Primary buttons: solid #D4AF37 gold with #0A0A0A text, 8px radius
- Secondary buttons: transparent with border, 8px radius
- Inputs: #222222 background, 8px radius, gold focus ring
- Status pills: pill shape (full radius), status color at 15% opacity bg + full opacity text
- Borders: rgba(255,255,255,0.06) default, rgba(255,255,255,0.12) on hover

LAYOUT:
- Top navigation bar only (56px height, #111111 background). NO sidebar.
- Content max-width: 1200px centered
- Standard section spacing: 32-48px
- Card padding: 24px minimum

NAVIGATION:
- Top bar: [Logo (left)] [Home] [Gallery] [User Avatar (right)]
- Breadcrumbs below nav for project-scoped pages
```

---

## Section 2: Figma Page Structure

Create these pages in this order:

| # | Figma Page Name | App Route | Frame Size |
|---|---|---|---|
| 1 | `00 — Style Guide` | N/A | 1440x3000 (scrolling reference) |
| 2 | `01 — Landing Page` | `/` | 1440x3200 |
| 3 | `02 — Home (Empty State)` | `/app` | 1440x900 |
| 4 | `03 — Home (With Projects)` | `/app` | 1440x1200 |
| 5 | `04 — Create` | `/app/projects/:id/create` | 1440x900 |
| 6 | `05 — Results (Loading)` | `/app/projects/:id/generations/:id` | 1440x900 |
| 7 | `06 — Results (Ready)` | `/app/projects/:id/generations/:id` | 1440x900 |
| 8 | `07 — Workspace` | `/app/projects/:id/designs/:id` | 1440x1800 |
| 9 | `08 — Workspace (Spec Expanded)` | `/app/projects/:id/designs/:id` | 1440x2200 |
| 10 | `09 — Workspace (Refine Drawer)` | `/app/projects/:id/designs/:id` | 1440x900 |
| 11 | `10 — Gallery` | `/app/gallery` | 1440x1400 |
| 12 | `11 — Gallery (Hover State)` | `/app/gallery` | 1440x1400 |
| 13 | `12 — Mobile (Key Screens)` | Various | 390x844 (iPhone 14) |

---

## Section 3: Screen-by-Screen Prompts

### Page 00: Style Guide

```
PROMPT: Create a comprehensive design system reference page for SkyGems.

LAYOUT: Vertical scrolling reference sheet, 1440px wide.

SECTIONS (top to bottom):

1. COLOR PALETTE
   Show swatches for all colors with hex codes and role labels:
   - Background scale: #0A0A0A → #111111 → #1A1A1A → #222222 → #2A2A2A
   - Gold accent: #D4AF37, #B8941F, #F5DEB3, rgba(212,175,55,0.15)
   - Text: #E5E5E5, #999999, #666666
   - Status: #4CAF50, #FF9800, #EF5350, #64B5F6
   Each swatch should be a 80x80 rounded rectangle with the hex below it.

2. TYPOGRAPHY
   Show the type scale in actual rendered text:
   - "Display XL" — Playfair Display 600, 48px
   - "Display" — Playfair Display 600, 32px
   - "Heading" — Playfair Display 600, 24px
   - "Subheading" — Inter 500, 18px
   - "Body" — Inter 400, 16px
   - "Body Small" — Inter 400, 14px
   - "Caption" — Inter 500, 12px
   - "OVERLINE" — Inter 600, 11px, uppercase, spaced
   Each line shows the style name, the rendered example, and the specs.

3. BUTTONS
   Row of button states:
   - Primary (gold): default, hover, pressed, disabled
   - Secondary (ghost): default, hover, pressed, disabled
   - Tertiary (text): default, hover
   Show each as a horizontal row of states.

4. CARDS
   Three example cards side by side:
   - Standard card (text content)
   - Image card (with placeholder jewelry image)
   - Selected card (with gold ring)
   Show hover states below each.

5. INPUTS
   - Text input: default, focus (gold ring), error, disabled
   - Textarea: default, focus
   - Select/dropdown: closed, open
   - Slider: with gold fill track

6. STATUS PILLS
   Row showing: Ready (green), Processing (blue), Warning (orange), Error (red), Neutral (gray)

7. NAVIGATION
   Full-width top nav bar showing: Logo, Home (active, gold underline), Gallery, Avatar

8. SKELETON LOADERS
   Show skeleton versions of: card, pair viewer, text block, avatar

9. ICONS
   Show the key Lucide icons used: Home, Image, Gem, Palette, Settings, ChevronRight, Plus, Search, Heart, Download, Sparkles, ArrowRight
```

---

### Page 01: Landing Page

```
PROMPT: Design the SkyGems public landing page.

CONTEXT: This is the marketing homepage that converts visitors to users. It should feel like a premium product launch page — cinematic, confident, aspirational.

LAYOUT: Full-width vertical scroll, 1440x3200.

FRAME 1 — Navigation (sticky, top):
- Height: 64px
- Background: rgba(10,10,10,0.8) with backdrop-filter blur(12px) (glassmorphism)
- Left: SkyGems logo mark (gem icon) + "SkyGems" wordmark in Playfair Display
- Center: "Features", "How It Works", "Pricing" links in Inter 400 14px #999999
- Right: "Sign In" text link (#999999) + "Start Designing" gold button (#D4AF37)

FRAME 2 — Hero (full viewport height):
- Center-aligned content
- Overline: "AI-POWERED JEWELRY DESIGN" in 11px Inter 600, #D4AF37, letter-spacing 1.5px
- Headline: "Design Jewelry\nwith Intelligence" in 64px Playfair Display 600, #E5E5E5, line-height 1.1
- Subheadline: "From concept sketch to manufacturing-ready CAD files. Powered by AI, refined by you." in 18px Inter 400, #999999, max-width 560px
- CTA row: "Start Designing" gold button (large, 16px 32px padding) + "See How It Works" ghost button
- Below: Decorative gold glow — a large, soft radial gradient of rgba(212,175,55,0.06) behind the text area
- Stat bar below CTA: Three stats in a row — "10,000+ Designs Created" | "500+ CAD Exports" | "98% Accuracy" — each in 14px Inter, #999999, separated by subtle vertical lines

FRAME 3 — Product Preview (centered):
- Large product screenshot/mockup (1000px wide) showing the Create screen and Results screen
- Floating on a subtle dark surface (#111111) with rounded corners (16px)
- Very subtle gold glow behind the screenshot (ambient light effect)
- Caption below: "From idea to production in minutes." Inter 400, 14px, #666666

FRAME 4 — Features (3-column grid):
- Section heading: "Everything you need" in 32px Playfair Display 600
- Subheading: "A complete design studio from concept to manufacturing." in 16px Inter 400, #999999
- Three feature cards (not six — keep it tight):
  Card 1: Sparkles icon + "AI Generation" + "Describe your vision and get sketch-render pairs in seconds."
  Card 2: Palette icon + "Refine & Iterate" + "Fine-tune every detail with natural language until it's perfect."
  Card 3: Download icon + "Production Ready" + "Generate specs, technical sheets, SVGs, and CAD files automatically."
- Each card: #1A1A1A background, 16px radius, 32px padding, icon in #D4AF37 at 24px

FRAME 5 — CTA (centered):
- "Ready to create something extraordinary?" in 32px Playfair Display 600
- "Start Designing — Free" gold button
- Below: "No credit card required" in 12px Inter 400, #666666

FRAME 6 — Footer:
- Minimal: "© 2026 SkyGems" left, social icons right
- Border-top: rgba(255,255,255,0.06)
- Height: 80px
```

---

### Page 02: Home (Empty State)

```
PROMPT: Design the SkyGems app home page in its empty state — a new user who has no projects yet.

CONTEXT: The user just signed up and landed here for the first time. This screen should feel inviting and momentum-building, not empty or broken.

LAYOUT: 1440x900, top nav + centered content.

TOP NAV (present on all app screens):
- 56px height, #111111 background, border-bottom rgba(255,255,255,0.06)
- Left: SkyGems logo (gem icon + "SkyGems" in Playfair Display 600 18px)
- Center: "Home" (active — #D4AF37, 2px gold underline) and "Gallery" (#999999) links
- Right: User avatar circle (32px, #222222 background, initials in #999999)

CONTENT (centered, max-width 480px, vertically centered in remaining space):
- Gem/ring line icon (48px, #666666 stroke, centered)
- Heading: "Start your collection" in 32px Playfair Display 600 #E5E5E5
- Body: "Create your first project to begin designing jewelry with AI." in 16px Inter 400 #999999
- CTA: "Create Project" gold button (#D4AF37), 14px Inter 500, centered, generous padding (14px 32px)
- Spacing: 16px between icon and heading, 12px heading to body, 24px body to button

FEEL: Inviting, not barren. The centered layout with the gold CTA creates a clear starting point. The decorative gold glow (very subtle, behind the icon) adds warmth.
```

---

### Page 03: Home (With Projects)

```
PROMPT: Design the SkyGems app home page showing the user's projects.

CONTEXT: A returning user with 4 projects. This is their creative hub — they should feel productive and organized.

LAYOUT: 1440x1200, top nav + content below.

TOP NAV: Same as Page 02.

CONTENT (max-width 1200px, centered):

HEADER ROW (flex, space-between):
- Left: "Your Studio" in 32px Playfair Display 600 #E5E5E5
- Right: "New Project" gold button + icon (Plus icon, 16px)

PROJECT GRID (below header, 32px gap):
- 3-column auto-fill grid, min 320px per column
- Each PROJECT CARD:
  - Background: #1A1A1A, 16px radius, no padding (image bleeds to edges on top)
  - Top: Thumbnail image (most recent design render), aspect-ratio 16/9, covers full width
  - Bottom section (24px padding):
    - Project name: "Engagement Ring Collection" in 18px Inter 500 #E5E5E5
    - Metadata row: "12 designs" pill (#222222 bg, 12px Inter 500 #999999) + "Updated 2h ago" in 12px Inter 400 #666666
  - Hover: border brightens to rgba(255,255,255,0.12), image scales to 1.02
  - Border: 1px solid rgba(255,255,255,0.06)

EXAMPLE PROJECT CARDS (4 cards, 3+1 layout):
1. "Engagement Ring Collection" — ring thumbnail — 12 designs
2. "Art Deco Pendants" — pendant thumbnail — 8 designs
3. "Temple Jewelry Series" — necklace thumbnail — 5 designs
4. "Minimalist Bands" — ring thumbnail — 3 designs

RECENT ACTIVITY ROW (below grid, 48px top margin):
- Overline: "RECENT" in 11px Inter 600 #666666, letter-spacing 1.5px
- Horizontal scroll row of small design thumbnails (80x80, 8px radius), showing last 6 designs across all projects
- Each thumb has a subtle gold ring on hover

FEEL: Organized but not clinical. The image-first project cards make this feel like a creative portfolio, not a project management tool.
```

---

### Page 04: Create

```
PROMPT: Design the SkyGems design creation page where users configure and generate a jewelry design.

CONTEXT: This is where creativity happens. The user selects jewelry parameters on the left, sees a live prompt preview on the right, and hits Generate. It should feel like a creative control panel, not a form.

LAYOUT: 1440x900, top nav + breadcrumb + two-column layout.

TOP NAV: Same as previous.

BREADCRUMB (below nav, 48px area):
- "Home > Engagement Ring Collection > Create" in 14px Inter 400 #666666
- "Home" and project name are links (#999999 hover)
- "Create" is current (#E5E5E5)

TWO COLUMNS:

LEFT COLUMN (400px fixed width, 24px left margin):
- Background: none (sits on #0A0A0A page bg)
- Vertical stack of pickers with 24px gaps between sections

  Section 1 — JEWELRY TYPE:
  - Label: "JEWELRY TYPE" overline (11px Inter 600, #666666, letter-spacing 1.5px)
  - 5-icon grid (2x3 minus 1): Ring, Necklace, Earrings, Bracelet, Pendant
  - Each: 72x72 card (#1A1A1A), 12px radius, Lucide icon 24px centered, label below 11px
  - Selected: gold border ring (0 0 0 2px rgba(212,175,55,0.3)), icon tinted #D4AF37
  - Show "Ring" as selected

  Section 2 — METAL:
  - Label: "METAL" overline
  - 4 horizontal buttons: Gold, Silver, Platinum, Rose Gold
  - Each: pill shape, #1A1A1A bg, 14px Inter 400, color swatch circle (12px) before text
  - Color swatches: Gold (#D4AF37), Silver (#C0C0C0), Platinum (#E5E4E2), Rose Gold (#B76E79)
  - Selected: gold border ring, text #E5E5E5
  - Show "Gold" as selected

  Section 3 — GEMSTONE:
  - Label: "GEMSTONE" overline
  - 5 toggle chips: Diamond, Ruby, Emerald, Sapphire, Pearl
  - Each: pill (#222222 bg), 14px Inter 400, small gem-colored dot (8px) before text
  - Active: gold bg at 15% opacity, gold text
  - Show "Diamond" active

  Section 4 — STYLE:
  - Label: "STYLE" overline
  - 3x2 grid of style buttons: Temple, Vintage, Floral, Geometric, Contemporary, Minimalist
  - Each: #1A1A1A bg, 12px radius, 14px Inter 400, 48px height
  - Selected: gold border ring
  - Show "Art Deco" selected (add this to the list or use "Vintage")

  Section 5 — COMPLEXITY:
  - Label: "COMPLEXITY" overline
  - Horizontal slider: track (#222222), filled portion (#D4AF37), thumb (16px gold circle)
  - Value label on right: "65%" in 14px Inter 500 #D4AF37
  - Track height: 4px, full width

  Section 6 — GENERATE BUTTON:
  - Full-width gold button: "Generate Designs" with Sparkles icon
  - 14px Inter 500, 14px 0 padding (height ~48px)
  - This is the ONLY gold CTA on the page

RIGHT COLUMN (flex-1, 48px left margin, 24px right margin):

  PROMPT PREVIEW CARD:
  - Background: #1A1A1A, 16px radius, 24px padding
  - Header: "Prompt Preview" subheading (18px Inter 500) + status pill ("Synced" green pill or "Edited" gold pill)
  - Prompt text area: Shows the auto-generated prompt text in 14px Inter 400 #E5E5E5, inside a textarea-like area (#222222 bg, 12px radius, 16px padding)
  - The prompt text should read like a real jewelry prompt:
    "Full composition, a gold engagement ring with a centered diamond in a vintage art deco setting. Intricate filigree band details with graduated pavé accents. Conceptual hand-drawn sketch with fine pencil outlines on neutral background."
  - Below textarea: "Reset to Auto" text button (tertiary, 12px, #666666) visible when in edited/override mode
  - Below prompt card: Design DNA preview showing extracted parameters as styled pills:
    Type: Ring | Metal: Gold | Stone: Diamond | Style: Vintage | Complexity: 65%

FEEL: Decisive, not form-like. Each picker selection feels like choosing a material in a real studio. The prompt preview makes the AI feel transparent and controllable.
```

---

### Page 05: Results (Loading)

```
PROMPT: Design the SkyGems generation results page in its loading/generating state.

CONTEXT: The user just hit "Generate" and is waiting for their AI-generated jewelry pair to appear. This is a moment of anticipation — make it feel exciting, not like a loading spinner.

LAYOUT: 1440x900, top nav + breadcrumb + centered content.

TOP NAV: Same.

BREADCRUMB:
- "Home > Engagement Ring Collection > Generation #3"

CONTENT (max-width 960px, centered):

STATUS BANNER (centered, above pair area):
- Subtle card: #1A1A1A bg, 16px radius, 16px 24px padding
- Left: Processing status pill (blue, "Generating" with pulse animation indicator)
- Center: "Designing your piece..." in 16px Inter 400 #E5E5E5
- Right: Elapsed time "12s" in 14px Inter 400 #666666

PAIR SKELETON (below banner, 32px top margin):
- Two skeleton rectangles side by side, 24px gap
- Each: aspect-ratio 4:3, #222222 background, 16px radius
- Shimmer animation overlay (subtle gradient sweep)
- Below left: "Sketch" label (12px Inter 500 #666666)
- Below right: "Render" label (12px Inter 500 #666666)

ACTIONS (below pair, 32px top margin, centered):
- "Back to Create" tertiary text button

FEEL: Anticipatory, not anxious. The skeleton shimmer with warm undertones suggests something precious is being crafted. The status banner provides clear feedback without being clinical.
```

---

### Page 06: Results (Ready)

```
PROMPT: Design the SkyGems generation results page showing a completed pair — sketch and render ready for selection.

CONTEXT: The generation succeeded. The user now sees their sketch/render pair and needs to decide: select this design, generate again, or go back. This is the "unveiling" moment.

LAYOUT: 1440x900, top nav + breadcrumb + centered content.

TOP NAV: Same.

BREADCRUMB:
- "Home > Engagement Ring Collection > Generation #3"

CONTENT (max-width 960px, centered):

STATUS BANNER:
- Same position as loading state but now shows:
- Success pill (green, "Ready")
- "Your design is ready" in 16px Inter 400 #E5E5E5

PAIR DISPLAY (below banner, 32px top margin):
- Two large images side by side, 24px gap
- Each: aspect-ratio 4:3, 16px radius, overflow hidden
- Left: Sketch image (hand-drawn pencil concept of a gold art deco ring with diamond)
  - Label below: "Sketch" 12px Inter 500 #666666
- Right: Render image (photorealistic render of the same ring)
  - Label below: "Render" 12px Inter 500 #666666
- Subtle gold ambient glow behind the pair: 0 0 60px rgba(212,175,55,0.06)
- On hover over either image: subtle scale(1.02) with cursor pointer

ACTIONS (below pair, 32px top margin, centered row):
- "Select This Design" — GOLD primary button (the main CTA)
- "Generate Again" — Secondary ghost button
- "Edit Configuration" — Tertiary text button

PREVIOUS GENERATIONS (below actions, 48px top margin):
- Overline: "PREVIOUS GENERATIONS" 11px Inter 600 #666666
- Horizontal row of small pair thumbnails (64x48 each, 8px radius, 12px gap)
- Show 2-3 previous generation thumbnails, slightly dimmed (opacity 0.6)
- Click to view that generation's pair

FEEL: Cinematic unveiling. The pair is large, dramatic, well-lit. The gold glow behind adds warmth. The "Select This Design" button in gold makes the next step unmissable.
```

---

### Page 07: Workspace

```
PROMPT: Design the SkyGems design workspace — the home for a selected design showing the hero pair viewer and production pipeline.

CONTEXT: The user selected a design. This is now their creative command center. They can see the design at full scale, initiate refinement, and trigger the production pipeline. This is the emotional center of the product.

LAYOUT: 1440x1800 (scrolling), top nav + breadcrumb + full-width hero + centered content.

TOP NAV: Same.

BREADCRUMB:
- "Home > Engagement Ring Collection > Art Deco Solitaire"

HERO PAIR VIEWER (full content width, below breadcrumb):
- Background: #111111 surface area spanning full content width
- Two large images (sketch left, render right), each taking ~48% width with 24px gap
- Aspect-ratio: 4:3 per image
- 16px border-radius on each image
- Subtle gold border: 1px solid rgba(212,175,55,0.1)
- Below images (inside hero surface): labels "Sketch" / "Render" in 12px Inter 500 #666666
- Generous padding: 32px all sides
- Overall hero surface: 16px border-radius, #111111 background

DESIGN INFO BAR (below hero, 32px top margin, max-width 1200px centered):
- Left: Design name "Art Deco Solitaire" in 24px Playfair Display 600 #E5E5E5
- Left below: "Engagement Ring Collection" in 14px Inter 400 #666666 (link)
- Right: Action buttons row:
  - "Refine" secondary button with Sparkles icon
  - "Download Pair" tertiary button with Download icon
  - Three-dot menu (more actions)

DESIGN METADATA ROW (below info bar, 16px top margin):
- Horizontal row of styled pills:
  - "Ring" (jewelry type pill, neutral)
  - "Gold" (metal pill, gold-tinted)
  - "Diamond" (gem pill, neutral)
  - "Vintage" (style pill, neutral)
  - "65% complexity" (neutral pill)
- Each pill: #222222 bg, 12px radius (pill), 12px Inter 500, 4px 10px padding

PIPELINE SECTION (below metadata, 48px top margin):
- Section heading: "Production Pipeline" in 18px Inter 500 #E5E5E5
- Subheading: "Generate manufacturing-ready outputs from your design." in 14px Inter 400 #999999

PIPELINE RAIL (horizontal, connected stages):
- 4 stage cards in a horizontal row connected by a thin line (#222222)
- Equal width, 16px gap between cards

Stage 1 — SPEC (status: ready):
  - Card: #1A1A1A bg, 16px radius, 24px padding
  - Top: "Spec" label in 14px Inter 500 #E5E5E5 + FileText icon 16px
  - Status: Green "Ready" pill
  - Gold left-border accent (3px solid #D4AF37)
  - Bottom: "View" secondary button
  - Connected to next stage by horizontal line with gold fill (completed segment)

Stage 2 — TECH SHEET (status: processing):
  - Card: #1A1A1A bg, 16px radius, 24px padding
  - Top: "Technical Sheet" label + FileSpreadsheet icon
  - Status: Blue "Processing" pill with pulse
  - Bottom: Progress bar (40% filled, gold)
  - Connected line: gold up to this point, gray after

Stage 3 — SVG (status: pending):
  - Card: #1A1A1A bg, 16px radius, 24px padding
  - Top: "SVG" label + Image icon
  - Status: Neutral "Pending" pill (gray)
  - Bottom: "Start" button (disabled, waiting for tech sheet)
  - Connected line: gray (not yet reached)

Stage 4 — CAD (status: pending):
  - Card: #1A1A1A bg, 16px radius, 24px padding
  - Top: "CAD Files" label + Box icon
  - Status: Neutral "Pending" pill
  - Format chips below status: "STEP" "STL" "DXF" (all gray, not yet selectable)
  - Bottom: "Start" button (disabled)
  - Connected line: gray

The connecting line runs horizontally between cards at vertical center. Completed segments are gold (#D4AF37), pending segments are #222222.

FEEL: Creative command center. The hero pair dominates — it's YOUR design, precious and prominent. The pipeline below is accessible but doesn't overwhelm. Each stage has clear status and a clear next action.
```

---

### Page 08: Workspace (Spec Expanded)

```
PROMPT: Design the SkyGems workspace page with the Spec pipeline stage expanded, showing the design specification content.

CONTEXT: Same workspace as Page 07, but the user clicked "View" on the Spec stage card. The spec content expands below the pipeline rail, showing the structured specification with risk flags.

LAYOUT: 1440x2200 (longer scroll), same structure as Page 07 but with expanded content.

Everything above the pipeline rail is identical to Page 07.

SPEC EXPANDED CONTENT (below the pipeline rail, 24px top margin):
- Container: #1A1A1A bg, 16px radius, 24px padding
- Header row: "Design Specification" in 18px Inter 500 + "Collapse" tertiary button (ChevronUp icon)

SPEC SECTIONS (vertical stack, 24px between sections):

Section: DIMENSIONS
- Overline: "DIMENSIONS"
- Grid (2 columns):
  - "Ring Size: 7 (US)" | "Band Width: 2.8mm"
  - "Band Thickness: 1.6mm" | "Setting Height: 8.2mm"
  - "Overall Weight: 4.2g"
- Each value: label in 12px #666666, value in 16px #E5E5E5

Section: MATERIALS
- Overline: "MATERIALS"
- "Primary Metal: 14K Yellow Gold (585)"
- "Accent Metal: None"
- "Finish: High Polish with brushed gallery"

Section: GEMSTONE SETTINGS
- Overline: "GEMSTONE SETTINGS"
- "Center Stone: Round Brilliant Diamond, 1.0ct, VS1, G color"
- "Setting Type: Four-prong cathedral"
- "Accent Stones: 12x pavé diamonds, 0.01ct each, channel set"

Section: RISK FLAGS
- Three risk flag items:
  1. Red flag: "Cathedral height may interfere with band stacking" — blocking severity
  2. Amber flag: "Pavé channel width at minimum tolerance" — warning severity
  3. Blue flag: "Consider bezel backup for active lifestyle" — informational
- Each flag: colored left border (3px), icon, severity label pill, description text

Section: MANUFACTURING NOTES
- Bullet list of 3-4 notes in 14px Inter 400 #999999

Bottom of expanded content:
- "Generate Technical Sheet" gold button (next pipeline step CTA)
- "Download Spec" tertiary button

FEEL: The specification feels like a real jeweler's workshop document — structured, precise, authoritative. Risk flags add credibility (this system knows manufacturing). The gold CTA to generate the next stage creates flow.
```

---

### Page 09: Workspace (Refine Drawer)

```
PROMPT: Design the SkyGems workspace with the Refine drawer open, showing the contextual refinement interface.

CONTEXT: Same workspace as Page 07, but with a slide-in drawer from the right for design refinement. The drawer lets users describe changes in natural language.

LAYOUT: 1440x900, same as Page 07 but with right drawer overlay.

MAIN CONTENT: Same as Page 07 but dimmed slightly (overlay effect).

OVERLAY: rgba(0,0,0,0.5) covering the main content.

REFINE DRAWER (right-aligned, 420px wide, full height):
- Background: #111111
- Border-left: 1px solid rgba(255,255,255,0.06)
- Padding: 24px

DRAWER CONTENT:

Header:
- "Refine Design" in 18px Inter 500 #E5E5E5
- Close button (X icon) top-right

Description:
- "Describe the changes you'd like to make to this design." in 14px Inter 400 #999999

Suggestion chips (quick refinement ideas):
- Row of pill buttons (wrap):
  "Thinner band" | "Add halo" | "Change to bezel" | "More pavé" | "Simplify"
- Each: #222222 bg, pill radius, 12px Inter 400 #E5E5E5
- Hover: border brightens

Text input area:
- Large textarea: #222222 bg, 12px radius, 16px padding, 160px height
- Placeholder: "e.g., Make the band thinner and add a halo around the center stone..."
- Below: "Your original design will be preserved. Refinement creates a new generation." in 12px Inter 400 #666666

Action:
- "Refine" gold button, full-width
- "Cancel" tertiary text button below

FEEL: Focused and intimate. The drawer narrows attention to the refinement task. Suggestion chips reduce blank-page anxiety. The note about preserving the original builds confidence.
```

---

### Page 10: Gallery

```
PROMPT: Design the SkyGems gallery page showing designs across all projects in a grid layout.

CONTEXT: The gallery is the user's design library — a place to browse, search, and rediscover designs from any project. It should feel like walking through a curated collection.

LAYOUT: 1440x1400, top nav + content.

TOP NAV: Same, but "Gallery" is now active (gold underline), "Home" is inactive.

CONTENT (max-width 1400px, centered):

HEADER:
- "Gallery" in 32px Playfair Display 600 #E5E5E5
- Subheading: "Browse your design collection" in 16px Inter 400 #999999

SEARCH BAR (below header, 24px top margin):
- Full-width input: #222222 bg, 12px radius, 48px height
- Search icon (left, #666666) + placeholder "Search designs, metals, styles..." in #666666
- Gold focus ring on click

FILTER CHIPS (below search, 16px top margin):
- Horizontal row: "All" (active, gold bg at 15%), "Rings", "Necklaces", "Earrings", "Bracelets", "Pendants"
- Each: pill shape, #222222 bg, 12px Inter 400 #999999
- Active: rgba(212,175,55,0.15) bg, #D4AF37 text
- Sort dropdown on right: "Newest First" with chevron

DESIGN GRID (below filters, 32px top margin):
- 4-column grid, 16px gap
- Each DESIGN CARD:
  - Aspect-ratio: 1/1 (square)
  - Image: render image, object-fit cover, 16px radius top
  - Bottom overlay (always visible, gradient from transparent to rgba(10,10,10,0.7)):
    - Design name: "Art Deco Solitaire" 14px Inter 500 #E5E5E5
    - Project name: "Engagement Ring Collection" 12px Inter 400 #999999
  - Jewelry type badge: top-right corner, "Ring" pill (rgba(0,0,0,0.6) bg, 11px)
  - Border: 1px solid rgba(255,255,255,0.06), 16px radius

SHOW 12 EXAMPLE CARDS with varied jewelry types.

FEEL: Museum gallery. Large images, clean grid, minimal chrome. The search and filters are available but don't dominate. Each card is a little window into a design.
```

---

### Page 11: Gallery (Hover State)

```
PROMPT: Design the SkyGems gallery page showing the hover state on a design card.

CONTEXT: Same as Page 10, but one card is being hovered. Show the interactive state.

LAYOUT: Same as Page 10.

HOVERED CARD (show on the 2nd or 3rd card):
- Image: scale(1.03) with overflow hidden
- Overlay: stronger gradient, from transparent 20% to rgba(10,10,10,0.85) 100%
- Design name and project name remain visible
- Quick action buttons appear in overlay:
  - "Open" button (small, secondary, white border) — bottom-left of overlay
  - Heart icon button (24px, #E5E5E5 stroke) — bottom-right of overlay
- Border: brightens to rgba(255,255,255,0.12)
- Subtle gold glow: box-shadow 0 0 20px rgba(212,175,55,0.05)

ALL OTHER CARDS: Normal state (not hovered).

FEEL: Engaging but not aggressive. The hover reveal is smooth and informative — it shows you can take action without cluttering the default view.
```

---

### Page 12: Mobile (Key Screens)

```
PROMPT: Design mobile adaptations of the 4 most important SkyGems screens on iPhone 14 (390x844).

CONTEXT: Mobile is a secondary but first-class experience. These adaptations should maintain the premium feel at smaller scale.

LAYOUT: Four 390x844 frames arranged horizontally with 40px gap.

FRAME 1 — Mobile Home:
- Top: Compact nav (48px height). Hamburger menu left, Logo center, Avatar right.
- Content: Single-column project cards, full width with 16px horizontal padding
- Each card: thumbnail (16:9), project name, design count
- "New Project" gold FAB (floating action button) bottom-right, 56px circle

FRAME 2 — Mobile Create:
- Breadcrumb collapsed to back arrow + "Create"
- Full-width single column: all pickers stacked vertically
- Prompt preview: collapsible card (chevron to expand/collapse)
- "Generate" gold button: fixed to bottom of screen (safe area aware), full width minus padding

FRAME 3 — Mobile Results:
- Pair display: STACKED vertically (sketch above, render below)
- Each image: full width, aspect-ratio 4:3
- 16px gap between images
- Labels: "Sketch" / "Render" above each
- "Select This Design" gold button fixed to bottom

FRAME 4 — Mobile Workspace:
- Hero: Stacked pair (sketch above, render below), full width
- Design name and metadata pills below
- Pipeline rail: Vertical list (not horizontal)
- Each stage: full-width card with status pill and CTA
- "Refine" button in bottom action bar

FEEL: Same premium quality at smaller scale. Gold accents, dark surfaces, generous padding. Nothing feels cramped.
```

---

## Section 4: Acceptance Criteria

### Per-screen checklist

For every generated screen, verify:

- [ ] Background is `#0A0A0A` (not white, not pure black)
- [ ] No purple, blue, or non-gold chromatic accents
- [ ] Gold (`#D4AF37`) is the only accent color
- [ ] Page heading uses Playfair Display, not Inter
- [ ] Body text uses Inter, not Playfair
- [ ] Cards have `#1A1A1A` background and `16px` border-radius
- [ ] Borders are subtle (`rgba(255,255,255,0.06)`)
- [ ] No sidebar — top nav only
- [ ] Only ONE gold CTA button per visible viewport area
- [ ] Status pills use correct color mapping (green/blue/orange/red)
- [ ] Image containers have proper aspect ratios (no stretching)
- [ ] Text hierarchy is maximum 3 levels deep
- [ ] No developer copy (no IDs, no "placeholder", no "when backend is wired")
- [ ] Spacing feels generous (luxury, not cramped)

### Cross-screen consistency checklist

- [ ] Top nav is identical across all app screens (Pages 02-11)
- [ ] Breadcrumb pattern is consistent on project-scoped pages
- [ ] Button styles match the style guide (Page 00)
- [ ] Card styles are consistent (same radius, padding, border treatment)
- [ ] Typography scale is applied correctly throughout
- [ ] Gold accent usage is restrained and consistent

### Product truth checklist

- [ ] Create page shows exactly 5 picker types (jewelry, metal, gem, style, complexity)
- [ ] Results page shows exactly ONE pair (sketch + render), not a grid of many
- [ ] Workspace pipeline has exactly 4 stages (Spec, Tech Sheet, SVG, CAD)
- [ ] CAD stage shows exactly 3 formats (STEP, STL, DXF)
- [ ] Gallery cards show renders (not sketches) as the primary image
- [ ] No features are shown that don't exist in the backend (no 3D viewer, no team collaboration, no pricing)

---

## Section 5: Component Inventory for Design System

After generating all screens, extract these components into a shared Figma component library:

### Atoms
| Component | Variants |
|---|---|
| Button | Primary (gold), Secondary (ghost), Tertiary (text), Disabled |
| Input | Default, Focus, Error, Disabled |
| Textarea | Default, Focus |
| Badge/Pill | Ready, Processing, Warning, Error, Neutral, Gold |
| Icon | 16px, 20px, 24px sizes |
| Avatar | 32px, 40px |
| Slider | Default, Active |

### Molecules
| Component | Variants |
|---|---|
| NavBar | Standard (Home active), Standard (Gallery active) |
| Breadcrumb | 2-level, 3-level, 4-level |
| ProjectCard | With thumbnail, Empty |
| DesignCard | Default, Hovered |
| PairViewer | Large (Results/Workspace), Small (thumbnail) |
| StatusPill | All status variants |
| PickerItem | Default, Selected, Disabled |
| StageCard | Not started, Processing, Ready, Stale |
| FilterChip | Default, Active |
| SearchBar | Default, Focused |
| SkeletonCard | Image, Text, Pair |

### Organisms
| Component | Variants |
|---|---|
| HeroPairViewer | Full (Workspace), Compact (Results) |
| PipelineRail | Horizontal (desktop), Vertical (mobile) |
| ConfigPanel | Full create flow stack |
| PromptPreview | Synced, Edited/Override |
| SpecContent | Expanded with all sections |
| RefineDrawer | Open |
| EmptyState | New user, No results, Error |

---

## Section 6: Iteration Notes

### After first generation pass

1. **Compare pair viewer drama** — Is the sketch/render pair large enough to be the emotional centerpiece? If not, make it bigger.
2. **Check gold restraint** — Count gold elements per screen. If more than 3-4, reduce.
3. **Check whitespace** — Screenshot each screen and squint. Do elements feel well-spaced or cramped?
4. **Compare to OpenArt** — Open openart.ai side by side. Does SkyGems feel equally premium and image-forward?
5. **Check status pill consistency** — Same pill style across all screens?
6. **Check mobile** — Do the mobile screens feel like premium mobile UX, not desktop crammed into a phone?

### Known design decisions to revisit

| Decision | Current choice | Alternative | Revisit trigger |
|---|---|---|---|
| Pipeline as expandable cards vs tabs | Expandable cards | Tab panel within workspace | If spec content is too long for inline expansion |
| Gallery grid: square vs varied aspect ratio | Square (1:1) | Masonry with varied heights | If renders have varied aspect ratios |
| Previous generations as thumbnail row | Horizontal row below current pair | Grid of all generations | If users frequently generate many times |
| Mobile pair: stacked vs swipeable | Stacked vertically | Horizontal swipe carousel | If vertical stacking makes page too long |
