# Setup in Next.js

## Load the canvas client-only

```tsx
// app/(site)/hero/page.tsx  — server component: text, layout, metadata
import HeroCopy from './HeroCopy'
import Scene from './SceneLoader'
export default function Page() { return (<><Scene /><HeroCopy /></>) }

// SceneLoader.tsx
'use client'
import dynamic from 'next/dynamic'
const Scene = dynamic(() => import('./Scene'), { ssr: false, loading: () => <Poster /> })
export default Scene
```
The poster doubles as the loading state, so there is never an empty hole.

## The Canvas (React Three Fiber)

```tsx
<Canvas
  className="!fixed inset-0"                 // or a sized container
  dpr={tier.dpr}                              // e.g. [1, 1.5]; see performance-tiers.md
  gl={{ antialias: !usesPostPass, powerPreference: 'high-performance', stencil: false }}
  shadows={tier.shadows ? { type: THREE.PCFShadowMap } : false}   // PCFSoftShadowMap was removed in r18x
  camera={{ fov: 30, position: [0, 2, 12] }}
  onCreated={({ gl }) => { gl.toneMapping = THREE.NeutralToneMapping }}
  fallback={<Poster />}                       // shown when WebGL can't be created
  aria-hidden
>
  <Suspense fallback={null}><World /></Suspense>
</Canvas>
```
- `antialias: false` when a post-processing pass renders into multisampled targets anyway (MSAA on
  the target, see `compositing.md`); `true` otherwise.
- Wrap the Canvas in an error boundary that renders the poster (context crashes throw).
- Vanilla three.js: the same settings on `new THREE.WebGLRenderer({ canvas, antialias, powerPreference })`,
  `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))`, `renderer.setAnimationLoop(frame)`.

## Numbers in: the dials store

```ts
// store.ts — written by timelines/pointer, read every frame. Deliberately not React state.
export const dials = { scene: 0, rise: 0, explode: 0, pointer: { x: 0, y: 0 }, pointerSmooth: { x: 0, y: 0 } }
const initial = structuredClone(dials)
export const resetDials = () => Object.assign(dials, structuredClone(initial))   // call on mount
```
Coarse UI state (current section, open overlay, sound on) goes in a small React store (zustand or
context) and changes only a few times per visit.

## One clock

When GSAP and Lenis are on the page, let GSAP's ticker drive Lenis (web-motion) and let R3F render in
the same animation frame (the default). Don't start extra `requestAnimationFrame` loops per component;
use `useFrame` (R3F) or one loop per canvas (vanilla). Clamp `dt` (`Math.min(delta, 1/30)`) so a tab
returning from the background doesn't jump or explode physics.

## Several worlds on one canvas

Each act of a scroll story is its own `THREE.Scene` + camera (own background, fog, lights). In R3F:
create them in a hook, register them by index, and render JSX into them with `createPortal(children, scene)`.
A compositor decides which one or two render this frame (`compositing.md`).

```ts
export function useWorld(index: number, opts: { fov: number; background: string; fog?: THREE.Fog | THREE.FogExp2 }) {
  const world = useMemo(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(opts.background)
    if (opts.fog) scene.fog = opts.fog
    return { scene, camera: new THREE.PerspectiveCamera(opts.fov, innerWidth / innerHeight, 0.1, 400) }
  }, [])
  useEffect(() => { worlds[index] = world; return () => { if (worlds[index] === world) worlds[index] = null } }, [index, world])
  return world
}
```
Each world's `useFrame` starts with `if (weight(index) <= 0) return` so hidden worlds cost nothing.

## Environment light without an HDR file

```ts
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture   // soft studio reflections
scene.environmentIntensity = 0.35
pmrem.dispose()                                                             // keep the texture, drop the generator
```
Use a real `.hdr`/`.exr` (drei `<Environment files>`) when reflections must show a specific place.
