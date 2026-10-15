# Design Brief

## Direction

Ledger Ink — a warm, editorial "practice ledger" for a solo ERP consultant: parchment surfaces, ink-dark type, deep teal-green as the single trust accent.

## Tone

Refined editorial minimalism with print-ledger warmth — deliberately not corporate navy-blue finance; the calm of a well-kept accounting book rendered as software.

## Differentiation

Every number is set in tabular monospace on warm parchment with hairline rules, so the app reads like a beautifully typeset ledger rather than a generic SaaS dashboard.

## Color Palette

| Token      | OKLCH         | Role                                        |
| ---------- | ------------- | ------------------------------------------- |
| background | 0.975 0.006 85 | warm parchment canvas (light)              |
| foreground | 0.215 0.018 60 | ink-dark text                              |
| card       | 0.995 0.003 85 | near-white raised surfaces                 |
| primary    | 0.455 0.088 172 | deep teal-green — actions, active nav      |
| accent     | 0.62 0.135 62  | warm amber — billable highlights, badges   |
| muted      | 0.945 0.009 85 | recessed panels, table stripes             |
| success    | 0.55 0.115 158 | positive deltas, invoiced state            |
| warning    | 0.70 0.135 75  | unbilled / attention states                |
| destructive| 0.53 0.19 27   | negative deltas, delete actions            |

## Typography

- Display: Space Grotesk — page titles, KPI numbers, section headings (technical precision)
- Body: General Sans — UI labels, table cells, paragraphs (dense readability)
- Mono: JetBrains Mono — all currency, hours, percentages, tabular figures
- Scale: hero `text-4xl md:text-5xl font-bold tracking-tight`, h2 `text-2xl font-semibold`, label `text-[11px] font-semibold uppercase tracking-[0.14em]`, body `text-sm`

## Elevation & Depth

Flat, print-like surfaces: hairline `border` + `shadow-subtle` on cards, `shadow-elevated` only on popovers/dialogs; depth comes from layered warm tones, not glow.

## Structural Zones

| Zone    | Background        | Border        | Notes                                              |
| ------- | ----------------- | ------------- | -------------------------------------------------- |
| Sidebar | `bg-sidebar`      | `border-r`    | warm ivory rail, teal pill for active nav item     |
| Header  | `bg-card`         | `border-b`    | sticky page header, breadcrumb + primary action    |
| Content | `bg-background`   | —             | alternate `bg-muted/40` section bands for rhythm   |
| Footer  | `bg-muted/40`     | `border-t`    | status/summary strip, muted small type             |

## Spacing & Rhythm

Generous `gap-6` between KPI cards and chart panels; tight `py-2.5` rows inside data tables; `p-5` card padding; consistent 4px micro-grid.

## Component Patterns

- Buttons: `rounded-md`, primary = teal-green fill with white text, ghost = transparent with `border`, hover darkens via `transition-smooth`
- Cards: `rounded-md border bg-card shadow-subtle`, KPI cards carry a tiny uppercase label + large mono figure
- Badges: pill `rounded-full`, tinted `success/10` or `warning/10` background with solid text — billable vs unbilled
- Tables: hairline row dividers, `bg-muted/40` header, right-aligned tabular numeric columns

## Motion

- Entrance: `animate-fade-up` staggered on KPI cards and panels (0.4s, ease-out)
- Hover: `transition-smooth` on rows, buttons, and nav items (0.3s)
- Decorative: `animate-bar-grow` on margin ranking bars; subtle `animate-fade-in` on chart mount

## Constraints

- No invoice generation, PDF export, or expense-receipt tracking surfaces
- No raw color literals or arbitrary Tailwind color classes — semantic tokens only
- Maximum 3 type families; accent amber used sparingly, never as a large fill
- Light theme is primary; dark theme is a tuned warm-charcoal variant

## Signature Detail

The "ledger rule" — every monetary and hour figure is monospace tabular-nums on parchment with hairline dividers, giving the whole app the texture of a meticulously kept accounts book.
