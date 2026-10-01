# Materials: realistic looks, swaps without stutter

A swap must feel like turning a real sample in your hand: instant, smooth, and the first time as
good as the tenth. Three things make that happen: **one shared material per look**, **everything
prepared before the reveal**, and **a short crossfade**.

## 1. Starting values per material kind (MeshPhysicalMaterial)

Tune against a photo of the real sample under similar light. These are starting points, not answers.

| Kind | roughness | metalness | Extras | Texture |
| --- | --- | --- | --- | --- |
| Woven fabric, bouclé | 0.9 to 1 | 0 | `sheen` 0.4 to 0.7, `sheenRoughness` 0.7 to 0.8, `sheenColor` = colour lifted towards white | normal map of loops or weave |
| Felt, knit | 0.85 to 0.95 | 0 | `sheen` 0.3 | fine noise normal map |
| Leather | 0.4 to 0.6 | 0 | `clearcoat` 0.2 to 0.3, `clearcoatRoughness` 0.5 | pebbled grain normal map, low strength |
| Oiled wood | 0.5 to 0.65 | 0 | `clearcoat` 0.3 to 0.4 for lacquer | grain colour map along the length of the part |
| Brushed metal | 0.25 to 0.4 | 1 | `anisotropy` 0.4 to 0.6 | optional anisotropy direction map |
| Polished metal | 0.05 to 0.15 | 1 | — | — |
| Powder coat, matte plastic | 0.55 to 0.75 | 0 | — | fine noise bump or normal map |
| Gloss plastic, lacquer | 0.15 to 0.3 | 0 | `clearcoat` 0.6 to 1 | — |
| Glass, acrylic | 0 to 0.1 | 0 | `transmission` 1, `thickness`, `ior` 1.5 | costly: test on phones |

- **Metals need something to reflect.** In a dark or plain environment, metal looks black or flat.
  Use a studio environment with large soft lights and a mid-grey surround (3d-web `camera-light.md`); drei
  `<Environment>` with `<Lightformer>` children works offline, with no HDR download.
- **Fine grain only.** Surface noise (bead blast, fabric loops) must be high frequency. Large-scale
  noise reads as stains or carbon fibre once mip-mapped.
- **Colour comes from the swatch, not the texture.** Grain and weave textures are greyscale and
  multiplied by the material colour, so one texture serves every colour.
- Match the swatch in the panel to the rendered colour under the studio light, not the raw hex.

## 2. The material library

```ts
// three/materials.ts
export class MaterialLibrary {
  private cache = new Map<string, THREE.MeshPhysicalMaterial>();
  readonly textures = { weave: loadOrGenerate(...), grain: ..., wood: ... };

  /** One shared instance per distinct look. Never mutate it: other parts may use it. */
  get(a: Appearance) {
    const key = JSON.stringify([a.kind, a.color, a.roughness, a.metalness, a.sheen]);
    let m = this.cache.get(key);
    if (!m) {
      m = new THREE.MeshPhysicalMaterial({ color: a.color, roughness: a.roughness ?? 0.5, metalness: a.metalness ?? 0 });
      applyKind(m, a, this.textures);   // the table above: normal maps, sheen, clearcoat…
      this.cache.set(key, m);
    }
    return m;
  }
  dispose() { this.cache.forEach((m) => m.dispose()); Object.values(this.textures).forEach((t) => t.dispose()); }
}
```

Why share: the GPU compiles one shader program per **combination of features** (sheen on or off,
clearcoat, normal map, transparency, shadows), not per colour. A new colour on an existing kind is
free; a new kind is a compile, which is the stutter people notice.

Many swatchable surfaces on one object (keycaps, tiles, LEDs, a modular shelf): don't make hundreds
of materials. Draw them as one merged or instanced mesh and put each item's colour and roughness in a
small data texture indexed by an item id attribute. A colour change then rewrites a few pixels.

## 3. Warm up before the reveal

```ts
export async function warmUp(lib: MaterialLibrary, gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(0.001, 0.001); // has uv + normal like the real meshes
  for (const look of oneLookPerKind) {
    const solid = new THREE.Mesh(geo, lib.get(look));
    solid.castShadow = solid.receiveShadow = true;       // must match the real meshes exactly
    const fading = new THREE.Mesh(geo, fadeCopy(lib.get(look)));
    fading.receiveShadow = true;                         // the crossfade's transparent variant too
    group.add(solid, fading);
  }
  Object.values(lib.textures).forEach((t) => gl.initTexture(t));   // upload now, not on first use
  scene.add(group);
  await gl.compileAsync(group, camera, scene);                     // compile without blocking
  scene.remove(group);
}
```

Reveal the product (fade the poster out) only after the warm-up and one real frame. Measure the
**first** swap of every kind with a long-task observer; it is the one that stalls when a variant was
missed (see pitfalls: shadow flags).

## 4. Crossfade a material swap (200 ms)

Draw the new material on top as a transparent copy that fades in, then make it the real material.
It works for any change: colour, texture, even metal to fabric.

```tsx
export function FadingMesh({ geometry, material }: { geometry: THREE.BufferGeometry; material: THREE.Material }) {
  const base = useRef<THREE.Mesh>(null);
  const overlay = useRef<THREE.Mesh>(null);
  const fade = useRef<{ to: THREE.Material; copy: THREE.Material; t: number } | null>(null);
  const last = useRef(material);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    if (last.current === material || !base.current || !overlay.current) return; // compare props, not mesh.material
    last.current = material;
    if (reducedMotion()) { base.current.material = material; invalidate(); return; }
    if (fade.current) {                       // interrupted: keep the more visible one, fade to the newest
      if (fade.current.t > 0.5) base.current.material = fade.current.to;
      fade.current.copy.dispose();
    }
    const copy = fadeCopy(material);          // clone with transparent: true, depthWrite: false, opacity 0
    overlay.current.material = copy;
    overlay.current.visible = true;
    fade.current = { to: material, copy, t: 0 };
    invalidate();
  }, [material]);

  useFrame((_, dt) => {
    const f = fade.current;
    if (!f) return;
    f.t = Math.min(1, f.t + dt / 0.2);
    f.copy.opacity = easeInOut(f.t);
    if (f.t === 1) { base.current!.material = f.to; overlay.current!.visible = false; f.copy.dispose(); fade.current = null; }
    invalidate();
  });

  return (
    <group>
      <mesh ref={base} geometry={geometry} material={material} castShadow receiveShadow />
      <mesh ref={overlay} geometry={geometry} visible={false} receiveShadow renderOrder={1} raycast={() => null} />
    </group>
  );
}
```

The overlay draws the same triangles at the same depth, so it never z-fights with depth writing off.
The clone shares the textures and the compiled program, so it costs nothing to create.

## 5. Swap a shape (legs to sled, with or without armrests)

Build every variant's geometry once at load. On change, keep the outgoing variant mounted while it
fades out and the incoming one fades in (same 200 ms), then unmount the old one. If the outgoing
variant is "nothing" (armless), skip straight to removing it. Turn off `castShadow` on fading
copies so shadows don't double. The demo's `ShapeSwap` in `src/three/fades.tsx` does this generically.

## 6. Variants from a 3D artist: KHR_materials_variants

When a modeller delivers the options, ask for **one glTF with the materials variants extension**:
one geometry, every material, and a list of named variants. Shopify, `<model-viewer>`
(`variantName`, `availableVariants`), three.js and gltf-transform all understand it.

```ts
// three.js: the loader keeps the extension data on the scene; map variant name → material per mesh
const gltf = await loader.loadAsync(url);
const ext = gltf.userData.gltfExtensions?.KHR_materials_variants as { variants: { name: string }[] };
async function selectVariant(name: string) {
  const index = ext.variants.findIndex((v) => v.name === name);
  gltf.scene.traverse(async (o) => {
    const def = (o as THREE.Mesh).isMesh && o.userData.gltfExtensions?.KHR_materials_variants;
    if (!def) return;
    o.userData.original ??= (o as THREE.Mesh).material;
    const mapping = def.mappings.find((m: { variants: number[] }) => m.variants.includes(index));
    (o as THREE.Mesh).material = mapping ? await gltf.parser.getDependency("material", mapping.material) : o.userData.original;
  });
}
```

Map your option choices to variant names in the product definition (`variant: "Walnut"`), warm up all
variant materials as above, and keep the crossfade.

## 7. Textures: size, format, preloading

- **Format:** KTX2 (Basis) for colour, normal and roughness maps: smaller downloads and much less
  GPU memory than PNG or JPEG. Compress with `gltf-transform optimize in.glb out.glb --texture-compress ktx2`
  (details and the loader setup in 3d-web `assets.md`). Self-host the Draco/Meshopt and Basis
  decoders instead of relying on a third-party CDN.
- **Size:** 1K for most product surfaces, 2K only for close-ups that need it; tileable detail
  textures (weave, grain) at 256 to 512 px with `repeat` do more than one huge unique map.
- **Load what's likely next, not everything:** textures for the current choice first, then the other
  choices of the option being edited, then the rest when idle. Upload each one with
  `gl.initTexture` before its first use.
- **Built in code** (demos, simple products): generate tileable height fields and convert them to
  normal maps once at startup (`heightToNormal` in the demo). Nothing to download or license.

## 8. WebGPU note

If the project may move to `WebGPURenderer` (3d-web `webgpu.md`), avoid `onBeforeCompile` and
`ShaderMaterial` tricks: they don't run there. Keep material looks in plain physical-material values
and textures, which work on both renderers; write any custom effect in TSL.
