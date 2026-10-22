# Pitfalls

Found while building three Astro projects (a ported 9-page export, a multi-page studio site, an immersive
WebGL site) and a learn guide inside each. Problem · how it showed up · fix.

## Router and Scope

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Listeners and triggers created at module load | They multiplied with every navigation | Everything per page goes through `Scope`; revert in `astro:before-swap` |
| Runtime `<html>` state lost on swap | Smooth scroll, `is-apple` and `--vh` vanished after the first navigation | Copy className and style onto the new document in `before-swap` |
| Click-blocking wipe layer stayed until the intro ended | Visitors could not click for a second | Remove `is-navigating` when the wipe has drained |
| Splash re-rendered on every page | A flash of white curtain | Remove `[data-splash]` from the new document in `before-swap` |
| First load handled twice | `astro:page-load` also fires on first load | Return early unless `is-navigating` is set |
| Height-only resizes (mobile toolbars) refreshed triggers | Jumping scenes while scrolling on phones | Debounced resize that ignores height-only changes on touch |
| Triggers measured before fonts/images settled | Reveals fired 40 px early on some loads | `await document.fonts.ready`, refresh on `load`, reserve image space |

## Scroll

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Two clocks (Lenis rAF and GSAP ticker) | Scrub jitter | `autoRaf: false` and drive Lenis from `gsap.ticker` |
| Anchors and Back/Forward off by the old scroll | Content jumped after a swap | `lenis.resize()` then `lenis.scrollTo(scrollY, { immediate: true, force: true })` |
| Scroll box inside an overlay did not scroll | Lenis captured the wheel | `data-lenis-prevent` |
| Sticky stopped sticking | An ancestor had `overflow: hidden` | `overflow: clip` |

## Immersive canvas

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Shader compiled on first scroll | A long frame when a new section appeared | Upload composite materials and render every section once before the loader leaves |
| Rendering every section every frame | Frame time scaled with section count | Render only the one or two sections overlapping the viewport |
| Pixel ratio too high for several full-screen passes | Throttled laptops | Cap DPR and use adaptive DPR with a flip limit |
| Frame-dependent smoothing | Different speed at 120 Hz | `lerpFPS` with the clock ratio |
| Port to WebGPU assumed easy | GLSL, `onBeforeCompile` and MRT do not run on the node renderer | Stay on WebGL2 for parity; port one section to TSL as an experiment |
| Library renames between three versions | Black materials after upgrading | Adapt and comment each change; test one scene at a time |
| Too many WebGL contexts in a guide | Old contexts dropped | One canvas per open chapter; `dispose()` and `forceContextLoss()` on tab change |

## Study / port

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Importer re-run | Hand edits overwritten | Treat the importer as one-way; record it in the README |
| "Useless" empty wrappers deleted | `:nth-child` hover rules stopped matching | Keep structural embeds |
| Malformed CSS in an export | lightningcss build error | Rewrite to the CSSOM the browser actually produced, with a comment |
| Second canvas created for a Rive file | Page height changed | Reuse the canvas already in the markup |
| Preview pane hidden | Animations looked frozen, screenshots blank | Headless Chromium with a real frame clock |
| A dev-only dependency cache | 504 on first load after installing a package | Verify on `build` + `preview` |
| Guide controls driven by the ticker | Their own change handler stopped playback | Silent `dials.set(name, v, true)` |
| Aspect-ratio stage with a `min-height` | A box wider than the phone | Use a clamped `height` |
