# Study builds, a /learn guide, and verification

## Study-build conventions

- **Private.** README opens with "do not deploy"; `robots noindex`; copy rewritten; credits to the original makers.
- **Assets**: a `fetch-assets` script downloads originals into git-ignored folders (`public/ref/**`, `src/ref-svg/*.svg`)
  from the media manifest; the build still works without them (placeholders).
- **Evidence kept apart**: captures, decoded bundles, notes, comparison tools in `reference/` or `_study/`
  (git-ignored when large). `NOTES.md` records how each piece was decoded.
- **README contract**: how to run, routes, how the page is put together (area → files → what it does), decisions
  (what was kept on purpose, what differs), verification, known residuals (random or time-based parts).
- Ports and dev servers: pick a fixed, unusual dev port per project (`server.port`), and say so in the README.
- Type-check with `astro check`; if the TypeScript major is newer than the checker supports, pin TS to the supported major.

## Verification

1. **Geometry first**: numeric equality of every section's `top`/`height` on every page and breakpoint.
2. **Same moment**: align both timelines to `DOMContentLoaded`; compare screenshots at identical times and scroll
   fractions; hover frame strips (capture every ~25 ms); sample computed transforms or Lottie frames.
3. **Scroll-snap and virtual-scroll pages** block naive scrolling tools: page through steps with keys/wheel events.
4. **Performance**: record frame times through the whole page in a real-GPU Chromium (`--use-angle=metal
   --enable-gpu --ignore-gpu-blocklist` on macOS); report p99 and count frames over 33 ms.
5. **Lifecycle**: five round trips between pages; listeners, ScrollTriggers, canvases and GPU memory stay flat;
   WebGL context count stays below ~16.
6. **A hidden preview pane pauses `requestAnimationFrame`**: use it for layout only, and a headless browser for motion.
7. Immersive: recorded scripted sessions on the live site and the clone (intro, each section at rest, transitions,
   project page, phone viewport) compared in pairs.

## A /learn guide inside the project

Follow create-learn-page; the Astro-specific parts:

- Route `src/pages/learn/…` with its **own layout and stylesheet** (no host CSS), chapters as tabs synced to the hash.
- `src/learn/` holds `kit/` (Demo, Dial/Choice/Switch, Code with Shiki and highlighted lines, Callout, Term,
  Flashcards), `demos/` (one module per chapter: `export default mount(panel) => dispose`), `data/` (chapters,
  glossary, cards) and `runtime/` (shell, dials, ticker).
- Lazy chapters with `import.meta.glob('../demos/*.ts')`; only the open chapter mounts, demos run on one ticker,
  pause off screen and dispose on tab change. Dials are plain inputs read through a `dials(root)` helper; frame
  loops read `d.v.x`; values a demo drives itself are set **silently**.
- Demos import the project's real helpers read-only (easing, loaders, engine utilities) and its real assets.
- Verify with a headless script: Play buttons advance, every chapter mounts without console errors, no sideways
  scroll at 1440 and 375, screenshots saved for review.
