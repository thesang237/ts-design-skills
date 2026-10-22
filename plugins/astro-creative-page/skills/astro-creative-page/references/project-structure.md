# Project structure, boot order, tokens

Distilled from three Astro builds: a component-per-section port of a no-code export (9 pages), a
multi-page studio site with client-side transitions, and a single-canvas WebGL experience.

## Folders

```
astro.config.mjs        compressHTML, devToolbar off, fixed dev port; (immersive) vite worker/es2022
public/assets/          images, video, fonts, lottie/rive/3D data: used unchanged, URLs stay absolute
src/
  layouts/              Base.astro (meta, fonts preload, <script> boot) + one layout per page family
  pages/                one file per route; dynamic routes use getStaticPaths from content
  components/<page>/    one component per section, named for what it is (MessyCollage, KeyframeLanes)
  components/shared/    header, footer, splash, overlays, structural embeds
  content/*.ts          copy + media manifest (single source; also read by the fetch script)
  styles/               tokens.css (grid, spacing, colour), base.css, fonts.css
  scripts/ (or app/)
    core/               gsap.ts, scroll.ts, env.ts, scope.ts, page.ts, router.ts
    anim/               timelines: sequence (splash/enter), scenes (scroll), wipe, intros
    ui/                 one module per interaction (menu, tilt, decode-hover, slider…)
    runtime/            small loaders (lottie, rive, easing) shared by pages
    pages/<page>/       page-specific interactions
    gl/ audio/          canvas renderers, sound engine
  learn/                (optional) /learn guide: kit, demos, data (imports from scripts read-only)
scripts/                node tools: fetch-assets, copy-libs, decode helpers
reference/ or _study/   captures, notes, comparison tools (git-ignored when large or third-party)
```

## Boot order (write it at the top of `main.ts`)

1. Once per visit: `initEnv` → scroll owner (`initStickySections`, Lenis) → persistent UI (menu, strings,
   overlay, hover effects, email copy) → `initRouter(getPage, setPage)`.
2. `await document.fonts.ready`, then `page = initPage()` (returns a `Scope`).
3. First visit only: splash → wait for the start click (this also unlocks audio) → enter timeline.
   `?skip` jumps straight past it. Subsequent pages are handled by the router, not by `main.ts`.

## Layouts

- `Base.astro` holds `<ClientRouter />` (multi-page), the persisted elements (`transition:persist`) and one
  `<script>import '../scripts/main'</script>`. Put `transition:animate="none"` on `<html>` when you animate
  swaps yourself.
- Apply platform quirks **before first paint** with a tiny `is:inline` script (e.g. `is-apple`, `w-mod-touch`).
- A page-type prop (`data-page-type` on `<body>`) lets CSS and scripts branch without URL sniffing.
- For a script that must run at the top of `<main>` (an opening animation), inline it with `?raw` + `is:inline`
  so it starts while the rest parses.
- A reading page (`/learn`) gets its **own** layout and stylesheet: the host's resets and root font-size must not leak in.

## Tokens

- **Fluid root, reference pixels.** `html` font-size scales with the viewport (for example 18px at 1920,
  16px at 1024, 14px at 375, never below 14px) and every size is `calc(n * var(--px))` with
  `--px: calc(1rem / var(--base-px))`. Measured values from a reference then paste in unchanged.
- **Grid as variables**: `--cols`, `--gutter`, `--margin`, `--col`, `--span-n`, `--wrapper`; spacing steps
  (`--space-*`, `--pad-*`); minimum widths for narrow desktop windows (`--mw-2-cols`).
- **Colour, durations and curves as tokens**; curves also registered once in `gsap.ts`
  (`CustomEase.create('expoOut', …)`) and used by name.
- Breakpoints in CSS and in JS (`media.phone/tablet/wide/reduced` via `matchMedia`) must be the same list.

## `gsap.ts`: one registration point

Register plugins once (ScrollTrigger, SplitText, CustomEase, DrawSVG, Flip), `gsap.config({ nullTargetWarn: false })`,
create the named curves, re-export `{ gsap, ScrollTrigger, SplitText, Flip }`. Every module imports from
here, never from `gsap` directly.

## `env.ts`

`isTouch`, `media.*`, `--vh` set only when the **width** changes (mobile toolbars change the height all the
time), and a debounced `onResize` that ignores height-only changes on touch devices.

## Content and media

- One `media.ts` manifest (path, alt, dimensions, kind). Components read it; the fetch script reads it.
- Pages build from content arrays (`projects.ts`, `categories.ts`), including `getStaticPaths`.
- Missing private assets must not break the build: placeholders keep the right shapes.

## Porting an export (Webflow-style) into components

- Importer script once; **after that, hand-edit**. Re-running it overwrites edits, so record this in the README.
- Name components for what they are; keep structural wrappers the CSS depends on (`:nth-child` selectors count
  empty embeds).
- Replace the vendor runtime with small typed modules (a Webflow-compatible Lottie/Rive loader, GSAP for the
  few interaction-table entries); drop jQuery and vendor scripts.
- Keep `inlineStylesheets: 'never'` when comparing CSS byte-for-byte; lightningcss rejects malformed rules a
  browser tolerates: rewrite those to the behaviour the browser actually applied, with a comment.
- Verify geometry numerically: every section's `top` and `height` on every page equal to the reference.
