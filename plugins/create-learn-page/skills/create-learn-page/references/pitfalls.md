# Pitfalls

Found while building a 13-chapter guide with 25+ demos inside an existing Next.js 16 site (names
removed). Each row: problem · how it showed up · fix.

## Checks and tooling

| Problem | How it showed up | Fix |
| --- | --- | --- |
| A check that never ran | A type-check wrapped in `timeout` (not on macOS) printed nothing, read as "clean"; the real run found 5 errors | Print exit codes; test the check once with a known error |
| Lint left to the end | 13 errors across files at the finish | Write lint-safe patterns from the start (below) |
| Dev-tool overlays in screenshots | A render-highlighting tool drew boxes over every demo | Turn it off before visual checks |
| Preview pane hidden | Screenshots time out | DOM checks + headless browser (`verification.md`) |

## Host site

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Root font-size scales with the window | All `rem` spacing (Tailwind `p-4`…) came out ~60% of the design | `html:has(.guide-root) { font-size: 16px; }` scoped to the guide |
| Global reset `pre { all: unset }` | Code panels rendered inline, one background per line | `.guide-root pre { display: block; }` |
| Styles imported inside the lazy chunk | After a hot reload the guide showed unstyled until a full reload | Import the stylesheet in the route file |
| Existing page loader/transition components | Links from the guide triggered the host's transition in odd states | Use the site's own Link component for internal links; plain `<a target="_blank">` for "open the original" |

## Layout

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Hidden tooltips near the right edge | Page width 467px on a 375px phone | `overflow-x: clip` on the guide root |
| Masked title lines clip descenders | "g" and "y" cut off at line-height 0.95 | Pad the mask boxes and cancel with negative margin |
| SVG diagrams unreadable on phones | Tiny text | Put wide diagrams in a horizontal scroll box with a min-width |

## React, GSAP and the frame loop

| Problem | How it showed up | Fix |
| --- | --- | --- |
| "Skip the first effect run" guards | React's dev double-mount ran the guarded code anyway | Compare against the last applied key instead |
| `gsap.killTweensOf(obj)` | Killed an unrelated running tween on the same object (particles stayed in a cloud) | Pass the property list: `killTweensOf(obj, 'morph,burst')` |
| Frame loop reads `ref.current` | `Cannot read properties of null` after unmount | Use the element/objects captured when the scene was set up |
| setState inside an effect body | Lint error (`set-state-in-effect`) and an extra render | Lazy `useState(() => …)` initialisers for storage/hash; update state in event handlers; effects only write to the outside world |
| `onSplit: (self) => gsap.from(…)` | Lint: promise-returning callback (tweens are thenable) | Keep it (SplitText needs the tween back) with a one-line disable comment explaining why |
| Arrow bodies that return tweens in `forEach` | Same lint rule | Use a block body `{ scrambleIn(el); }` |
| Text like `////// 01` in JSX | Lint reads it as a comment | Wrap in `{'////// 01'}` |
| Split text before fonts load | Wrong line breaks, a console warning | `autoSplit: true` with `onSplit`, or wait for `document.fonts.ready` |
| SVG `<g>` with rotateX/rotateY | No 3D tilt on SVG groups | Put each layer in an HTML element with `perspective` on the parent |

## 3D demos

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Custom ShaderMaterial looks darker than CSS colours | Raw linear output on screen | End fragment shaders with `#include <colorspace_fragment>` (and tone mapping include if needed) |
| Too many WebGL contexts | Browsers drop old contexts past ~16 | Lazy chapters; `forceContextLoss()` on unmount |
| Allocations in the frame loop | GC hitches | Reuse vectors made in setup |
