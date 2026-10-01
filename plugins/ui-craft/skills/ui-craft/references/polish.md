# Polish: the details that make UI feel premium

Premium is mostly **the absence of small mistakes**. This list is meant to be walked through on every
screen. Items link back to the rules in `SKILL.md`, and to web-motion for anything that moves.

## Alignment and rhythm

- **Optical alignment:** icons next to text are centred on the cap height, not the line box; a play triangle sits a little right of centre; an `x` in a circle is optically centred, not mathematically.
- Text in buttons, inputs and tabs shares one baseline across the row; don't mix 14px labels with 16px values in the same line.
- **Round to the grid:** positions and sizes land on whole CSS pixels or the 4px scale; half pixels blur hairlines. On high-density screens a `1px` border is still `1px`.
- Make **corner radii concentric** (inner = outer − padding). Align the first text line of side-by-side cards.
- **One icon family**, one stroke weight (1.5px at 20px), three sizes (16, 20, 24). Never mix filled and outlined icons in one control group.

## Type details

- `text-wrap: balance` for headings and captions, `pretty` for paragraphs; `font-synthesis: none`; `tabular-nums` for changing numbers; `font-feature-settings: "ss01"` and the like only when intended.
- Real typographic characters: ’ “ ” — … × − and a non-breaking space between a number and its unit (`10 kg`), or after a short word at the end of a line.
- Don't letter-space lowercase body text. Do open uppercase labels slightly.
- Link text says where it goes; never “click here”. Buttons are verbs.
- Truncate with an ellipsis and let people read the rest (title, expansion).

## Surfaces and images

- Images sit in `aspect-ratio` boxes with `object-fit: cover` and a **colour placeholder** that matches the photo's average colour; set `width` and `height` or the ratio so nothing shifts. Rounded images use the card's radius minus its padding.
- A hairline inner border (`box-shadow: inset 0 0 0 1px oklch(0 0 0 / 0.08)`) stops pale photos from bleeding into a pale background.
- Avatars are circles, thumbnails share one ratio, logos are optically sized (a wide logo and a square logo don't share a height).
- Dark mode dims bright photos slightly (`filter: brightness(0.9)` on the image, not on large areas, or a gentle overlay).

## Interaction details

- **No layout shift on state change:** a border that thickens on hover pushes neighbours; use an outline or inset shadow. Reserve space for error text.
- Hover transitions 120 to 160ms, press feedback within 100ms, no transition on the properties people don't see change. Cursor `pointer` on things that act, default on everything else; text-selection stays on content.
- **Big hit areas:** extend the clickable area with padding or a pseudo-element, never by shrinking the visible control smaller than 24px.
- **Toggle, tab and menu state is persisted** (URL for tabs and filters, storage for preferences) so back and reload behave.
- **Scroll:** `scroll-padding` for sticky headers, `scroll-margin-top` on anchor targets, `scrollbar-gutter: stable` on pages whose content height changes (no side-to-side jump), `overscroll-behavior: contain` in modals and inner scrollers, `scroll-behavior: smooth` only without reduced motion.
- **Selection and form chrome match the theme:** `::selection` in the accent at low alpha, `accent-color` on native checkboxes and ranges, `caret-color`, `color-scheme` so scrollbars and date pickers aren't white in dark mode.
- `-webkit-tap-highlight-color: transparent` only if you replace it with your own pressed state.
- Skeletons keep the real layout; shimmer is slow (1.6s+), low contrast, and static for reduced motion.
- Toasts: 4 to 6s, pause on hover and focus, one at a time, never the only record of an important result.

## Accessibility settings (design for them, don't just survive them)

- `prefers-reduced-motion` (web-motion), `prefers-color-scheme` (+ `color-scheme`), `prefers-contrast: more` (use solid borders instead of hairline tints, stronger text, no translucent fills), `forced-colors: active` (use system colours; keep borders so controls don't vanish; don't rely on `box-shadow` for focus, since it is removed in forced colours; the outline in the focus system survives).
- Zoom and text size: `rem`-based type in product UI; test 200% text and 400% zoom.
- Language: `lang` on `<html>`, `dir` handled with logical properties (`margin-inline-start`, `padding-block`, `inset-inline`), not left and right, if the product may ever be translated.

## The never-do list (with reasons)

1. **`outline: none` without a replacement.** Keyboard users lose their place; it is a WCAG 2.4.7 failure.
2. **Placeholder as label.** It vanishes on input, has low contrast, and isn't reliably announced.
3. **Hover-only information or actions.** Touch and keyboard users never see it.
4. **Off-scale values** (13px, 7px, a one-off hex). They are how consistency dies, one pixel at a time.
5. **More than one accent, two families or three elevations in one view.** Everything is emphasis, so nothing is.
6. **Colour as the only signal** (a red border for error, a green dot for “online”).
7. **Giant type and full-height images in dashboards, forms and checkouts.** The dialect doesn't fit the job.
8. **Disabling a submit button without saying why.** People can't fix what they can't see.
9. **Validating on every keystroke before the first blur.** It shouts at people while they type.
10. **`100vh` for full-screen blocks on phones.** The first screen jumps. Use `svh`.
11. **Trapping focus without an exit, or scrolling the page behind a dialog.**
12. **Layout shift on hover, loading or error.**
13. **Animating `width`, `height`, `top`, `left`, large `filter` or `box-shadow`** (web-motion).
14. **A tooltip as the only place an important fact lives.**
15. **Pure black on pure white for long text**, or a long paragraph centred or at full desktop width.
16. **Stacked decoration:** a gradient, a shadow and a border and a glow on one surface.
17. **Text below 12px, or below 4.5:1** (decorative exceptions must be hidden from assistive tech).
18. **Raw error codes, “Something went wrong” as the only message, or losing what the person typed.**
19. **A fake bold** (asking for a weight the font doesn't ship).
20. **Duplicating states per component** instead of using the shared tokens.
21. **Shipping with only the happy-path content**: no empty, one, many, long, missing-image or error test.

## Upgrades beyond the basics

Things the studied project didn't do and that raise quality for little cost:
1. **Single tokens file in OKLCH with role names and `@theme inline`** (Tailwind 4) so spacing, colour, radius and focus can't drift, plus dark mode through one switch.
2. **A system-wide focus ring and `scroll-padding`**, replacing the global outline reset.
3. **Wired forms** (`useId`, `aria-describedby`, `aria-invalid`, `:user-invalid`) in one `Field` component everything reuses.
4. **Container queries for cards and toolbars**, and `text-wrap: balance / pretty` globally.
5. **A state gallery page** that renders every component in every state with forced states, scanned by an automated accessibility check and a screenshot diff, so a regression in a focus ring or a disabled style is caught the day it happens. (`demos/ui-craft/` is a small version of it.)
