# Cleaning up when the page changes

GPU memory isn't freed by garbage collection. In a single-page app every route change that leaves
3D behind can leak geometries, textures and whole WebGL contexts.

## What frees itself and what doesn't

| Created as | Freed automatically? |
| --- | --- |
| R3F JSX objects (`<mesh>`, `<boxGeometry>`, `<meshStandardMaterial>`) | Yes, on unmount |
| `useLoader` / `useGLTF` results | Cached for reuse; call `useGLTF.clear(url)` if a model must be dropped |
| Anything made with `new` in `useMemo`/setup (geometries, materials, textures, render targets, PMREM output, GPGPU renderers) | **No: dispose in cleanup** |
| Event listeners, `gsap.ticker` callbacks, observers, intervals, audio contexts | **No: remove in cleanup** |
| Module-level stores (dials objects) | **No: they survive route changes; reset them on mount** |
| Global DOM changes (`body.style.cursor`, `data-*` attributes, scroll lock) | **No: restore in cleanup** |

## Cleanup pattern

```ts
useEffect(() => {
  const bundle = { geo, mat, rt, env }                            // everything created with `new`
  return () => {
    Object.values(bundle).forEach((o) => o?.dispose?.())
    document.body.style.cursor = ''
    gsap.ticker.remove(tick)
  }
}, [])

// vanilla: dispose a whole subtree
root.traverse((o) => {
  o.geometry?.dispose()
  for (const m of [].concat(o.material ?? [])) {
    for (const v of Object.values(m)) if (v?.isTexture) v.dispose()
    m.dispose()
  }
})
renderer.dispose()
renderer.forceContextLoss()   // page-level vanilla canvases only; frees the context immediately
```

## Verify

1. Open the 3D page, then navigate away and back three times (client-side navigation).
2. After each return, compare JS heap (DevTools Memory, or `performance.memory` in Chromium) and
   `renderer.info.memory` (geometries, textures). They must stay flat, not step up each time.
3. Count WebGL contexts (hook `getContext`, or look for "Too many active WebGL contexts" warnings).
4. Check the cursor, scroll lock and body attributes are back to normal on the page you left to.
