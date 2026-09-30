# Moving to WebGPU (when a project needs it)

Default stays `WebGLRenderer`. Consider WebGPU when the project needs compute (particle physics,
simulations without texture tricks), very large counts, or node-based effects written once for both
backends. As of 2026 WebGPU ships in Chrome/Edge (desktop and Android 12+), Safari 26 (macOS/iOS),
and Firefox on Windows and Apple Silicon macOS; Firefox Android is still behind a flag. That's why
the fallback matters.

## What changes

| Topic | WebGLRenderer | WebGPURenderer |
| --- | --- | --- |
| Import | `import * as THREE from 'three'` | `import * as THREE from 'three/webgpu'` and `import { … } from 'three/tsl'` |
| Start | synchronous | `await renderer.init()` (or use `setAnimationLoop`, which waits for you) |
| No WebGPU in the browser | — | falls back to a **WebGL 2 backend automatically** (`forceWebGL: true` to test it) |
| Custom shaders | `ShaderMaterial`, `onBeforeCompile` | **Not supported**: rewrite as node materials in TSL (JavaScript functions that build shaders for both backends) |
| Post-processing | EffectComposer / your own quad | `RenderPipeline` (renamed from `PostProcessing` in r183) with TSL nodes: `pass()`, `bloom()`… |
| Physics on the GPU | GPGPU with float textures | compute shaders (`compute()` nodes, storage buffers) |
| Built-in materials | as usual | work unchanged (converted to node materials) |

Don't mix `three` and `three/webgpu` objects in one scene; each import has its own copy of the core.

## Minimal setup

```ts
import * as THREE from 'three/webgpu'
import { pass, mix, color, uniform, normalView, positionViewDirection, oneMinus } from 'three/tsl'
import { bloom } from 'three/addons/tsl/display/BloomNode.js'

const renderer = new THREE.WebGPURenderer({ antialias: true })
await renderer.init()
const backend = renderer.backend.isWebGPUBackend ? 'WebGPU' : 'WebGL 2'   // show it in dev tools

const glow = uniform(0.6)
const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.4 })
const rim = oneMinus(normalView.dot(positionViewDirection).abs()).pow(2.5)      // fresnel, built from nodes
mat.emissiveNode = mix(color('#000000'), color('#94dbff'), rim.mul(glow))           // glow.value = 1.2 from a slider

const pipeline = new THREE.RenderPipeline(renderer)
const sceneColor = pass(scene, camera).getTextureNode('output')
pipeline.outputNode = sceneColor.add(bloom(sceneColor, 0.7, 0.3, 0.2))           // strength, radius, threshold
renderer.setAnimationLoop(() => pipeline.render())
```

R3F: `<Canvas gl={async (props) => { const r = new THREE.WebGPURenderer(props); await r.init(); return r }}>` with
`extend(THREE)` from `three/webgpu`, and node materials in JSX (`<meshStandardNodeMaterial />`).

## Migration checklist

- [ ] Every `ShaderMaterial` / `onBeforeCompile` rewritten as a node material (or replaced by a built-in)
- [ ] Post effects moved to `RenderPipeline`
- [ ] GPGPU moved to compute, or kept on WebGL for that part
- [ ] Tested with `forceWebGL: true` (the fallback path real visitors will get) and on Safari
- [ ] Draw calls and frame times measured on both backends; tiers still apply
