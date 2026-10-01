# Pitfalls

Found by studying a real project: a Next.js portfolio of about 25 pages (showcase pages, a shop-like
filter UI, a landing page with a contact form, shadcn-style form components, three long guide pages)
and by building the demo. The numbers were counted in the source and in a live browser; names removed.

## What worked well (keep doing it)

- **Tokens as CSS variables with semantic pairs** (surface and its foreground, border, input, ring, a base radius that derives a scale) and Tailwind reading them. No raw hex colours in utility classes at all (0 found).
- **Each showcase page owned a tiny, consistent token set** (paper, ink, hairline, one accent, one gutter in em) and held to it: the pages look intentional.
- **A single focus-visible ring on the form inputs and checkboxes**, with `disabled:cursor-not-allowed disabled:opacity-50`: the right shape, applied to two components only.
- **Layout vocabulary:** a 4 / 8 / 12 column grid with a shared gutter variable and three breakpoint helpers.
- **Tabular numbers (15 files), `text-wrap` (6)** and masked text with descender padding in places that needed it.
- A shared easing and duration variable set, and per-page guides that wrote their rules down.

## What was fragile or wrong

| Found | Why it matters | Fix |
| --- | --- | --- |
| A global reset `:focus { outline: none }` plus `button, input { outline: none; border: none; background: none }`, and **22 more `outline-none` / `outline: none`** against 33 `focus-visible` rules | Most pages showed no focus at all; keyboard users lose their place | Delete the reset. One system-wide `:focus-visible` double ring (`states.md`) |
| **106 uses of `100vh` / `h-screen` / `min-h-screen`, 2 of `svh` or `dvh`** | On phones the first screen jumps as the address bar moves | `min-height: 100vh; min-height: 100svh` as a shared utility |
| **177 `hover:` utilities, 2 `(hover: hover)` gates** | Hover states stick on touch screens after a tap | Gate hover with `@media (hover: hover) and (pointer: fine)` (a Tailwind v4 `hover:` variant already does this; v3 doesn't) |
| A form field component rendered `<label>` with no `for`, inputs had no `aria-invalid` or `aria-describedby`; only 3 `htmlFor` in the whole source | Screen readers can't connect label, input and error; clicking the label doesn't focus the field | Bind with `useId()`; link errors with `aria-describedby`; set `aria-invalid` |
| **66 arbitrary font sizes** (`text-[13px]`, `text-[11.5px]`, `text-[9px]`) | There is no type scale in practice; sizes drift page by page | Close the scale: define 8 sizes and ban arbitrary ones in lint |
| Tiny label text: **8 to 9px at 2.5:1 contrast** (a header tagline and numbered nav hints) | Below the 12px floor and far below 4.5:1; unreadable for many people | 12px minimum, ink-faint at 4.5:1; if it is decoration, hide it from assistive tech and keep the real label readable |
| The root font size changed with the window width on every page (`html { font-size: calc(10 / 1920 * 100vw) }`), while components used `rem` Tailwind spacing | Form controls, tooltips and dialogs scaled with the window (60% of design size on a laptop), and the browser's text-size setting was ignored | Keep `html` at the browser default; do the fluid scaling in a wrapper that opts in (`showcase.md`) |
| Three different token naming schemes across guides and pages (`--x-ink`, `--y-ink`, `--background`) with no shared spacing or state tokens | Each page re-solves states and focus | One `tokens.css` for roles, spacing, state and focus; page-level tokens may only add, not redefine |
| A named z-index scale existed, but its steps were 100, 1000, 10000 and 100000 | Every new layer needs another order of magnitude, and two systems each add “one more” | Steps of 10 (`tokens.md`) |
| A hero headline whose second line was a thin outline-only stroke over a patterned background (observed, not measured) | Fine as decoration, weak as information | Decorative type must not carry the only copy of a message |
| Pills, soft shadows and filters (a shop-like UI) lived beside hairline editorial pages with no stated rule | Both are good; mixing them without a boundary looks like two sites | Choose a dialect per route (`SKILL.md`) and share only roles, spacing steps, states and focus |

## Found while building the demo and the guides

- A sticky stage silently stopped sticking when an ancestor had `overflow: hidden`. Use `overflow: clip`.
- Setting a start transform in CSS and animating the same property in GSAP stacked the two offsets. One owner per property (web-motion).
- `clearProps: 'all'` on an element also wiped the inline styles React had set (a backdrop colour). Clear only the properties you animate.
- A grid cell with a wide child grew past the phone width until `min-width: 0` was added to the cell.
- A tooltip near the right edge widened the whole page on a phone. `overflow-x: clip` on the page root, and tooltips that flip.
- The webfont shipped two weights (400, 500); asking for 600 produced a synthesised bold. `font-synthesis: none` and only ask for what ships.
- A reset that unset `<pre>` removed code blocks' layout. Resets need an exception list (`pre`, `blockquote`, `summary`).
