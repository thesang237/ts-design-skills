# Loading and compressing 3D assets

## Budgets (ask the designer to approve the total)

| Asset | Target |
| --- | --- |
| Hero model (compressed .glb) | ≤ 1 to 3 MB |
| Everything 3D on the first screen | ≤ 5 MB on desktop, ≤ 2.5 MB on phones (serve a lighter model) |
| Textures | ≤ 2048px (1024 on phones); power of two; KTX2 where possible |
| Triangles on screen | ~100k to 500k desktop, ~50k to 150k phone |
| Draw calls | < 150 (merge meshes, instancing, texture atlases) |

## The pipeline (from the 3D artist's file to the web)

1. Artist exports **glTF 2.0 binary (.glb)** with applied transforms, real-world scale, named nodes,
   no hidden or unused objects, PBR materials (base colour, ORM, normal).
2. Inspect: `npx @gltf-transform/cli inspect model.glb` (sizes, texture resolutions, draw calls).
3. Optimise:
   ```bash
   npx @gltf-transform/cli optimize model.glb model.opt.glb \
     --compress meshopt \
     --texture-compress ktx2 \
     --texture-size 2048
   ```
   - `--compress meshopt` (fast decode, compresses animation too) or `draco` (smallest static geometry).
   - `--texture-compress ktx2` keeps textures compressed **on the GPU** (less memory, faster upload);
     `webp`/`avif` are smaller downloads but decompress to full size in memory.
   - For finer control: `gltf-transform etc1s` (small, for colour maps) or `uastc` (higher quality,
     for normal maps), `--simplify`, `--instance`, `--join`, `--palette`.
4. Check the result looks identical (compare screenshots) and note the new size.
5. R3F: `npx gltfjsx model.opt.glb --types` generates a typed component with named nodes.

## Loading

**R3F / drei**
```tsx
const { nodes, materials } = useGLTF('/models/object.opt.glb', true /* draco */, true /* meshopt */)
useGLTF.preload('/models/object.opt.glb')   // start downloading before the component mounts
```
KTX2 in drei: `useKTX2` for loose textures; for KTX2 inside glTF, extend the loader with a
`KTX2Loader` (below) via useGLTF's loader callback.

**Vanilla**
```ts
const ktx2 = new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer)
const draco = new DRACOLoader().setDecoderPath('/draco/')
const gltf = new GLTFLoader().setKTX2Loader(ktx2).setDRACOLoader(draco).setMeshoptDecoder(MeshoptDecoder)
const { scene } = await gltf.loadAsync('/models/object.opt.glb')
```
Self-host the Basis and Draco decoder files (`/public/basis`, `/public/draco`); don't fetch them from a CDN at run time.

## Loading experience

- Show the poster immediately; cross-fade to the live canvas when the first frame has rendered
  (not when the JavaScript arrives).
- Warm up shaders before revealing (`renderer.compile(scene, camera)` or `compileAsync`) so the first
  scroll doesn't stutter.
- Progressive: a low-poly model first, the full one when idle (nested `<Suspense>`).
- The loader/intro design itself belongs to page-transitions.

## Procedural instead of downloaded

For geometric, abstract or atmospheric worlds, code beats files: tiny download, sharp at any
resolution, every parameter tweakable. Use a seeded random so the result is always the same, and
build heavy geometry once (not per render).
