# Layout: grid, breakpoints, containers, space

## Grid

| | Phone (< 768) | Tablet (768 to 1199) | Desktop (≥ 1200) |
| --- | --- | --- | --- |
| Columns | 4 | 8 | 12 |
| Gutter (gap) | 16 | 24 | 32 |
| Page padding | 16 | 24 | 32 |
| Max content width | full | full | 1200 to 1320, centred |

- **Three layout steps are enough.** More breakpoints mean more states to test. Tailwind's defaults (640, 768, 1024, 1280, 1536) are fine too; choose one set and never mix.
- Mobile-first: write the phone layout without prefixes, add `md:` and `lg:` to widen. (`sm:text-center` centres only from `sm` up: a classic slip.)
- Build with CSS Grid for the page and flex for rows. Columns: `grid-template-columns: repeat(12, minmax(0, 1fr))`. **`minmax(0, 1fr)` and `min-width: 0` on children** stop long words and wide tables from blowing a column out.
- **Use `gap`, not margins**, between siblings. Margins are for separating groups.
- Align to **few edges**: one left edge for text, one for the page. Items that nearly align look like mistakes; make them align or make the difference obvious.
- Prose is its own column: `max-width: 68ch`, left aligned, never full width on desktop.
- **Asymmetric splits read as designed:** 1/3 + 2/3, 5/12 + 7/12, instead of two equal halves. In product UI use a fixed sidebar (240 to 280) plus fluid content.

## Container queries: components adapt to their container

A card, toolbar or stat block appears in a sidebar, a modal and a full-width page. A viewport breakpoint can't know which. Make the parent a container and query it:

```css
.card-host { container-type: inline-size; container-name: card; }
.card { display: grid; gap: var(--space-3); }
@container card (width >= 28rem) { .card { grid-template-columns: 8rem 1fr; } }   /* image left when there is room */
.card h3 { font-size: max(1.25rem, 1rem + 2cqi); }                                   /* type scales with the container */
```
- Tailwind 4 has them built in: `@container` on the parent, `@md:flex-row` on the child (`@max-md:`, named `@container/main`, `@sm/main:`).
- Units: `cqi` (1% of the container's inline size), `cqw`, `cqh`, `cqb`. Use `container-type: inline-size` (not `size`, which needs a fixed height).
- Use **media queries for page-level layout** (nav, columns, gutters) and **container queries for components**.

## Fluid type and space (showcase only, and headings)

```css
h1 { font-size: clamp(2.5rem, 1.2rem + 6vw, 8rem); line-height: 0.92; text-wrap: balance; }
```
Keep a `rem` in the middle term so users' text-size settings still scale it. Body text in product UI is not fluid.

## Viewport units on phones

`100vh` is the *large* viewport (address bar hidden), so full-screen blocks jump on mobile. Use **`100svh`** for “always fits”, **`100dvh`** for “follows the bars” (only where the jump is acceptable), `100lvh` rarely. Stage-like sticky blocks use `svh`. Add a `vh` fallback line before it.

```css
.screen { min-height: 100vh; min-height: 100svh; }
html { scroll-padding-top: var(--header-h); }   /* anchor links and focus don't hide under a sticky header */
```
Add `padding: env(safe-area-inset-*)` on fixed bars for notched phones.

## Hierarchy and empty space

- **Decide the empty space first.** Set page margins, section gaps and the space around the one primary action; fill the rest. If everything is equally close, nothing is important.
- **One focal point per view.** One primary action, one heading that is clearly the largest. If two things shout, neither is heard.
- Hierarchy comes in this order: **size, space, position, weight, then colour.** Colour is last. A grayscale screenshot should still read correctly.
- **Reading order = visual order = DOM order.** Don't reorder with CSS (`order`, grid areas) in ways that make Tab or screen-reader order differ from what is seen.
- **Density is a setting, not a style:** product UI offers compact (row 32), default (40) and comfortable (48). The tokens don't change; the row padding does.
- White space isn't “wasted”: a hero that is a headline at the bottom of a full screen, a list with generous gaps, a form that gives each field air all read as higher quality than the same content packed.

## Long content, many items, no items

Design with the bad data first.
- **Names and titles:** 60 characters, one very long word (a URL, a German compound), no spaces. Truncate with `text-overflow: ellipsis` (one line) or `line-clamp` (several) **and** a way to read all of it (title, tooltip on focus too, or expand). `overflow-wrap: anywhere` for URLs.
- **Numbers:** locale formatting through `Intl.NumberFormat`; tabular digits; reserve width for the largest value.
- **Lists:** 0 (empty state), 1 (does the layout look broken with one card in a 3-column grid?), 1000 (virtualise or paginate; keep scroll position).
- **Images:** missing, slow, very wide, very tall. Boxes use `aspect-ratio` and `object-fit`, with a colour placeholder.
- **Text size and zoom:** layout survives 200% text size and 400% zoom (320 CSS px wide) without two-dimensional scrolling (WCAG 1.4.10) and without clipped text. Don't set heights on text containers; use `min-height`.
- **Tables:** sticky header, `min-width` on the table inside a horizontal scroll box with a visible edge shadow, or switch to stacked cards on phones. Right-align numbers.

## Sticky, fixed and overlays

- Sticky headers: `scroll-padding-top`, and a tight height (48 to 64). Never stack three sticky layers.
- Sticky positioning fails silently if any ancestor has `overflow: hidden | auto | scroll`; use `overflow: clip` to hide overflow without making a scroll container.
- Dialogs lock page scroll (`overscroll-behavior: contain` on the dialog, `overflow: hidden` on the page only while open), trap focus, close on Escape and return focus.
- A banner or toast must not cover the only way to dismiss it, or the focused control.
