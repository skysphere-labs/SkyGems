# SkyGems — AI-Powered Jewelry Design Platform

SkyGems is a browser-based jewelry design studio. Users configure design parameters (jewelry type, metal, gemstones, style, complexity), and the platform generates professional jewelry concept art.

## Tech Stack

- **Runtime:** React 18 + TypeScript
- **Build:** Vite 6
- **Styling:** Tailwind CSS v4, CSS custom properties (design tokens)
- **Animation:** Motion (Framer Motion)
- **Routing:** React Router v7
- **UI Components:** Radix UI primitives + shadcn/ui
- **Icons:** Lucide React

## Quick Start

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173/`.

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | LandingPage | Public marketing page |
| `/app` | Dashboard | Recent designs, quick actions |
| `/app/create` | DesignGenerator | Design config + prompt builder |
| `/app/gallery` | DesignGallery | Browse/like/delete saved designs |
| `/app/preview/:id` | DesignPreview | Single design viewer |
| `/app/copilot` | AICoPilot | Chat-based design editor |
| `/app/export` | CADExport | Multi-format CAD export |

## Design System

Dark luxury aesthetic with gold accents. All tokens in `src/styles/theme.css`.

- **Theme:** Dark-first (`#0A0A0A` base, `#111111` sidebar, `#1A1A1A` cards)
- **Accent:** Gold (`#D4AF37` primary, `#B8941F` muted, `#F5DEB3` light)
- **Typography:** Playfair Display (headings) + Inter (body)
- **Motion:** 150ms hover, 250ms transitions, 400ms modals

### Styling Rules

- Use inline `style={{ color: 'var(--text-primary)' }}` for theme tokens
- Borders: `rgba(255, 255, 255, 0.06)` default, `0.15` on hover
- Gold accent via `var(--accent-gold)` for CTAs and active states
- No `bg-white` or `text-gray-*` — use CSS custom properties

### Layout Rules

- `RootLayout` is `h-screen overflow-hidden` — sidebar + main are viewport-locked
- Pages use `h-full overflow-auto` or `h-full overflow-hidden` with internal scroll
- Never use `h-screen` on child components — use `h-full` and `min-h-0`
