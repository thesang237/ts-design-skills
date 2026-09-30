# Motion presets

One file holds the taste. CSS variables, GSAP eases and Motion transitions are all generated from it,
so retuning a site means changing one value. Sang's defaults (taste session 2026-09-30):

| Preset | Value | Use it for |
| --- | --- | --- |
| `ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | Anything entering or answering a click (the main curve) |
| `ease-in-out` | `cubic-bezier(0.65, 0, 0.35, 1)` | Something already on screen moving from A to B: toggles, tabs, reorder |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Short exits only |
| `linear` | `linear` | Scroll-scrubbed motion, loops, typing |
| `fast` | 160ms | Press, hover colour, small toggles |
| `base` | 240ms | Menus, tooltips, popovers, dropdowns |
| `slow` | 400ms | Modals, drawers, showcase-card hovers |
| `reveal` | 700ms | Content arriving on scroll or first load |
| `page` | 800ms | Total page change (owned by page-transitions) |
| `exit-ratio` | 0.6 | Exit duration = entrance x 0.6 (never under 100ms) |
| `rise` | 18px | How far revealed content travels |
| `lift` | 2px | Hover lift |
| `press` | 0.97 | Scale while pressed |
| `stagger` | 70ms | Between items in a group; words x0.5, characters x0.2 |
| `stagger-cap` | 490ms | A group never takes longer than this to start its last item |
| `spring` | 0.4s, bounce 0.1 | Drag, swipe, gestures, switches |
| reduced: fade in / out | 160ms / 100ms | Replaces all movement when reduced motion is on |

Smooth-out is the only arrival curve: no strong-out, expo-out or library presets (`power3.out`,
`expo.out`, `back.out`), in any project, **except inside immersive-site mode** (a stronger arrival
curve and one elastic release, scoped by class; see `immersive.md`).

## 1. The source file (TypeScript)

```ts
// motion/presets.ts
export const EASE = {
  out: [0.22, 1, 0.36, 1],
  inOut: [0.65, 0, 0.35, 1],
  in: [0.4, 0, 1, 1],
} as const

export const DUR = { fast: 160, base: 240, slow: 400, reveal: 700 } as const // ms
export const EXIT_RATIO = 0.6
export const DIST = { rise: 18, lift: 2 } as const // px
export const PRESS = 0.97
export const STAGGER = { step: 70, cap: 490 } as const // ms
export const SPRING = { visualDuration: 0.4, bounce: 0.1 } as const
export const REDUCED = { fadeIn: 160, fadeOut: 100 } as const

export const exitMs = (enterMs: number) => Math.max(100, Math.round(enterMs * EXIT_RATIO))

/** Seconds between items, smaller for words/characters, capped for long groups. */
export function staggerStep(count: number, unit: 'items' | 'words' | 'chars' = 'items') {
  const step = STAGGER.step * (unit === 'chars' ? 0.2 : unit === 'words' ? 0.5 : 1)
  return (count > 1 ? Math.min(step, STAGGER.cap / (count - 1)) : step) / 1000
}
```

## 2. The same values as CSS variables

Write them once in the global stylesheet (or generate them from the TS file at build time).

```css
:root {
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --dur-fast: 160ms;
  --dur-base: 240ms;
  --dur-slow: 400ms;
  --dur-reveal: 700ms;
  --rise: 18px;
  --lift: 2px;
  --press: 0.97;
  --stagger: 70ms;
  /* the gesture spring as a CSS curve (see section 5) */
  --spring: 550ms linear(0, 0.0697, 0.2172, 0.3828, 0.5364, 0.6654, 0.767, 0.8432, 0.8981, 0.9364,
    0.9621, 0.9788, 0.9892, 0.9954, 0.9988, 1.0006, 1.0013, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root { --rise: 0px; --lift: 0px; --press: 1; --spring: 0ms linear; }
}
```

Usage: `transition: transform var(--dur-fast) var(--ease-out);`

## 3. GSAP: register the curves by name

GSAP doesn't read `cubic-bezier()` strings. Register the same curves once with CustomEase (free
since GSAP 3.13) and use the names everywhere instead of `power3.out`.

```ts
import gsap from 'gsap'
import { CustomEase } from 'gsap/CustomEase'
import { EASE } from './presets'

gsap.registerPlugin(CustomEase)
const path = ([x1, y1, x2, y2]: readonly number[]) => `M0,0 C${x1},${y1} ${x2},${y2} 1,1`
CustomEase.create('ease.out', path(EASE.out))
CustomEase.create('ease.inOut', path(EASE.inOut))
CustomEase.create('ease.in', path(EASE.in))
gsap.defaults({ ease: 'ease.out', duration: 0.7 })

// gsap.to(el, { y: 0, autoAlpha: 1 })   <- uses the house curve and reveal duration
```

## 4. Motion: set the defaults once

```tsx
import { MotionConfig } from 'motion/react'
import { EASE, DUR } from './presets'

<MotionConfig reducedMotion="user" transition={{ duration: DUR.reveal / 1000, ease: [...EASE.out] }}>
  {children}
</MotionConfig>
```

Springs for gestures: `transition={{ type: 'spring', visualDuration: SPRING.visualDuration, bounce: SPRING.bounce }}`.
`visualDuration` is the time until it *looks* arrived; the tiny settle after that doesn't count, so
springs sit on the same timing scale as everything else.

## 5. One spring for CSS and JavaScript

Motion turns a spring into a CSS `linear()` curve, so a CSS switch and a Motion drag feel identical.

```ts
import { spring } from 'motion'
// "550ms linear(0, 0.0697, ...)" : settle time plus the curve
document.documentElement.style.setProperty('--spring', spring(0.4, 0.1).toString())
```

```css
.switch-knob { transition: transform var(--spring); }
```

Precompute the string (as in section 2) when the project has no JavaScript at that point. `linear()`
is supported in all current browsers; older ones ignore the declaration, so keep a plain fallback
first: `transition: transform 240ms var(--ease-out); transition: transform var(--spring);`

## 6. A tuner during design reviews

The demo (`demos/web-motion`) keeps the presets in React state, writes them to the CSS variables,
re-registers the GSAP eases and passes them to `MotionConfig`, so sliders retune the whole page
live. Use the same idea in a project during reviews, then paste the chosen values back into
`presets.ts`. Never ship the tuner.

## 7. Values used by page-transitions

page-transitions uses the same three curves and takes its phases as fractions of the 800ms page
duration (`--pt-dur`). Its first-load entrance (700ms, 18px rise, 70ms stagger) is this file's
`reveal` / `rise` / `stagger`.
