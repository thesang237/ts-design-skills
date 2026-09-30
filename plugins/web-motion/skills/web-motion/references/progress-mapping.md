# Progress mapping, stagger windows and smooth following

Scroll effects, scroll scenes, particle morphs and hover lifts all reduce to a few lines of maths.
Knowing them means you can build scroll motion without a library, and read any library's output.

## 1. The four-step recipe

Any value driven by a progress number (scroll, a timeline, a hover amount):

```ts
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const local = clamp((progress - start) / (end - start)) // 1 normalise, 2 clamp: 0 before, 1 after
const eased = easeOut(local)                              // 3 ease (a preset curve)
el.style.opacity = String(lerp(0, 1, eased))               // 4 lerp into real units
```

The window `[start, end]` is a keyframe pair; the ease is the graph-editor curve. A short window is a
punchy move; a long one is gentle.

`smoothstep(e0, e1, x)` does steps 1 to 3 in one call with a soft S-curve: `t = clamp((x - e0) / (e1 - e0)); t * t * (3 - 2 * t)`.
Use it for fades, masks and "visible between these two points" logic.

## 2. Stagger from data (stagger windows)

To stagger many items from **one** progress value, give each item its own window. The delay comes
from data about the item (its height, distance from centre, index) plus a small random:

```ts
// per item, every frame (or once per scroll update)
const delay = item.order * SPREAD + item.rand * JITTER   // e.g. order = height 0..1, rand = seeded 0..1
const p = clamp((progress - delay) / DURATION)            // this item's own 0..1
apply(item, ease(p))
// the whole sequence lasts SPREAD + JITTER + DURATION; map the incoming 0..1 onto that length
```

- `order` sets the direction: bottom → top (height), top → bottom (`1 - height`), centre out
  (distance), random.
- `JITTER` around 10 to 15% of the spread keeps it organic; 0 looks mechanical.
- Use a **seeded** random (`mulberry32(seed)`) so the stagger is the same on every visit.
- The same trick scales to thousands of items in a shader: one random per item,
  `smoothstep(rnd * 0.45, rnd * 0.45 + 0.55, progress)` (see 3d-web).

## 3. Mapping a word-by-word reading effect

```ts
const at = i / (words.length - 1)                            // each word's position along the scroll
const a = smoothstep(at - soft, at, progress * (1 + soft))    // soft = how many words fade at once
word.style.opacity = String(dim + (1 - dim) * a)             // dim ≈ 0.12: unread words stay faintly visible
```
Reduced motion: show the paragraph fully.

## 4. Following a moving target: damp, not a fixed lerp

"Move 10% of the way each frame" is a lovely ease-out with no duration, but it runs faster on 120Hz
screens. Convert it to a rate per second:

```ts
const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt))        // dt in seconds

// every frame
pointerSmooth.x = damp(pointerSmooth.x, pointer.x, 3.5, dt)
```

| λ (lambda) | Feel | Use for |
| --- | --- | --- |
| 2 to 4 | Heavy, luxurious | Camera parallax, background layers |
| 6 to 10 | Responsive, soft | Hover lift amounts, glow, UI following |
| 15+ | Nearly instant | Almost never needed |

Converting an existing per-frame factor `f` (tuned at 60fps): `λ = -ln(1 - f) × 60`.

**GSAP alternative for DOM elements:** `gsap.quickTo(el, 'x', { duration: 0.5, ease: 'ease.out' })`
returns a function you call on every pointer move. It retargets one reusable tween instead of
creating a new one per event (don't call `gsap.to` in `mousemove`).

## 5. Pointer as a number

Normalise the pointer to −1..1 on both axes (centre 0, up positive) so effects don't depend on screen
size, keep a raw copy for hit-testing and a damped copy for everything visual:

```ts
pointer.x = (e.clientX / innerWidth) * 2 - 1
pointer.y = -(e.clientY / innerHeight) * 2 + 1
```
Parallax: each layer moves `smooth.x * strength * depth`; near layers move more. Keep the subject
nearly still. Only with `(hover: hover) and (pointer: fine)`; off for reduced motion.

## 6. Continuous → discrete (without re-rendering every frame)

When scroll progress decides which section/caption is active, compute it in the scroll callback and
update UI state **only when it changes**:

```ts
onUpdate: (self) => {
  const section = sectionAt(self.progress * TOTAL)
  if (section !== current) { current = section; setSection(section) }  // a handful of renders per visit
  railFill.style.transform = `scaleY(${self.progress})`                 // direct write, no React
}
```
Remount the caption with `key={section}` so its reveal replays cleanly.
