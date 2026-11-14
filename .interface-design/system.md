# SmoothSales design system — "Operator console"

## Who and why
Telecallers, sales reps and team leads who live in the CRM all day: dialing, replying on
WhatsApp, logging outcomes, reassigning leads. They need to scan fast and act in one click.
The feel is a calm, dense **lead register**, not a marketing dashboard.

## World
- Domain: lead register, call sheet, follow-up ledger, touch (call / WhatsApp / visit),
  portal inquiry, delivery ticks, assignment.
- Colours come from that world: ledger-paper off-white, register-ink teal, stamp red,
  highlighter amber, read-tick blue.
- **Signature: the touch strip.** Each lead row carries a compact strip of touch marks
  (call, WhatsApp, visit) plus a freshness age ("untouched 2d"). The same tick language
  (sent → delivered → read → failed) is reused for every status in the product.

## Tokens (src/app/globals.css → tailwind.config.js)
- Surfaces: `background` (warm paper canvas) → `card` (panel, one step lighter) →
  `popover` (overlay). Dark mode keeps one slate hue and shifts lightness only.
- Ink: `foreground`, `muted-foreground` (supporting/meta). Four text tiers via weight +
  colour: 600/foreground, 500/foreground, 400/muted-foreground, 400/muted-foreground at 70%.
- Accent: `primary` (ink teal) for the primary action and active state ONLY. `accent` is
  its pale wash for selected rows / active nav.
- Status: `success`, `warning`, `destructive`, `info` (+ `-foreground`). Never decorative.
- Controls: `input` (border), `input-background` (slightly inset fill), `ring` (focus).
- Never hex or raw Tailwind palette colours (`gray-200`, `emerald-600`) in components.

## Type
- Instrument Sans (`font-sans`) for all UI; JetBrains Mono (`font-mono`) for phone
  numbers, IDs, webhook URLs, keys. Numbers that change get `.tabular`.
- Scale (14px base, ~1.2): 11 meta/labels (uppercase, tracked, 500) · 13 dense table ·
  14 body · 16 section title · 20 page title (600, -0.015em) · 28 hero figure.

## Space, depth, radius
- 4px grid. Density: table rows 40px, controls 32–36px, panel padding 16px, page gutter
  16px mobile / 24px desktop.
- Depth = **borders-first**. Hairline `border` on panels; `shadow-panel` only for raised
  cards, `shadow-overlay` for popovers/dialogs. No heavy drop shadows.
- Radius: `sm` 4px chips · `md` 6px controls · `lg` 8px panels · `xl` 12px dialogs.

## Motion
150–200ms, `ease-out` = cubic-bezier(0.23, 1, 0.32, 1). Only transform/opacity.
Press feedback scale(0.98). Disabled entirely under prefers-reduced-motion (global rule).

## States (every data view)
Loading = skeleton rows matching the final layout · Empty = one line of what this is + the
one action that fills it · Error = what failed + Retry · Disabled controls explain why
(tooltip) when the reason is not obvious.
