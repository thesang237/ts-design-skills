# Immersive single-canvas experience (Astro shell + vanilla three.js)

The page is one canvas. Astro provides the shell, meta tags, the CSS-only loader and static deep-link routes;
an in-app engine does everything else. Chosen over React Three Fiber because the app is an imperative engine that
renders several composers per frame on demand: reconciliation would add overhead without changing a pixel.

## Shell

```astro
<body>
  <div id="app"><div id="webgl"></div></div>
  <div id="loader" aria-label="Loading"><div class="ascii"></div></div>   <!-- CSS only -->
  <script>import '../app/main.ts'</script>
</body>
```
Every route (`/`, `/portfolio/[project]/` via `getStaticPaths`) renders the same `<Base />`; the in-app router
maps the URL to a scene. Social meta lives in the layout; the canvas may sit in a closed shadow root.

## Boot (`main.ts`)

`initEnv` → capability gate (no WebGL2: message + remove loader) → `engine.init({ container, dpr, adaptiveDPR })`
→ `await preloadTextures()` → `new MainController()` → `await controller.ready` → fade the loader out
(250 ms / 750 ms) → `controller.start()`. Dev-only debug handle on `window`. An experimental second renderer
(WebGPU) behind `?webgpu` imports its own `main` lazily.

## Folders

```
core/        clock, event bus, input (pointer/wheel/keys), camera rig, Scene3D base, composers, audio, renderer, env, math
loaders/     texture manifest + modes, decoder worker pool, text layout
gl/          shader chunks, text mesh, GPGPU particles, fluid sim, raycast helpers
controller/  MainController (virtual scroll, section stacking, auto-centre, routing), composite materials, Router
scenes/<n>/  one folder per section; scenes/detail (project close-up), scenes/ui (orthographic overlay)
config.ts    all copy, colours, layout constants, projects, links
```

## Clock and events

- GSAP's ticker is the only clock. It broadcasts three phases per frame on a tiny event bus:
  `prerender` (logic) → `render` (draw) → `postrender`; the clock exposes `time`, `delta`, `ratio` (frame length
  vs 60 fps, clamped) and a rolling average fps published twice a second.
- Smoothing is frame-rate independent: `lerpFPS(a, b, k)` uses `ratio`; friction likewise.
- Use the bus for resize, visibility, router requests and fps; scenes subscribe in their constructor and unsubscribe in `dispose()`.

## Virtual, looping scroll

The page never scrolls. Input (wheel, touch drag, keys) moves a target position measured in **screens**.

- Two-stage smoothing: `targetY2` (input, clamped to a max lead) → `targetY1` (speed-limited lerp) → `y` (lerp).
  Track `velocity` (sum of |Δy| with friction) for shader effects.
- Sections are stacked end to end with lengths in screens (e.g. 2.35 + 2 + 5.5) and **loop** with a modulo; the
  viewport spans `[top, top + 1)`; at most two sections overlap it (`current` and `next`).
- Each section exposes `progress` (0..1 inside it), `height`, `isSceneVisible`, optional
  `initialScrollAutocenter` / `finalScrollAutocenter` and an `autoCenter()` hook.
- **Auto-centre after a pause** (~1.4 s idle): tween to the nearest section edge (`gsap.to(scroll, { y, ease })`),
  syncing targets in `onUpdate` so input does not fight it. Block input during route transitions and while a detail view is open.

## Sections as render targets, composited

- Every section owns a `SceneComposer` (half-float target, LUT grade). Each frame only the one or two visible
  sections render; their textures go to a **composite material** on a single fullscreen triangle that mixes
  them with an animated cut (progress = overlap, velocity feeds chromatic aberration / noise).
- The orthographic UI scene is drawn on top without clearing; then final post (bloom, SMAA, sRGB output).
- Compile everything before the loader leaves: `main.upload()` for composite + intro materials, one `render()`
  of every section. The first scroll must never compile a shader.
- Detail view (project close-up) is another composer faded in by a `uDetailProgress` uniform; sections stop
  rendering when it is 1.

## Router

A 60-line history router: patterns → `{ scene, params }`, emits `routerRequestSwitch`; `blocked` while a
transition runs; unknown URLs redirect to home; `popstate` handled. The controller owns the transitions.

## Quality

- Cap DPR hard (≈1.15 up to 2x screens, 1.5 above) because several full-screen passes run per frame.
- **Adaptive DPR**: after a warm-up, every few seconds compare the average fps: < 30 lowers the multiplier by
  0.1 (min 0.6), ≥ 60 raises it back to 1; stop after ~4 direction flips. Ignore samples while hidden.
- Pause rendering when the tab is hidden; audio muted. Warm caches before they are needed.
- Cap work per section: instance counts, particle textures, shadow maps only where visible.

## WebGL vs WebGPU decision

Ship `WebGLRenderer` (WebGL2) when the look lives in hand-written GLSL, `onBeforeCompile` patches, UBOs or MRT
GPGPU: `WebGPURenderer` runs only node (TSL) materials, so WebGPU means rewriting every shader and losing
pixel parity. Keep an experimental TSL port of one section behind a query flag as the upgrade path. For
from-scratch work with no legacy shaders, prefer TSL/WebGPU with a WebGL2 fallback (see 3d-web).

## Upgrading three.js across versions

Comment each adaptation where it is made: camera `matrixWorldAutoUpdate`, renamed physical-material
contributions, BatchedMesh layout rebuilt as merged geometry + id attribute + matrix texture, Draco build that
supports points/lines, KTX2 loads of one file in different modes cloned, loader worker `format: 'es'`.

## Decoding a shipped bundle (study builds)

Beautify, collapse GLSL to markers, port module by module to typed files, then re-insert the **verbatim**
shaders by script (`fill-shaders`). Keep original quirks and mark them `(sic)`; they are part of the look.
