# Performance budgets and how to measure them

## Budgets

| Budget | Target | Why |
| --- | --- | --- |
| Frame time during a transition | 16.7ms typical; **no frame over ~33ms** on desktop, and none over 50ms on a phone with 4x CPU slowdown | Anything more reads as a stutter |
| Animated properties | **`transform` (`translate`, `scale`, `rotate`) and `opacity` only** | These run on the GPU without re-laying-out or repainting the page |
| Time from click to first movement | Under ~150ms, including on a slow route | The site must feel like it heard the click |
| Layout shift (CLS) | 0 from the loader and from page entry | Images need width/height; reserve space for anything that appears |
| Transition length | Set by the designer via web-motion (Sang: 800ms total) | Longer feels cinematic; repeated navigation gets tiring, so keep each phase clear and never overlap them |
| Loader | Fixed-length intro once per session (>= 400ms, its full animation); hard cap 4s waiting on assets | No accidental delays; no trapping |
| Extra JavaScript | GSAP core ~72KB minified, Motion (full) larger than `m`/`mini`; import only what a page needs | Native transitions cost no library at all |

## Rules of thumb

- Do not animate `filter: blur()` across a whole page (expensive on large snapshots). A small, brief blur on a small element is the most it should ever be.
- Do not use `backdrop-filter` on layers that are part of a transition.
- `will-change: transform` only on elements that are about to move (the curtain box), never on many elements permanently.
- Snapshots of very large pages are expensive. Name only what needs to move (`view-transition-name`); keep the header out of the page snapshot.
- Keep the callback that runs during a native transition tiny. The screen is frozen until it finishes.
- Prefetch: `<Link>` prefetches when visible; prefetched pages transition instantly. Dynamic routes need a Suspense skeleton (see `view-transitions.md`) to feel instant.
- Images that morph must be decoded before the transition starts. React's `<ViewTransition>` already holds the transition for images inside it; do not add your own decode bridge unless you measure a blink.
- **Test the production build.** Dev mode is slower and hides bugs that only minified CSS/JS shows (see the `.8s` pitfall).

## Measure it (Playwright, works in Chromium, Firefox and WebKit)

Run against a **production build** (`next build && next start`).

```js
// measure.mjs   node measure.mjs   (needs: npm i -D @playwright/test)
import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
const page = await context.newPage()

// phone-like slowdown (Chromium only)
// const cdp = await context.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

await page.addInitScript(() => {
  window.__frames = []; window.__props = new Set(); window.__timing = {}
  let last = performance.now()
  const tick = (t) => {
    window.__frames.push(t - last); last = t
    for (const a of document.getAnimations()) {
      const pe = a.effect?.pseudoElement // animations on ::view-transition-* pseudo-elements
      if (!pe) continue
      const keys = a.effect.getKeyframes().flatMap((k) => Object.keys(k))
      keys.filter((p) => !['offset', 'easing', 'composite', 'computedOffset'].includes(p)).forEach((p) => window.__props.add(p))
      if (keys.includes('opacity')) {
        const ct = a.effect.getComputedTiming()
        window.__timing[pe] = { delay: Math.round(ct.delay), end: Math.round(ct.endTime) }
      }
    }
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
})

await page.goto('http://localhost:3000/')
await page.waitForTimeout(2500) // let the intro finish
await page.evaluate(() => { window.__frames.length = 0; window.__props.clear() })
await page.click('header nav a[href="/about"]')
await page.waitForURL(/about/)
await page.waitForTimeout(1800)

const r = await page.evaluate(() => {
  const f = [...window.__frames].sort((a, b) => a - b)
  const old = Object.entries(window.__timing).find(([k]) => k.includes('old(_t_'))?.[1]
  const neu = Object.entries(window.__timing).find(([k]) => k.includes('new(_t_'))?.[1]
  return {
    frames: f.length,
    p95: +f[Math.floor(f.length * 0.95)].toFixed(1),
    worst: +f[f.length - 1].toFixed(1),
    over33: f.filter((d) => d > 33).length,
    animatedProperties: [...window.__props], // expect only opacity / translate / transform
    overlap: old && neu ? old.end > neu.delay : 'n/a', // old page must end before the new one starts
    oldPage: old, newPage: neu,
  }
})
console.log(r)
await browser.close()
```

Pass when: `worst` is under ~33ms (one hitch on the very first navigation, while code loads, is normal);
`animatedProperties` has nothing but `opacity`, `translate`, `transform` (plus the browser's own
`width`/`height`/`backdropFilter` on the group pseudo-element; those are the browser's morph mechanics,
not yours); `overlap` is `false`.

For the curtain, sample per frame the box's position (`getBoundingClientRect()` on the box while
`data-active="true"`) and the content's computed opacity, and assert the content stays at ~0 for every
frame the box is on screen after the route swap.

Results from the demo (production build; fade, slide, curtain at 800ms; Chromium, Firefox, WebKit and phone
emulation at 4x CPU): p95 frame 16.7 to 18ms; worst frame 9 to 33ms; at most one frame over 33ms per run;
fade and slide: old page ends at 280ms, new page runs 280 to 800ms (no overlap); curtain: 0 frames of early
content; no console errors.

Slow-route test: intercept the route with a delay (`page.route('**/journal**', ...)`), click, and confirm no
frame gap over 100ms in `window.__frames` while waiting.
