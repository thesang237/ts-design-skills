---
name: ui-craft
description: Use when designing, building or reviewing interface layout and styling on the web: spacing scale, type scale, colour tokens and contrast, radius and shadows, grid and breakpoints, container queries, component states (default, hover, focus, active, disabled, loading, empty, error, success), forms, responsive behaviour and the small polish details that make UI feel premium. Also decides which "dialect" fits the project (product UI such as dashboards, shops, forms and web apps, or showcase pages such as creative portfolios, landing pages and editorial sites with huge type and full-height images) and holds a never-do list. Works with Tailwind (v3 or v4), shadcn/ui tokens and plain CSS. Motion comes from web-motion and page-transitions; 3D from 3d-web.
---

# UI craft

Make interfaces calm, consistent and easy to use first, and beautiful second. Beauty here comes from
**a few rules applied without exception**: one spacing scale, one type scale, one accent, careful
states. Checked on 2026-10-01 against Tailwind CSS 4.x and 3.4, shadcn/ui (OKLCH tokens), WCAG 2.2,
and current MDN for `:focus-visible`, `text-wrap`, container queries, `light-dark()`, `:user-invalid`
and `field-sizing`. Code and values for everything below are in `references/`, and a runnable demo
(tokens, state matrix, forms, dialects, contrast checker) is in `demos/ui-craft/`.

Related skills (don't repeat them here):
- **web-motion**: every duration, curve, stagger, hover and reveal. This skill says *which states exist*; web-motion says how they move.
- **page-transitions**: loaders and route changes.
- **3d-web**: WebGL and canvas.
- **quality-check**: the full review pass. This skill's checklist is the visual and interaction part of it.

## Before writing any code: ask the designer

Never pick these silently. Ask, then write the answers down in the project.

1. Which dialect: **product UI**, **showcase**, or both (and where does one stop and the other start)?
2. Spacing base and the named steps. Type scale and the families (max two).
3. Radius and depth: hairline-first, soft, or sharp?
4. The one accent colour, the neutral temperature (warm, cool, pure), light only or light and dark?
5. What does keyboard focus look like? (One style, everywhere.)
6. Which breakpoints, and which components must adapt to their container, not the window?

### Sang's answers (taste session, 2026-10-01). Use these unless told otherwise

- **Spacing: 4px base, a fixed named scale** (4, 8, 12, 16, 24, 32, 48, 64, 96, 128). Nothing else. Fluid `em` sizing (1em = 1% of the window) is **opt-in for showcase pages only**.
- **Hairline-first surfaces:** 1px borders carry structure; radius 6px on controls and 10px on cards; **no shadows except on floating layers** (menus, popovers, dialogs). Pills only for tags and filters.
- **Focus: a double ring** (2px inner ring in the page colour, 2px outer ring in the ink colour), visible on any background. One style for the whole system.
- **Colour: warm paper neutrals + exactly one accent**, plus semantic red, amber, green and blue. Colour is information, never decoration. OKLCH tokens.
- **Two dialects, one set of rules.** Product UI and showcase pages share colour roles, spacing discipline, states and focus. They differ in type size, density and layout (table below).
- States are never skipped: every interactive component ships default, hover, focus-visible, active, disabled, loading, empty and error (where they make sense) and the matrix is checked.

## Which dialect? (decision guide)

| Project | Dialect | Why |
| --- | --- | --- |
| Dashboard, admin, settings, forms, tables, docs, a shop's browse and checkout | **Product** | People return daily and need speed and clarity: fixed type scale, reflow layout, visible affordances, density modes |
| Creative portfolio, campaign, landing page, editorial or case-study site | **Showcase** | One visit, one impression: huge type, full-height images, fluid scale, hairlines, empty space |
| A shop (or app) with a showcase home page | **Both, split by route** | Showcase tokens on the marketing routes, product tokens everywhere else; share colour, spacing steps, states and focus |

| | Product | Showcase |
| --- | --- | --- |
| Body size | 14 to 16px, fixed | 16 to 20px, may be fluid |
| Display type | up to 40 to 56px | up to ~10vw, line-height 0.85 to 0.92, tight tracking |
| Layout | reflows (grid, flex, container queries) | may scale with the window (`font-size: 1vw` and em) on desktop, reflows on phones |
| Surfaces | hairline borders, 6/10px radius, shadow on floating layers only | hairlines and empty space, radius 0 to 6px, no shadows |
| Controls | filled primary, visible borders, 40px tall | may be text-only with a swap hover, if there is still an affordance |
| Imagery | thumbnails and aspect-ratio boxes | full-height photos, one image per screen |
| Motion | fast and quiet (web-motion house style) | longer reveals allowed (immersive mode) |

What carries over from showcase to product UI (and is worth stealing): **one gutter and one scale used
everywhere, hairlines instead of boxes, hierarchy from size and space instead of colour, a hard left
edge, generous empty space around the one important action, one signature detail used consistently
(a link swap, a rule), and states that are designed instead of defaulted.** What doesn't carry over:
giant type, full-height images, scale-with-window layout, scroll-hijacking, controls with no visible
boundary.

## Core rules

1. **Tokens, not values.** Every size, colour, radius, shadow, duration and z-index comes from a named token. No `13px`, no `#6b6b6b`, no `margin-top: 7px` in a component.
2. **One spacing scale** (4px base, named steps above). Space *inside* a group is always smaller than the space *between* groups: proximity is the grouping.
3. **One type scale, two families at most.** A short list of sizes with fixed line heights, weights 400 / 500 / 600 only (never fake a bold the font doesn't ship). Body line length 60 to 72ch. `text-wrap: balance` on headings, `pretty` on paragraphs, `tabular-nums` on any number that changes or aligns.
4. **One accent.** Neutrals do the work; the accent marks the single primary action or the current item in a view. Semantic colours (danger, warning, success, info) are used only for their meaning. Colour is never the only signal: pair it with an icon, text or shape.
5. **Contrast is a rule, not a check at the end:** text 4.5:1 (large text 3:1); UI component boundaries, icons that carry meaning and focus rings 3:1 against what they sit on (WCAG 1.4.11).
6. **Hairline-first depth.** Structure comes from 1px borders, spacing and surface steps. Allow at most three elevation levels (flat, raised with hairline, floating with shadow) in one view.
7. **Every component has every state** (`references/states.md`), designed once as tokens, not per component. Hover only where hover exists; keyboard focus gets the same attention as hover; disabled looks disabled and says why; loading keeps the layout still; empty explains and offers a next step; errors say what happened and how to fix it.
8. **Focus is always visible.** One system-wide `:focus-visible` double ring. Never remove an outline without a replacement. Sticky headers must not hide the focused element (`scroll-padding`).
9. **Targets are big enough:** at least 24 x 24 CSS px (WCAG 2.2 AA), 44 x 44 for primary touch controls. Spacing can satisfy it; shrinking can't.
10. **Layout reflows, components adapt to their container.** Mobile-first; three layout steps (phone, tablet, desktop). A card or toolbar that appears in several places uses a container query, not a viewport breakpoint. Grids use `minmax(0, 1fr)`, children of flex and grid get `min-width: 0`.
11. **Empty space is part of the design.** Decide the empty space first (margins, gaps around the primary action, the first screen), then fill. A screen with nothing to say is allowed to be quiet.
12. **Test the awkward content:** zero items, one item, a thousand items, a 60-character name, a missing image, an error, text 200% larger, a language with long words. A design that only works with perfect data isn't done.
13. **Respect the user's settings:** `prefers-reduced-motion`, `prefers-color-scheme` (and `color-scheme` set so form controls match), `prefers-contrast`, forced colours, browser zoom and text size. Use relative units for type and spacing in product UI.
14. **Forms are wired, not painted:** a visible label bound to its input, helper text, `aria-invalid` and `aria-describedby` for errors, `:user-invalid` styling after interaction, the right `type` and `autocomplete`, 16px minimum font in inputs on phones.
15. **Details are rules too:** optical alignment of icons and text, one icon size family, aspect-ratio boxes and colour placeholders for images, no layout shift on hover, truncation with a way to read the rest (`references/polish.md`).
16. **No brand or client specifics** in reusable code or docs: placeholder names, copy and colours.

## Never do

The short list; the long one with reasons is in `references/polish.md`.

- Never `outline: none` (or `:focus { outline: none }`) without a visible `:focus-visible` replacement.
- Never use a placeholder as a label, or an unlabeled icon button.
- Never show information only on hover, or only in a tooltip.
- Never use a value outside the scales (a 13px font, a 7px margin, a one-off hex).
- Never use more than one accent, two type families or three elevation levels in a view.
- Never rely on colour alone for state, status or errors.
- Never put giant display type or full-height hero images in a dashboard, a form or a checkout.
- Never disable a submit button without saying why; never show a validation error before the person has tried.
- Never use `100vh` for full-screen blocks on phones (use `svh` or `dvh`).
- Never trap focus or scroll behind a dialog, and never leave a dialog without Escape.
- Never shift the layout when a state changes (hover borders, loading spinners, error text without reserved space).
- Never animate layout properties or large blurs (see web-motion).

## Quality checklist (run before calling it done)

- [ ] Every size, colour, radius, shadow and z-index in the code is a token; search the diff for raw px and hex values
- [ ] Spacing follows the scale; proximity groups things (space inside < space between)
- [ ] Text contrast 4.5:1, UI boundaries and focus rings 3:1, in light and dark; checked with the demo's contrast tool or a browser audit
- [ ] The state matrix is complete for every interactive component: default, hover, focus-visible, active, disabled, loading, empty, error (and selected, success where relevant)
- [ ] Tab through the whole page: the order makes sense, the double focus ring is visible on every background, nothing is hidden behind a sticky header
- [ ] Forms: each input has a bound label; errors appear after interaction, are announced, say how to fix, and keep the person's input
- [ ] Targets are at least 24px (44px for primary touch controls)
- [ ] Reflow at 320, 375, 768, 1024, 1440 and with 200% text size: no sideways scroll, no clipped text
- [ ] Test content: empty, one, many, very long, missing image, error
- [ ] Dark mode (if offered): surfaces lift instead of invert, accent contrast re-checked, shadows replaced by borders
- [ ] Reduced motion, high contrast and forced colours still show every state
- [ ] Hover effects only under `(hover: hover)`; nothing important depends on hover
- [ ] Only one accent, two families, three elevations in any single view
- [ ] The designer's answers above are respected and written down

## Reference files

- `references/tokens.md`: spacing, type, colour (OKLCH, roles, contrast), radius and shadow, z-index, with CSS, Tailwind 4 `@theme` and Tailwind 3.4 wiring
- `references/states.md`: the state matrix, focus system, forms, loading, empty and error patterns, with CSS
- `references/layout.md`: grid, breakpoints, container queries, fluid type, empty space, hierarchy, long-content rules
- `references/showcase.md`: the showcase dialect (em = 1vw layout, hairline structure, display type) and what to borrow for product UI
- `references/polish.md`: premium details, accessibility settings, the full never-do list, upgrades beyond the basics
- `references/pitfalls.md`: what a real project got wrong or fragile, and the fix
