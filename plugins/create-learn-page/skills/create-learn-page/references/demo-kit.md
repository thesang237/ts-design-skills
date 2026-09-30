# The demo kit

Demos are **teaching copies**: small, readable rebuilds of one technique, with the source's real
values as defaults. Import the source's pure helpers (math, noise, easing, text-scramble) read-only
so numbers match exactly; rebuild everything else.

## Dials without re-renders: `useParams`

Sliders need React state (to show values); the animation loop needs the latest value without
re-rendering 60 times a second. Keep both, updated together in the event handler:

```ts
export function useParams<T extends Record<string, unknown>>(defaults: T) {
  const [p, setP] = useState(defaults);
  const ref = useRef(defaults);
  const set = useCallback(<K extends keyof T>(k: K, v: T[K]) => { ref.current = { ...ref.current, [k]: v }; setP(ref.current); }, []);
  const reset = useCallback(() => { ref.current = defaults; setP(defaults); }, [defaults]);
  return { p, set, ref, reset };          // p for the UI, ref.current inside frame loops
}
```
Define `DEFAULTS` at module level (a stable object), copied from the source's values.

## One clock, paused off screen: `useTicker`

```ts
export function useTicker(host: RefObject<Element | null>, cb: (time: number, dt: number) => void) {
  const fn = useRef(cb);
  useEffect(() => { fn.current = cb; });
  useEffect(() => {
    const el = host.current; if (!el) return;
    let visible = false;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { rootMargin: '120px' });
    io.observe(el);
    const tick = (t: number, ms: number) => { if (visible && !document.hidden) fn.current(t, Math.min(ms / 1000, 1 / 20)); };
    gsap.ticker.add(tick);
    return () => { io.disconnect(); gsap.ticker.remove(tick); };
  }, [host]);
}
```

## The canvas harness: `useThreeCanvas(host, setup, deps, options)`

One hook owns the boring parts so every 3D demo is only its scene:

- creates the `<canvas>` and `WebGLRenderer` (antialias, capped pixel ratio, tone mapping option),
  shows a text fallback if WebGL fails
- `ResizeObserver` → `setSize` + the demo's `resize(w, h)`
- pointer in NDC (−1..1) plus pixel coordinates, `over`, `down`, `moved`, and a click (moved < 6px,
  < 350ms) → `onClick`
- runs `frame(time, dt)` on the shared ticker only while on screen
- cleanup: remove listeners, `app.dispose()`, `renderer.dispose()`, `renderer.forceContextLoss()`,
  remove the canvas

`setup(ctx)` builds the scene once and returns `{ frame, resize?, onClick?, dispose? }`. Inside
`frame`, read dials from `ref.current` and use `ctx.host` (not a React ref) for DOM writes like the
cursor. Browsers allow roughly 16 WebGL contexts per page: lazy chapters + disposing on unmount keep
you far below that.

## Demo types that teach well

| Type | What it is | Good for |
| --- | --- | --- |
| **X-ray** | The real timeline/config drawn as tracks, a draggable playhead, live values | Choreography, "what does scroll actually change" |
| **Build-up slider** | One slider adds one ingredient per step (1 → 7) with a caption per step | Scenes, shaders, anything layered |
| **Side by side** | Same content, two techniques, a graph under each | Native vs smooth scroll, lerp vs damp |
| **Mapper** | Input (scroll box or slider) → window/curve graph → output, with the live formula | Progress mapping, easing |
| **Lab with presets** | Presets from the source + every dial exposed + replay | Text reveals, scramble, materials |
| **Rebuilt hero** | The source's signature object with its real parameters as dials | The "wow" chapter |
| **Director view** | A second camera films the first (picture in picture) | Camera rails |
| **Bench** | Live numbers (fps, draw calls, CPU ms, renders) while toggling a technique | Performance |
| **Generator** | The reader's inputs → code they can copy | Build-your-own chapter |

## Demo rules

- Defaults equal the source; the hint line says what to do first.
- Every dial has a one-line meaning (`help`); group dials (Timeline, Hover, Look…).
- A reset button; no dial combination may crash or freeze the page.
- No allocations in frame loops; reuse vectors.
- Scroll boxes inside demos get `data-lenis-prevent` and `overscroll-behavior: contain`.
- Sound only after a user gesture, off by default.
- Reduced motion: demos don't auto-play large movement; the reader starts it.
