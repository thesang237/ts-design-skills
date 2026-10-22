# A vanilla three.js engine for a full-page experience

For an immersive site where the canvas is the page (an Astro / plain-HTML shell, no React). The patterns come
from a production-grade WebGL2 experience with ~160 shaders, three full-screen scroll sections and a project
close-up, running at display refresh rate. Use R3F instead when the 3D is one component inside a React page.

## Layout

```
core/        clock, events, input, camera rig, Scene3D base, composers, audio, renderer, env, math
loaders/     texture manifest + modes, worker pool (Draco), text layout
gl/          shader chunks, text mesh, GPGPU particles, fluid sim, pointer ↔ 3D helpers
controller/  the thing that owns scroll, sections, routing and the composite
scenes/<n>/  one folder per section, each extending one base class
```

## The clock and three phases

GSAP's ticker is the only clock. Each frame it publishes `prerender` (logic, uniforms), `render` (draw) and
`postrender` on a tiny event bus. The clock object exposes `time`, `delta`, `frame`, `averageFPS` and
`ratio = delta / (1000/60)` clamped (e.g. to 5). Everything time-based uses `ratio`:

```ts
const damp = (t, ratio) => 1 - Math.exp(Math.log(1 - t) * ratio);       // per-frame factor → this frame's factor
lerpFPS(a, b, t)    = lerp(a, b, damp(t, clock.ratio));
frictionFPS(k)      = Math.exp(Math.log(k) * clock.ratio);
lerpFPSLimited(a, b, t, maxStep)   // same, but never moves more than maxStep × ratio per frame
```
Result: the same feel at 30, 60 and 120 fps. `gsap.defaults({ overwrite: 'auto' })` and `force3D` are set once.

## A scene base class that works for scenes

`Scene3D extends Scene` owns a camera rig, `beforeRenderCbs`, `ready` and `uploaded` promises. It hooks
`updateMatrixWorld()` (called by `renderer.render`) so the camera rig and per-frame logic run **only for scenes
actually drawn this frame** (guard with `clock.frame`). Its `upload()` is the warm-up (below).

## Warm everything before the loader leaves

```ts
async upload() {
  // collect every texture (uniforms + material props); force-visible every mesh/material, no frustum culling
  gl.setRenderTarget(uploadTarget);               // a 2×2 half-float target
  await gl.compileAsync(this, this.camera);       // all programs, off the main thread where supported
  for (const t of textures) gl.initTexture(t);    // upload to the GPU now
  gl.render(this, this.camera);                   // one real draw
  // restore visibility / culling
}
```
The controller also uploads the composite and intro materials, then renders every section once. The loader
(CSS only) leaves after `controller.ready`. A first scroll must never compile or upload anything.

## Renderer settings that matter

- `new WebGLRenderer({ alpha: false, antialias: false, stencil: false, depth: false, powerPreference: 'high-performance' })`:
  the canvas has no MSAA or depth; every scene renders into **half-float targets** and the last pass applies SMAA
  and sRGB encoding. `renderer.info.autoReset = false` and reset it once per frame to read true per-frame counts.
- `debug.checkShaderErrors = import.meta.env.DEV` only.
- Pixel ratio of the renderer stays 1; the resolution (css size × capped DPR, floored) is computed once and shared
  through a global uniform / UBO, so composers, shaders and the UI agree.
- **Probe float render targets.** Some mobile GPUs advertise float targets and write garbage: render a known
  colour into a 1×1 `FloatType` target, `readRenderTargetPixels`, compare, and fall back to half-float if wrong.
  Also check `OES_texture_float_linear` before sampling float textures with linear filtering.
- The canvas may live in a closed shadow root; pointer and wheel listeners attach to the canvas element.

## Textures by name and mode

Preload a manifest before the scenes are built so scene code can grab textures synchronously.

- Address a texture as `path + mode`; the mode is a list of flags: `srgb`, `repeat`/`mirror`, `data` (linear,
  no mips), `nearest`, `lut` (3D texture), `noflip`. Anything not `srgb` is sampled raw (`NoColorSpace`).
- Decode PNG/JPG through `ImageBitmapLoader` with `colorSpaceConversion: 'none'`, `premultiplyAlpha: 'none'`,
  `imageOrientation: 'flipY'` and set `texture.flipY = false`: decoding off the main thread, no double flip.
- KTX2 (Basis) for large colour textures; `KTX2Loader.setWorkerLimit(1).detectSupport(renderer)`. The loader dedupes
  concurrent loads of one URL and returns the *same instance*: clone it when two modes need different sampler state.
- Data textures (LUTs, noise, text atlases, matrix textures) are ordinary assets with `data`/`nearest` modes; a
  tetrahedral LUT is sampled manually, so it is `NEAREST`.

## Workers for decoding

A 40-line pool round-robins messages over N lazily created workers (`busy` bitmask + queue, `terminate()` on
dispose); transfer buffers, never copy. Use it for Draco: custom attribute metadata ("info") rides along, and
the full Draco build is required for point clouds and line sets. Set `worker: { format: 'es' }` in Vite.

## Camera rig

Scenes never move the camera directly. They animate `basePosition / baseTarget / baseUp`; the rig adds, every
frame: pointer parallax (position orbits the target, the target slides, roll follows pointer velocity), a noise
shake (cheap sum-of-sines, not Perlin), all smoothed with `lerpFPS`. On touch the parallax recentres when the
finger lifts. Keep `matrixWorldAutoUpdate` on in recent three.js; update the rig once per drawn frame.

## Pointer ↔ 3D

- One input module: pointer objects (`position`, `position11` in −1..1, `currentInput` mouse|touch, `touching`),
  two fingers, click vs drag threshold, wheel and keys emitted on the bus. Normalise Firefox's line-based wheel
  deltas (×33), keep an accumulated `position`, a `delta` and a decaying `velocity`.
- `PlaneInteraction`: unproject the pointer onto a plane facing the camera (re-seeded from a point or the camera
  target) to get a world position for dust, trails and dragging; `project(world)` returns CSS pixels for DOM labels.
- Raycast against low-poly proxies or with a BVH (`three-mesh-bvh`), never against the full render mesh.

## GPGPU particles (ping-pong)

State lives in float render targets, one texel per particle (MRT for position + velocity). A compute material
renders a full-screen quad into `rt2` reading `rt1`, then they swap, right before the draw. The draw material
receives `tTexture1…N` (current) and `…Prev` (previous frame: motion trails, velocity). Geometry carries only
`rand` (4 floats) and `texuv` (the texel of that particle); side = `ceil(sqrt(count)/4)*4`. Points or
instanced quads draw from it. 150k particles are fine; seed once from textures. Provide a lighter variant when
the float-target probe fails.

## Section stack and composite

See `references/compositing.md` (virtual scroll, section render targets, composite shader) and
`references/scroll-pointer.md` (two-stage scroll smoothing).

## Dev ergonomics

A debug handle on `window` in dev only; `?skip`-style flags for the intro; a decode/port helper that prints
a range of the beautified bundle with GLSL collapsed to markers and a script that re-inserts the verbatim
shaders; comments mark original quirks `(sic)` so nobody "fixes" the look.
