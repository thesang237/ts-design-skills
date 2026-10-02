---
name: 3d-web
description: Use when building, changing or reviewing 3D or WebGL/WebGPU on a website, especially three.js or React Three Fiber in Next.js, for example a 3D hero, product viewer, scroll- or pointer-driven 3D scene, particles, custom shaders or post effects, loading and compressing glTF models and textures, blending 3D with page UI and HTML labels, frame-rate budgets per device, fallbacks for devices without WebGL/WebGPU, and cleaning up GPU memory when the page changes. Provides setup, camera and lighting presets, material and shader recipes, an asset pipeline, device quality tiers, fallback and cleanup rules. Motion timing and scroll choreography come from web-motion; route changes from page-transitions.
---

# 3D web

3D earns its place when it shows something flat design can't, runs smoothly on the visitor's device,
and never blocks reading or navigation. **Choreograph with numbers, render only what's visible,
measure on real devices, and always have a still-image fallback.** Checked on 2026-09-30 against
three.js r186, React Three Fiber 9.8, drei 10.7, glTF Transform 4.5, GSAP 3.15, Next.js 16.3.

Related skills (don't repeat them here):
- **web-motion**: easing, timing, scroll mapping, the one-film scroll page, pointer smoothing, reduced motion for UI.
- **page-transitions**: loaders and route changes around a 3D page.
- **ui-craft**: the UI and type over the canvas. **quality-check**: the full review pass.
- **create-learn-page**: when teaching how a 3D page works.

## Before writing any code: ask the designer

1. What must the 3D show that an image or video can't? (If nothing, suggest a video.)
2. Mood and light: soft studio, foggy exterior, dark and glowing, or match a reference?
3. Real models (glTF from a 3D artist) or procedural (built from code)?
4. How is it driven: time, scroll (which screens), pointer, or all three?
5. The still-image fallback: who designs it, and what does it show?

### Sang's answers (taste session, 2026-09-30). Use these unless told otherwise

- **Renderer: classic WebGL first** (`WebGLRenderer`, every device). Move to **WebGPU** only when a
  project needs it (compute-heavy particles, huge counts, TSL node effects); `WebGPURenderer` then
  falls back to WebGL 2 by itself, but custom shaders must be rewritten in TSL. See `references/webgpu.md`.
- **Weak devices get lighter 3D, not broken 3D**: lower pixel ratio, fewer particles, no shadows.
  **No WebGL, a lost context, or reduced motion → a designed still image** (poster) of the scene.
- **Scenes inside cards or windows** (added 2026-10-03): **the card is a mask**. Its frame leans and
  turns; the picture stays upright with its own scroll and pointer parallax. **Pointer parallax turns
  the view** (orbit/tilt) rather than sliding it, with the frame slower than the picture.
  See `references/painted-cards.md`.
- Mood/light, model source and interaction are asked per project.

## Which approach? (decision guide)

| The job | Use | Why |
| --- | --- | --- |
| 3D inside a React / Next.js page | **React Three Fiber** (`<Canvas>`, `useFrame`) + drei helpers | Declarative scene, automatic disposal of JSX objects, React lifecycle |
| A small isolated effect, or a demo | **Vanilla three.js** with one setup function | Fewer moving parts, easy to reason about |
| Several distinct scenes on one page | One canvas, **one scene + camera per scene**, render only the visible ones (`references/compositing.md`) | One GPU context, cross-fades possible |
| 3D in several page sections | **One fixed canvas drawing into DOM-tracked rectangles** (drei `<View>` or scissor) | Browsers cap WebGL contexts (~16); one context is faster |
| Many copies of one shape | **InstancedMesh** | One draw call for thousands |
| Thousands of moving points | GPU points (vertex shader), or GPGPU / WebGPU compute for physics | Per-point JavaScript doesn't scale |
| A model from a 3D artist | **glTF (.glb)**, optimised with glTF Transform, loaded with Meshopt/Draco + KTX2 | Smallest download, GPU-compressed textures |
| Scroll choreography | A dials object driven by the master timeline (web-motion) | Scroll never touches three.js directly |
| Labels next to 3D objects | HTML positioned by `vector.project(camera)` (or drei `<Html>`) | Real, accessible, crisp text |
| Shaped cards that hold a layered or 3D picture (they lean, turn, hand off) | **Render-to-texture paintings + a screen-space mask** (`references/painted-cards.md`) | The frame moves, the picture stays upright with its own parallax |

## Core rules

1. **Client-only canvas.** Load the 3D component with `dynamic(() => import(…), { ssr: false })`; the
   page's text and layout render on the server without it.
2. **Numbers in, pixels out.** Timelines, scroll and pointer write plain numbers (a dials object);
   the frame loop reads them. No React state per frame, no allocations per frame (reuse vectors).
3. **Frame loops never read React refs.** Use the objects and element captured at setup; remove
   every loop, listener and ticker callback in cleanup.
4. **Render only what's visible.** Skip scenes with zero weight, pause when the canvas is off screen
   or the tab is hidden, and consider `frameloop="demand"` for still scenes.
5. **Cap the pixel ratio** (`dpr={[1, 1.5]}` by default; tiers lower it) and choose tiers by device,
   then adjust at runtime from measured frame time (`references/performance-tiers.md`).
6. **Budgets:** 60fps on a mid laptop; ≥ 50fps on a mid phone with 4× CPU slowdown; under ~150
   draw calls; hero model under ~3 MB compressed; textures ≤ 2048px, KTX2 where possible.
7. **Text lives in the DOM**, never only in the canvas. The canvas is `aria-hidden` or has a text
   alternative; interactive 3D has a keyboard path to the same content.
8. **Colour is managed:** sRGB output, tone mapping chosen on purpose (Neutral for faithful product
   colour, ACES/AgX for cinematic), custom shaders end with the colour-space include.
   "Glow" = HDR colour (> 1) with `toneMapped: false`, picked up by bloom.
9. **Always a fallback:** detect WebGL/WebGPU support, handle `webglcontextlost`, respect reduced
   motion, and show the poster when the 3D can't run well (`references/fallbacks.md`).
10. **Clean up on page change:** dispose geometries, materials, textures and render targets you
    created, reset module-level stores, restore global cursor/scroll state (`references/cleanup.md`).
11. **Seeded randomness** for anything procedural, so every visitor sees the designed composition.
12. **Measure, don't guess**: frame times through the whole scroll, draw calls, memory after
    navigating away and back (`references/performance-tiers.md` has the script).
13. **No brand or client assets** in reusable code or demos.

## Quality checklist

- [ ] The page's text renders without JavaScript/WebGL; the canvas is loaded client-only
- [ ] 60fps through the whole scroll on a laptop; ≥ 50fps on a phone profile with 4× CPU slowdown
- [ ] Draw calls and triangle counts within budget (`renderer.info`), no per-frame allocations
- [ ] Off-screen or hidden: the loop pauses (check a frame counter)
- [ ] Tiers: a low-tier device gets lower DPR / fewer particles / no shadows and still looks designed
- [ ] No WebGL, lost context, reduced motion: the poster shows, nothing is blank or broken
- [ ] Navigate away and back 3 times: memory and `renderer.info.memory` stay flat, one WebGL context
- [ ] Models: glTF optimised (Meshopt/Draco + KTX2/WebP), total 3D download noted and approved
- [ ] Colours match the design (sRGB, tone mapping, no washed-out custom shaders)
- [ ] Labels and UI over the canvas are real DOM, keyboard-reachable, readable on bright scenes
- [ ] Works in Chromium, Firefox and WebKit, phone and desktop
- [ ] The designer's answers above are respected and written down

## Reference files

- `references/setup-nextjs.md`: Canvas settings, R3F vs vanilla, dials store, one clock, multiple worlds
- `references/camera-light.md`: camera presets and rails, lighting and fog presets, shadows, tone mapping
- `references/materials-shaders.md`: standard materials, patching, custom shaders, GPU points, instancing, GPGPU
- `references/assets.md`: glTF pipeline, compression, loaders, budgets, procedural alternatives
- `references/scroll-pointer.md`: scroll-driven dials, camera rails, pointer, picking, gestures
- `references/dom-blending.md`: layering 3D with page UI, HTML labels, views in sections, overlays
- `references/compositing.md`: render targets, blending worlds, post effects in one pass
- `references/painted-cards.md`: painted scenes inside shaped cards: cards as masks, pointer turns, multi-face cards, SDF tab shapes
- `references/performance-tiers.md`: device tiers, runtime quality, budgets, the measuring script
- `references/fallbacks.md`: support detection, poster, reduced motion, context loss
- `references/cleanup.md`: disposal, route changes, verifying memory
- `references/webgpu.md`: when and how to move to WebGPURenderer and TSL
- `references/pitfalls.md`: what broke, and how it was found
