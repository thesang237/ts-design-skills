# Pitfalls: what broke, and how it was found

From studying a scroll-driven WebGL site (four worlds on one canvas, a GPU particle simulation, a
single-pass compositor; measured on a real GPU in Chromium, desktop and phone profile with 4× CPU
slowdown) and from building 20+ teaching demos around it. Names removed.

## What the studied site did well (keep doing it)

| Practice | Result |
| --- | --- |
| Scroll writes numbers to a plain dials object; worlds read them per frame | No React renders while scrolling; timeline easy to re-choreograph |
| Hidden worlds return early; the compositor renders at most two | 16 to 28 draw calls per frame, p95 frame 16.8ms |
| Instanced bricks, GPU snow, GPGPU particles | Thousands of moving things at 60fps |
| One post pass with mip-chain bloom and MSAA targets | Many effects for the cost of one pass |
| Procedural everything, seeded randomness | Zero model/texture downloads; identical composition for everyone |
| Module store reset on mount; disposal in effect cleanups | Memory flat after navigating away and back 3× |

## What was fragile (and the fix)

| Problem | How it showed up / risk | Fix |
| --- | --- | --- |
| No fallback for missing WebGL or a lost context | A blank page on old devices or after a GPU reset | Poster + `webglcontextlost` handling (`fallbacks.md`) |
| Reduced motion ignored by the 3D | The camera still flew with the scroll | Poster or still acts for reduced motion |
| Fixed quality for everyone (only particle count varied by width) | Fine on a fast laptop; no safety net for slow phones | Tiers + runtime frame-time monitor (`performance-tiers.md`) |
| GPGPU on float textures without a capability check | Some mobile GPUs can't render to float targets | Check `EXT_color_buffer_float`; fallback effect |
| All four worlds built and compiled at load | Long intro; shader compile hitches possible | Warm up with `renderer.compile`; build later worlds when idle |
| Global cursor written from several worlds | Wrong cursor left behind on other pages | One owner for the cursor; reset on unmount |
| Pointer follower re-tweened on every mousemove | Extra work per event | `gsap.quickTo` |
| Smooth-scroll library older than the version that respects reduced motion | Smoothing stayed on for those users | Upgrade (web-motion) |

## Found while building demos

| Problem | How it showed up | Fix |
| --- | --- | --- |
| Frame loop read `ref.current` after unmount | `Cannot read properties of null (reading 'style')` | Use the element captured at setup |
| Custom ShaderMaterial on screen looked darker than the design colour | Linear values shown as sRGB | End with `#include <colorspace_fragment>` |
| Dev double-mount + "kill all tweens of this object" | A second, unrelated tween died; particles never gathered | Kill by property list; compare keys instead of "skip first run" |
| SVG groups with 3D rotation | No tilt | HTML layers with `perspective` on the parent |
| Many canvases on one page | Risk of the ~16 context limit | One canvas with views, or lazy mount + `forceContextLoss()` on unmount |
| `PCFSoftShadowMap` in newer three.js | Console warning; silently replaced (removed in r18x) | Use `PCFShadowMap` |
| "Restore" after a simulated context loss did nothing | `getExtension('WEBGL_lose_context')` returns null once the context is lost | Keep the extension object from before the loss |
| `fresnel()` in TSL | Not a built-in node | `oneMinus(normalView.dot(positionViewDirection).abs()).pow(p)` |
| A headless browser without GPU flags | Software rendering: meaningless frame times | `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` (macOS) and check the renderer string |

## Found while studying a production WebGL2 experience (2026-10-22)

| Problem | How it showed up | Fix |
| --- | --- | --- |
| A first scroll into a new room compiled shaders | A long frame at the section change | `compileAsync` + `initTexture` + one real render of every scene before the loader leaves |
| A mobile GPU advertised float render targets | Garbage in GPGPU particles | Render a known colour to a 1×1 float target, read it back, fall back if wrong |
| `KTX2Loader` handed the same texture to two sampler modes | One look overwrote the other | Clone when the same file is requested in another mode |
| Camera `matrixWorldAutoUpdate` turned off by hand (older pattern) | A frozen camera in newer three.js | Leave it on; update the rig once per drawn frame |
| Smoothing per frame | Faster scroll and parallax at 120 Hz | `lerpFPS` / `frictionFPS` with the clock ratio |
| Every room rendered every frame | Frame time grew with room count | Render only the one or two sections overlapping the viewport |
| Pixel ratio uncapped with several full-screen passes | Throttling on laptops | Hard cap, then adaptive multiplier with a flip limit |
| Draw-call numbers looked random | `renderer.info` reset per render call | `info.autoReset = false`; reset once per frame |
| A new renderer assumed to be a drop-in | GLSL and `onBeforeCompile` do not run on the node renderer | Keep WebGL2 for parity; port one section to TSL behind a flag |
| Bloom looked different after a port | Two different algorithms share a name | Port the original algorithm line for line |
| The same Draco build for meshes and points | Point clouds failed to decode | Use the full Draco build |
