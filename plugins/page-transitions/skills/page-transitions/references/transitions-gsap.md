# GSAP transitions (choreographed curtain)

**Use GSAP when** you need exact sequencing (cover, swap, uncover; staggered text; canvas, SVG or
WebGL), or a transition that must look identical in every browser, including those without View
Transitions. **Do not use it** for a simple fade or slide: native is smoother and needs no JavaScript.

Since GSAP 3.13 (April 2025) every plugin is free (SplitText, Flip, MorphSVG, ScrollTrigger, and so on): `npm i gsap`,
then `import { SplitText } from 'gsap/SplitText'`. Latest checked: 3.15 (adds `easeReverse`, so a reversed
ease-out no longer becomes an ease-in). Core is ~72KB minified before gzip; import only the plugins you use.

## The curtain (tested in Chromium, Firefox and WebKit)

The designer's version, in four steps. The new page's content is **never** visible while the box is on screen.

```
1. COVER    A box (same colour every time) slides up and covers the old page        0.30 x dur
2. HOLD     The route changes underneath. New content is held invisible
3. UNCOVER  The box slides away (up, or back down like a shutter) onto an EMPTY page 0.35 x dur
4. CONTENT  Only now does the new page's content fade and rise in                   0.35 x dur
```

Total = `--pt-dur` (plus the short wait for the route to commit). Measured with `--pt-dur: 800ms`:
box covers at ~240ms, route swaps ~290ms, box leaves 375 to 600ms, content complete ~840ms, all done ~925ms;
**0 frames** with new content visible while the box was on screen, in all three engines.

Only `transform` moves (the box) and `opacity`/`translate` (the content). The native transition is told
to stay quiet by the `curtain: 'none'` entry in the type map (`view-transitions.md`).

```tsx
// components/curtain.tsx
'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'

type CurtainApi = { run: (navigate: () => void) => Promise<void> }
const CurtainContext = createContext<CurtainApi | null>(null)
export function useCurtain() {
  const api = useContext(CurtainContext)
  if (!api) throw new Error('useCurtain must be used inside <CurtainProvider>')
  return api
}

const MAX_COVER_MS = 8000 // longest the box waits for a route; then reveal whatever is there
// Shares of the total duration. They add up to 1.
const COVER = 0.3
const UNCOVER = 0.35
const CONTENT = 0.35

/**
 * Read --pt-dur in seconds. CSS minifiers rewrite `800ms` as `.8s`, so the unit must be read:
 * assuming "milliseconds" made the curtain run ~1000x too fast in a production build.
 */
function durationSeconds() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--pt-dur').trim()
  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value)) return 0.8
  return raw.endsWith('ms') ? value / 1000 : value
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export function CurtainProvider({ children }: { children: ReactNode }) {
  const panel = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const onCommit = useRef<(() => void) | null>(null)
  const busy = useRef(false)

  useEffect(() => { onCommit.current?.(); onCommit.current = null }, [pathname]) // the route arrived

  useEffect(() => {
    const el = panel.current
    return () => { if (el) gsap.killTweensOf(el) } // clean up if unmounted mid-animation
  }, [])

  const run = useCallback(async (navigate: () => void) => {
    const el = panel.current
    if (!el || busy.current) return
    busy.current = true
    const root = document.documentElement
    const total = durationSeconds()
    const exitDown = false // designer's choice: box leaves upward (keeps going) or downward (shutter)

    el.dataset.active = 'true'      // visible + blocks clicks while the page is covered
    root.dataset.ptCurtain = 'on'   // keeps the header out of the native snapshot (CSS below)
    try {
      await gsap.fromTo(el, { yPercent: 100 }, { yPercent: 0, duration: total * COVER, ease: 'power3.inOut' })

      root.dataset.ptHold = 'true'  // new content stays invisible from here until the box has left
      const arrived = new Promise<void>((resolve) => { onCommit.current = resolve })
      navigate()
      await Promise.race([arrived, sleep(MAX_COVER_MS)])
      onCommit.current = null

      await gsap.to(el, { yPercent: exitDown ? 100 : -100, duration: total * UNCOVER, ease: 'power3.inOut', delay: 0.05 })

      root.dataset.ptContent = 'in'  // the box is gone and the page is empty: content arrives (CSS)
      delete root.dataset.ptHold
      await sleep(total * CONTENT * 1000 + 50)
    } finally {
      gsap.set(el, { yPercent: 100 })
      el.dataset.active = 'false'
      delete root.dataset.ptCurtain
      delete root.dataset.ptHold
      delete root.dataset.ptContent
      busy.current = false
    }
  }, [])

  const api = useMemo(() => ({ run }), [run])
  return (
    <CurtainContext.Provider value={api}>
      {children}
      <div ref={panel} className="curtain" data-active="false" aria-hidden="true" />
    </CurtainContext.Provider>
  )
}
```

```css
/* GSAP alone owns the box's transform. A CSS transform here would ADD to GSAP's (it did: the box started 200% away). */
.curtain { position: fixed; inset: 0; z-index: 200; background: var(--ink); visibility: hidden; pointer-events: none; will-change: transform; }
.curtain[data-active='true'] { visibility: visible; pointer-events: auto; }

/* While the box covers the page, new content is held invisible. After the box has left, it arrives on its own. */
html[data-pt-hold] #main { opacity: 0; }
html[data-pt-content='in'] #main { animation: pt-content-in calc(var(--pt-dur) * 0.35) var(--pt-ease) both; }
@keyframes pt-content-in { from { opacity: 0; translate: 0 var(--pt-rise); } }

/* During a native transition the browser draws the named header above everything, i.e. on top of the box. Un-name it while the curtain runs. */
html[data-pt-curtain] .site-header { view-transition-name: none; }
```

Wire it in the link: `if (type === 'curtain') void curtain.run(() => router.push(target, { transitionTypes: [type] }))`.

Rules for GSAP transitions:
- **Hold, then reveal, then content.** Hide new content with `opacity` (not `visibility`) so focus can still move to the new `<h1>` while the box is up.
- **Reduced motion: skip the curtain entirely** and navigate with the quiet fade (`pickType` in `view-transitions.md` does this).
- **Never wait forever:** keep `MAX_COVER_MS`. A hung route must not leave the site covered.
- **The box blocks input** (`pointer-events: auto`) for about a second. This is deliberate; it prevents a second run. `busy` is the backstop. Native styles do not block.
- **Wait for the route to commit** (the pathname effect) before uncovering. Never guess with a fixed delay.
- Animate `transform`/`opacity` only (`x`, `y`, `xPercent`, `yPercent`, `scale`, `rotation`, `autoAlpha`).
- Inside components prefer `useGSAP` from `@gsap/react` (scopes selectors and reverts on unmount). Standalone `gsap.to` in event handlers is fine when tweens are killed on unmount as above.
- Do not run GSAP on an element while a native transition is also animating it.
- Two boxes are not needed: one box that covers, holds and uncovers looks identical to "a box, then another box on the new page", and cannot get out of step. Give the uncover its own direction (up or down) if the designer wants variety.
- Same-page layout changes (a grid re-sorting, a card expanding): use the **Flip** plugin (record state, change layout, `Flip.from`).
- Scroll-linked pieces (ScrollTrigger): call `ScrollTrigger.refresh()` after the new page mounts, and kill triggers on unmount.
- Text splitting (SplitText): split after fonts are ready; revert on unmount; use its `aria` option so screen readers still read the original text.

*Not run in the demo:* the Flip, ScrollTrigger and SplitText notes are standard usage, listed for orientation. Test them in the project before relying on them.

## Overlay choreography: gallery, menu, one-direction wipe

Overlays (a gallery, a phone menu, a page wipe) are **lists of tweens with exact start times**, not one animation played forward and back.
Write them as data (target, property, from, to, start, duration, curve), build the timeline from the list, and keep the list as the single source of truth.
Numbers from a studied page (house exit rule applies: see below):

| Sequence | Tweens (start → duration, curve) |
| --- | --- |
| **Gallery opens** | backdrop opacity 0 → 1 (0 → 1.2s, in-out strong); photo panel `yPercent` 10 → 0 (0.3 → 1.0s, in-out); content opacity 0 → 1 (0.4 → 1.4s, ease-out) |
| **Gallery closes** | content 1 → 0 (0 → 0.4s); backdrop 1 → 0 (0 → 1.2s); panel 0 → 10% (0.7 → 1.0s); `display: none` at 1.0s |
| **Page wipe** | black sheet `yPercent` 100 → 0 (0 → 0.7s, in-out strong); route resets while covered; hold 0.15s; sheet 0 → −100 (0.85 → 0.9s, in-out): it **enters from the bottom and leaves through the top**, never back down |
| **Phone menu opens** | dark sheet `yPercent` −100 → 0 (0 → 0.5s); three big words `yPercent` 120 → 0 from masks (0 / 0.1 / 0.2 → 1.0s, in-out); “Close” 0.3s at 0.3, description at 0.5, credit at 0.7 |
| **Phone menu closes** | words back (reverse order, 0.1s apart, 1.0s); description and credit out (0.3s); sheet −100% (0.4 → 0.5s, ease-in); `display: none` at 1.0s |

```ts
const open = gsap.timeline()
  .fromTo(blur,  { opacity: 0 },               { opacity: 1, duration: 1.2, ease: 'ease.inOutStrong' }, 0)
  .fromTo(panel, { yPercent: 10, y: 0 },       { yPercent: 0, duration: 1.0, ease: 'ease.inOut' }, 0.3)
  .fromTo(popup, { opacity: 0 },               { opacity: 1, duration: 1.4, ease: 'ease.out' }, 0.4)
lenis?.stop()                                   // the page behind must not scroll while it is open
```
- **Closing is not the opening played backwards.** Text leaves first and fast; the big surface waits and leaves last; `display: none` is set at the end. In house style, scale the whole close by `exit-ratio` (0.6) and keep the order. The studied page's close was as long as its open, which suits a showcase but not product UI.
- **Blur the backdrop with a static `backdrop-filter` and tween its `opacity`.** Never tween the blur amount (`filter` on a large area is expensive).
- **GSAP owns both ends:** set the start state in the timeline (`yPercent: 10, y: 0`), not in the stylesheet, or a CSS `translate` and the tween add up.
- **Overlays are dialogs:** `role="dialog" aria-modal="true"` and a label; move focus in on open (the close button) and **back to the opener on close**; **Escape closes**; stop smooth scrolling and page scroll while open (`lenis.stop()` / `start()`, or `overflow: hidden` on the page, with `overscroll-behavior: contain` inside); `inert` on the page behind if you can.
- **Interrupt safely:** `timeline.kill()` before building the other direction; guard against a second click during a wipe.
- Reduced motion: no travel; show and hide the overlay with a short fade.
