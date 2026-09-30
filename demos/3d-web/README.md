# 3D web demo

A small Vite + React + three.js page that shows five things the `3d-web` skill adds beyond a
typical WebGL site. All content is placeholder; the "posters" are simple stand-ins for designed
still images.

## Run it

```
npm install
npm run dev          # then open the address it prints (usually http://localhost:5173)
```

`npm run build` creates a static copy in `dist/`.

## What to try

- **One canvas, many scenes** (top and section 01): the crystal field, the product and the particle
  sphere are drawn by one shared canvas into their page sections. Open the panel (bottom right):
  "views" counts the scenes on screen right now; the page never has more than one WebGL context.
  Move the pointer over the crystals: pieces near it lift (one draw call for all of them).
- **Scroll drives numbers** (02): scroll slowly through the product section and watch the dials on
  the right. The scene only reads those numbers; each part has its own delay window.
- **Quality that adapts** (03): keep "auto", switch on "Simulate a slow device" and wait a few
  seconds: the tier steps down (lower pixel ratio, fewer particles, no shadows) until frames are
  smooth. Pick "low" or "poster" by hand to compare.
- **Always a poster** (04): "Simulate a GPU crash" swaps every scene for its poster; "Restore" brings
  the 3D back. "Pretend reduced motion" and "Pretend WebGL is missing" show the other fallbacks
  (your real reduced-motion setting is read live too).
- **Clean up when you leave** (05): go to the plain page and back a few times. "WebGL contexts open"
  reads 0 on the plain page, and each visit's row stays the same (compare visits at the same scroll
  position: geometries are only counted once they've been drawn).
- **WebGPU, when needed** (06): loads a separate chunk with the WebGPU renderer and a TSL rim-glow
  material with bloom. The badge says whether it runs on WebGPU or the automatic WebGL 2 fallback;
  the switch forces the fallback.

## Where things are

| File | What it shows |
| --- | --- |
| `src/stage/Stage.ts` | The shared canvas: views drawn with viewport + scissor, off-screen skipping, context loss, stats, cleanup |
| `src/stage/tiers.ts` | Tier settings, the first guess from the device, the frame-time monitor |
| `src/stage/StageContext.tsx` | Live vs poster decisions (support, reduced motion, lost context, tier); tears the stage down on unmount |
| `src/components/View.tsx` | A page element that registers a scene and shows its poster when needed |
| `src/scenes/*.ts` | The three scenes (instancing + hover, scroll dials + delay windows, GPU points + draw range) |
| `src/webgpu/WebGPUScene.tsx` | WebGPURenderer, TSL material, RenderPipeline bloom, backend badge |

Verified in Chromium on a real GPU (Apple M4): 60fps, 1 draw call per scene, tier stepping under
load, context loss and restore, 0 contexts after leaving, WebGPU and forced WebGL 2 both rendering,
phone size with reduced motion showing posters and no canvas.
