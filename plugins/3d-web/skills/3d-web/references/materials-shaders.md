# Materials and shaders

Start from the simplest thing that looks right; write a shader only for what materials can't do.

## 1. Built-in materials first

| Look | Material | Key settings |
| --- | --- | --- |
| Matte, stone, snow, clay | `MeshStandardMaterial` | `roughness` 0.8 to 1, `metalness` 0 |
| Plastic, painted metal | `MeshStandardMaterial` | `roughness` 0.3 to 0.5, `metalness` 0 to 0.3, environment on |
| Glass, gems, clear coat, fabric sheen | `MeshPhysicalMaterial` | `transmission`, `thickness`, `ior`, `clearcoat`, `iridescence`, `sheen` (costly: use on one hero object) |
| Unlit glow, UI in 3D | `MeshBasicMaterial` | colour > 1 + `toneMapped: false` for bloom |

A colour pass over a picture during a transition (a flash, a tint while a card travels) should
**glow, not fade**: screen-blend toward the colour, `c = 1 - (1 - c) * (1 - glowColour * k)`, a
little stronger toward the edges, k ≤ 0.4 at the peak. Mixing toward white (`mix(c, white, k)`)
reads as the picture washing out.

## 2. Patch a built-in material (keep its lighting and shadows)

For "standard material, plus one idea" (grain, dissolve, wind sway) inject code with
`onBeforeCompile` (WebGL renderer only) or use `three-custom-shader-material` (works across
renderers in R3F), or a node material in WebGPU (`webgpu.md`).

```ts
const mat = new THREE.MeshStandardMaterial({ color: '#5c6470', roughness: 0.88 })
mat.onBeforeCompile = (shader) => {
  shader.uniforms.uGrain = { value: 0.08 }
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', `#include <common>\nuniform float uGrain;\n${NOISE_GLSL}`)
    .replace('#include <color_fragment>', `#include <color_fragment>\ndiffuseColor.rgb *= 1.0 - uGrain + uGrain * snoise(vViewPosition * 3.0);`)
}
mat.customProgramCacheKey = () => 'grain-v1'      // distinct cache key per variant
```
Per-instance variation: seed the noise with `float(gl_InstanceID)` in the vertex shader.

## 3. Custom shader recipes (ShaderMaterial)

Always end the fragment shader with `#include <tonemapping_fragment>` and `#include <colorspace_fragment>`,
or its colours look darker/flatter than the rest of the page.

| Effect | Core line |
| --- | --- |
| Fresnel rim (glass, ice, holograms) | `float fres = pow(1.0 - abs(dot(N, V)), 2.2);` |
| Fake refraction/reflection without an env map | sample a gradient function with `refract(-V, N, 0.76)` / `reflect(-V, N)` |
| Iridescence / rainbow | cosine palette `0.5 + 0.5 * cos(6.28318 * (x + vec3(0.0, 0.33, 0.67)))` |
| Facet edges on low-poly shapes | barycentric attribute per vertex, `edge = min(min(b.x, b.y), b.z)`, `1.0 - smoothstep(0.0, fwidth(edge) * 1.6, edge)` |
| Milky inside / clouds | `fbm3(position * 1.6 + time * 0.05)` |
| Frosted base | `smoothstep(-0.2, -1.4, localY) * noise` mixed toward white |
| Slice glitch (vertex) | `p.x += (hash(floor(p.y * 9.0 + floor(t * 18.0))) - 0.5) * step(0.62, hash(...)) * amount` |
| Soft round points | `smoothstep(0.5, 0.1, length(gl_PointCoord - 0.5))` |

Shared snippets (hash, simplex noise, fbm) live in one `glsl.ts` module and are string-interpolated.

## 4. Moving thousands of things

- **Points in a vertex shader** (snow, dust, stars): positions and a random seed are uploaded once;
  JavaScript only updates `uTime`. Wrap with `mod()`; size by depth `size * (12.0 / -mvPosition.z)`.
- **InstancedMesh** (bricks, trees, cards): one geometry + per-instance matrix and colour; update
  `instanceMatrix.needsUpdate` once per frame; set `frustumCulled = false` if instances move far
  from the original bounds (or compute a generous bounding sphere).
- **Per-instance stagger** from data: delay = height × 0.5 + seeded random × 0.14, local progress =
  `clamp((p - delay) / 0.42)` (web-motion `progress-mapping.md`).
- **Physics for 10k to 100k particles (GPGPU)**: positions and velocities in float textures,
  updated by a full-screen shader each frame (`GPUComputationRenderer`), read back in the particle
  vertex shader via a per-particle uv. Needs float render targets (`EXT_color_buffer_float`): check
  support and fall back to fewer CPU particles. In WebGPU, use compute shaders instead (`webgpu.md`).
- **Springs for particle figures**: `acc = (home - pos) * k - vel * damping`; an "energy" value
  raised by the cursor loosens `k`, adds turbulence and drives glow, then decays. Two half steps per
  frame keep stiff springs stable.

## 5. Shapes without models

- Draw a logo or word on a hidden 2D canvas, read its pixels, sample points where alpha > 0.5.
- Build forms from primitives (ellipsoids, lathe profiles, extrusions) and merge them with
  `mergeGeometries` to keep one draw call.
- Low-poly "natural" shapes: jitter shared vertices by the same amount (key vertices by rounded
  position) so faces stay closed.
