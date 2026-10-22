---
name: astro-creative-page
description: Use when building, porting or restructuring a creative / award-style website in Astro (7+), for example a multi-page studio or brand site with page transitions, persistent header and overlays, Lenis smooth scroll and GSAP ScrollTrigger sections; an immersive single-canvas WebGL / WebGPU experience whose scroll is virtual and loops; a Webflow or other export ported into typed components; a private study rebuild of a live site; or a /learn guide living in the same project. Provides the folder layout, boot order, the page Scope (one cleanup per page), the router lifecycle, persistent elements, tokens and grid, scroll ownership, the single-canvas engine pattern, loaders, quality tiers and verification. Motion values come from web-motion, page-transition recipes from page-transitions, 3D from 3d-web.
---

# Astro creative page

A creative site is two things at once: a **static, indexable shell** (Astro: routes, meta, markup,
fonts, content) and a **small runtime** (one clock, one scroll owner, one cleanup per page) that does
everything that moves. **Keep markup in components, motion in typed modules, numbers in tokens, and
make every page undoable.** Checked on 2026-10-22 against Astro 7.4, GSAP 3.15, Lenis 1.3, three.js r186.

Related skills (don't repeat them here):
- **web-motion**: easing, stagger, scroll mapping, reduced motion, performance.
- **page-transitions**: transition recipes (View Transitions, GSAP curtain, hand-over), loaders, accessibility.
- **3d-web**: scenes, shaders, quality tiers, fallbacks (React-oriented; the ideas carry over to vanilla three.js).
- **reference-match**: measuring and matching a live site. **create-learn-page**: the /learn guide. **ui-craft**: layout and states.

## Before writing any code: ask the designer

1. **Which kind of site?** Multi-page (routes, transitions between them) or one immersive canvas
   (routes are only deep links into one app)? This decides everything below.
2. Is this an original build, a port of an export, or a private study of a live site (never deployed)?
3. Desktop only, or phone too? Which breakpoints? Is a still-image / no-WebGL fallback required?
4. Smooth scroll wanted (Lenis), or native? Any scroll-hijacking (virtual scroll) allowed?
5. Sound? (If yes: off until a click, a mute toggle, muted when the tab is hidden.)
6. Does the project also get a `/learn` guide? Where may it live and what must never change?

## Pick the architecture

| | **Multi-page site** | **Immersive single canvas** |
| --- | --- | --- |
| Page | Real HTML per route, content in components | One shell page; `/` and deep links boot the same app |
| Scroll | Native document scroll + Lenis, ScrollTrigger | **Virtual**: wheel/touch/keys move a number; nothing scrolls |
| Motion | GSAP timelines, CSS, small canvases | One engine clock; sections rendered to textures and composited |
| Navigation | Astro `ClientRouter` + a wipe/hand-over; persisted header | In-app router (`history.pushState`) blocked during transitions |
| Cleanup unit | **`Scope`** per page (tweens, triggers, listeners) | Scene `dispose()` + engine-level event bus |
| Entry | Splash / loader, then an enter timeline | CSS-only loader until every scene is compiled and uploaded |
| Reference | `references/multipage-router.md`, `scroll-and-pinning.md` | `references/immersive-canvas.md` |

Both share `references/project-structure.md` (folders, boot order, tokens, content), the study and
verification workflow in `references/study-and-verify.md`, and `references/pitfalls.md`.

## Core rules

1. **Astro owns markup, routes and content; scripts own behaviour.** Sections are components; copy and
   media live in `src/content/*.ts` (one media manifest). Scripts are typed modules under `src/scripts`
   (or `src/app`), booted from one entry imported by the layout.
2. **One boot order, written down.** Once per visit: environment → scroll owner → persistent UI → router
   hooks. Per page: `initPage()` returns a `Scope`. First visit only: loader/splash → start gesture → enter.
3. **One Scope per page.** Everything a page creates (gsap context, ScrollTriggers, listeners, observers,
   timers, canvases) registers with it; navigation calls `scope.revert()` before the swap. No module-level
   listeners that belong to a page.
4. **One clock and one scroll owner.** GSAP's ticker drives Lenis (`autoRaf: false`) and any canvas;
   `lenis.on('scroll', ScrollTrigger.update)`. In the immersive pattern the engine clock broadcasts
   `prerender → render → postrender`. Never a second rAF loop.
5. **Persistent UI survives navigation** (`transition:persist`): header, construction lines, overlays, the
   wipe canvas. Runtime state on `<html>` (classes, CSS variables) is copied across in `astro:before-swap`.
6. **Numbers live in tokens.** Grid, spacing, durations, curves and breakpoints in `tokens.css` and one
   `gsap.ts` (registered plugins + named CustomEases). Sizes as `calc(n * var(--px))` when the page scales
   with the window. Breakpoint flags in JS mirror the CSS ones.
7. **Fonts first.** `await document.fonts.ready` before measuring, splitting text or building triggers;
   refresh ScrollTrigger after late image decodes and `load`.
8. **Gate on capability, always keep a fallback:** WebGL2 missing → a message; WebGPU missing → WebGL or a
   CSS `clip-path` version; reduced motion → short fades; no JS → readable content.
9. **Heavy work is warmed, not paid mid-scroll:** decode big images in idle time, compile and upload every
   scene once before the loader leaves, preload the one font or data texture the first frame needs.
10. **Adaptive quality.** Cap the pixel ratio, lower it when the average fps drops below ~30, raise it
    above ~60, stop after a few flips. Pause everything when the tab is hidden or the canvas is off screen.
11. **Interaction is blocked while a transition runs** (a `blocked` flag or `is-navigating` class that sets
    `pointer-events: auto; cursor: wait` on the wipe layer); scroll is locked and unlocked by the owner only.
12. **Study builds are private and reproducible.** Fetched assets live in git-ignored folders with a
    script that re-downloads them; copy is rewritten; the README says "do not deploy" and records the
    decisions (what was kept on purpose, what differs and why).
13. **Never edit the experience from its guide.** A `/learn` route imports helpers read-only.
14. **No brand or client specifics** in reusable code and docs: placeholder names, copy and colours.

## Quality checklist (run before calling it done)

- [ ] `astro check` (or `tsc --noEmit`) passes and you confirmed it really ran (print the exit code)
- [ ] Production build + preview behave like dev (dev can hide dependency-cache and CSS-order bugs)
- [ ] Every page: navigate in, out, back, forward, and reload halfway; no leaked listeners, triggers or canvases (count them before and after 5 round trips)
- [ ] First visit and repeat visit: splash/loader plays once; `?skip` (or equivalent) jumps past it for development
- [ ] Persistent elements keep state across navigation; `<html>` runtime classes survive the swap
- [ ] Scroll owner: wheel, touch, keyboard, scrollbar drag, anchor links, Back/Forward restore, resize; ScrollTrigger refreshed after fonts/images
- [ ] Phone: breakpoints, `svh/dvh`, height-only resizes ignored, no sideways scroll at 375 and 1440
- [ ] Reduced motion, no-WebGL and hidden-tab behaviours checked
- [ ] Frame times measured across the whole page on a real GPU (headless Chromium with GPU flags or a visible window); a hidden preview pane pauses `requestAnimationFrame`
- [ ] Immersive: scenes compiled before the loader leaves, composites only render the visible one or two sections, memory flat after 5 loops
- [ ] Study builds: assets git-ignored and re-fetchable, README states private use and the decisions made
- [ ] The designer's answers above are respected and written down

## Reference files

- `references/project-structure.md`: folders, boot order, layouts, content manifest, tokens and grid, `gsap.ts`, env flags, component-per-section ports of exports
- `references/multipage-router.md`: ClientRouter lifecycle, persisted elements, the page `Scope`, leave / swap / enter, wipe and intro hand-off, back/forward
- `references/scroll-and-pinning.md`: Lenis on the GSAP ticker, stacking sections, sticky `[data-stick]`, locking, custom scrollbar, refresh rules
- `references/immersive-canvas.md`: single-canvas engine, clock and event bus, virtual looping scroll, sections as render targets, composite, in-app router, loader, quality tiers, WebGL vs WebGPU
- `references/study-and-verify.md`: study-build conventions, fetch scripts, README contract, a /learn guide in the same project, verification scripts
- `references/pitfalls.md`: what broke or was fragile in real projects, with the fix
