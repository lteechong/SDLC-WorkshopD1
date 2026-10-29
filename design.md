# Snip Design System

Source of truth for future styling: a quiet near-black workspace, centered hero,
warm edge-to-edge light, one dominant URL composer, and rounded surfaces.
Borrow visual rhythm only, never another product's branding or copy.

## Tokens

- Colors: `--background: #101012`; `--surface: #1c1c20`;
  `--surface-hover: #242429`; `--text: #f7f5f4`; `--muted: #aaa6ad`;
  `--accent: #ffb09c`; `--success: #a4e1c4`; `--error: #ffb4bc`.
- Accent: `--accent-gradient: linear-gradient(110deg, #ffae91, #ff8da8 55%, #ffc18c)`;
  dark action text `#29151b`. Keep most surfaces neutral, not tinted.
- Font: `"Segoe UI Variable", "Segoe UI", Helvetica, sans-serif`; zero letter
  spacing; body 14px/1.5, input 16px, metadata 12px, section heading 24px/1.2,
  hero 56px/1.1 at weight 700 (36px on screens <=640px). No italic headings.
- Spacing: 4, 8, 12, 16, 24, 32, 48, 64, 80px. Content max 960px; composer
  max 760px; desktop gutters 32px, mobile 20px; hero padding 80px top/64px bottom.
- Radii: composer and primary action 999px (composer 28px on mobile), table
  and empty-state cards 24px, notices 16px. No cards nested inside cards.
- Border: `--border: #343239`, 1px; internal dividers use the same token.
  Shadow: `--shadow: 0 20px 60px rgb(0 0 0 / 24%)`.
- Glow: `body::before`, fixed at top with `left: 0; right: 0`, height 680px,
  `pointer-events: none`; layered elliptical coral/pink/orange gradients fading
  to transparent. Always viewport-wide, never inside the content container.
  Body isolates stacking; glow z-index -1. No discrete decorative blobs.
- Focus: 2px solid accent with 4px offset; composer focus border accent plus
  `0 0 0 4px rgb(255 176 156 / 12%)`. Hover brightens neutral surfaces;
  disabled actions retain readable text with reduced opacity.

## Element Mapping

- Page header: small Snip wordmark above a centered, bold hero title; existing
  eyebrow becomes a short muted subline. Preserve existing copy.
- URL form: accessible label above a large chat-style pill; transparent input,
  attached gradient primary action. On mobile, action stacks inside the composer.
- Result/error: dark notices below the form with green/pink text and matching
  translucent backgrounds; links wrap, status/alert semantics stay intact.
- Links table: unframed heading above one rounded, subtly bordered card; muted
  column labels, quiet row dividers, accent links, tabular visit counts. Empty
  state uses the same treatment. Horizontal scroll stays inside the card.
- Footer: muted, restrained, separated by a fine border. No new behavior, imagery,
  external fonts, dependencies, or promotional content.