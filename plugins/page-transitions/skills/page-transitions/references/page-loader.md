# The first-load loader / intro

**Goal:** a calm, fixed-length intro that plays **once per session**, never overlaps the page, never
depends on the libraries it is waiting for, and never traps a visitor on a slow connection.

Page transitions between pages are a different piece (`view-transitions.md`). The loader does not
run on navigation.

## Two modes, chosen with two numbers

| Mode | `SHOW_AFTER_MS` | `MIN_VISIBLE_MS` | Result |
| --- | --- | --- | --- |
| **Intro** (the designer's choice in this skill) | `0` | the intro's length, at least 400 | Loader visible from the first frame, always plays in full, once per session |
| **Only when slow** (default if the designer has not asked for an intro) | `200` | `0` | Page hidden for up to 200ms; if ready, no loader is ever seen; otherwise the loader appears and leaves as soon as ready |

Ask the designer which one. A loader that "disappears immediately" the moment the page is ready
feels like a flash; that is why the intro has a minimum visible time. For a Lottie loader,
`MIN_VISIBLE_MS` = the file's full duration (never less than 400ms).

## The rules

1. **One thing at a time.** The page is hidden while the loader shows. The loader plays its exit and is completely gone. *Then* the page fades in. *Then* first-load entrances (Motion) start. Never a crossfade between loader and page.
2. **Stays visible for its whole animation** (`MIN_VISIBLE_MS`), and also until real needs are met: fonts plus the few images marked `data-critical`. Not every image on the page.
3. **Hard cap (~4s)** on waiting for assets. A slow image must not trap the visitor.
4. **Once per session** (`sessionStorage`), decided in an inline script before first paint.
5. **Server-rendered CSS**, so it appears even if JavaScript is slow. It must not depend on GSAP, Motion, or an animation file that may be what is still loading.
6. **No content flash**: the page is `visibility: hidden` until the loader has left. Without JavaScript, never hide it (`<noscript>` rule).

Audit note: the project this was learned from waited for *every* image and for one full pass of a
2-second animation, then had no minimum/maximum logic tied to the design. It stayed ~3.2s on a fast
connection and ~30s on a slow one, and fetched its animation engine (WebAssembly) from a public CDN.

## States

```
<html data-boot="intro" data-loader="on">    loader visible (page hidden)
<html data-boot="leaving" ...>               loader plays its exit (page still hidden)
<html data-boot="entering">                  page fades in (loader gone)
<html>                                       finished; Reveal entrances may play
```

## Code

```ts
// lib/boot-script.ts: inline in <head>, runs before React
export const SHOW_AFTER_MS = 0        // 0 = intro. 200 = only when slow
export const MIN_VISIBLE_MS = 1400    // the intro's full length; never under 400
export const SEEN_KEY = 'app:boot-seen'

export const bootScript = `(function(){
  var d = document.documentElement;
  try { if (sessionStorage.getItem(${JSON.stringify(SEEN_KEY)})) return; } catch (e) {}
  d.style.setProperty('--boot-min', ${MIN_VISIBLE_MS} + 'ms');
  function show() { d.dataset.boot = 'intro'; d.dataset.loader = 'on'; window.__bootShownAt = performance.now(); }
  if (${SHOW_AFTER_MS} === 0) { show(); return; }
  d.dataset.boot = 'pending';
  setTimeout(function(){ if (d.dataset.boot === 'pending') show(); }, ${SHOW_AFTER_MS});
})();`
```

```tsx
// app/layout.tsx (excerpt)
<html lang="en" suppressHydrationWarning>   {/* the script edits <html> before hydration */}
  <head>
    <script dangerouslySetInnerHTML={{ __html: bootScript }} />
    <noscript>
      <style>{`html[data-boot] #app{visibility:visible!important} #boot-loader{display:none!important} [data-reveal]{opacity:1!important;transform:none!important}`}</style>
    </noscript>
  </head>
  <body>
    <BootLoader />
    <div id="app">{/* header, main, ... */}</div>
  </body>
</html>
```

```tsx
// components/boot-loader.tsx: server component
import { BootController } from './boot-controller'
export function BootLoader() {
  return (
    <>
      <div id="boot-loader" role="status" aria-live="polite">
        <span className="boot-mark">Studio</span>
        <span className="boot-bar" aria-hidden="true"><i /></span>
        <span className="sr-only">Loading</span>
      </div>
      <BootController />
    </>
  )
}
```

```tsx
// components/boot-controller.tsx
'use client'
import { useEffect } from 'react'
import { MIN_VISIBLE_MS, SEEN_KEY } from '@/lib/boot-script'
import { entrance } from '@/lib/entrance' // { armed: true }, see transitions-motion.md

const MAX_WAIT_MS = 4000 // never trap the visitor
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function whenImageReady(img: HTMLImageElement) {
  const settled = img.complete
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true }) // a broken image must not block
      })
  return settled.then(() => img.decode?.().catch(() => undefined))
}

function collectReadiness() {
  const tasks: Promise<unknown>[] = [document.fonts?.ready ?? Promise.resolve()]
  document.querySelectorAll<HTMLImageElement>('img[data-critical]').forEach((img) => tasks.push(whenImageReady(img)))
  return tasks
}

/** Resolve when the named CSS animation ends on `el`, or after `fallbackMs`. */
function animationEnd(el: Element | null, name: string, fallbackMs: number) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, fallbackMs)
    el?.addEventListener('animationend', function onEnd(e) {
      if ((e as AnimationEvent).animationName !== name || e.target !== el) return
      el.removeEventListener('animationend', onEnd)
      clearTimeout(timer)
      resolve()
    })
  })
}

async function boot() {
  const root = document.documentElement
  if (!root.dataset.boot) return

  // Ready = real needs met AND the loader has been visible for its full length.
  const ready = Promise.race([Promise.all(collectReadiness()), sleep(MAX_WAIT_MS)])
  const shownAt = (window as unknown as { __bootShownAt?: number }).__bootShownAt
  const minimum = shownAt === undefined ? 0 : Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt))
  await Promise.all([ready, sleep(minimum)])

  const app = document.getElementById('app')
  // 1. Loader leaves completely (only if it was ever shown)...
  if (root.dataset.loader) {
    root.dataset.boot = 'leaving'
    await animationEnd(document.getElementById('boot-loader'), 'boot-loader-out', 1500)
  }
  // 2. ...then the page comes in.
  root.dataset.boot = 'entering'
  delete root.dataset.loader
  await animationEnd(app, 'boot-page-in', 1500)

  delete root.dataset.boot // finished: entrances may start now
  try { sessionStorage.setItem(SEEN_KEY, '1') } catch {}
}

export function BootController() {
  useEffect(() => {
    const disarm = () => { entrance.armed = false } // entrances are for the first load only
    window.addEventListener('popstate', disarm)
    void boot()
    return () => window.removeEventListener('popstate', disarm)
  }, [])
  return null
}
```

```css
#boot-loader { display: none; position: fixed; inset: 0; z-index: 100; place-items: center; align-content: center; gap: 1.2rem; background: var(--bg); }
html[data-loader='on'] #boot-loader { display: grid; }
.boot-bar { width: 9rem; height: 2px; background: var(--line); overflow: hidden; }
.boot-bar i { display: block; height: 100%; background: var(--ink); transform-origin: left; transform: scaleX(0); }

/* The intro is a fixed-length animation that lasts --boot-min (set by the inline script). */
html[data-boot='intro'] .boot-mark { animation: boot-mark-in calc(var(--boot-min, 1400ms) * 0.4) var(--pt-ease) both; }
html[data-boot='intro'] .boot-bar i { animation: boot-fill var(--boot-min, 1400ms) cubic-bezier(0.4, 0, 0.2, 1) both; }
@keyframes boot-fill { to { transform: scaleX(0.92); } }   /* waits near the end if loading is slower than the intro */
@keyframes boot-mark-in { from { opacity: 0; translate: 0 8px; } }

/* The page stays hidden until the loader has completely left. */
html[data-boot='pending'] #app, html[data-boot='intro'] #app, html[data-boot='leaving'] #app { visibility: hidden; }
html[data-boot='leaving'] #boot-loader { animation: boot-loader-out calc(var(--pt-dur) * 0.4) var(--pt-ease-inout) both; pointer-events: none; }
html[data-boot='leaving'] .boot-bar i { transform: scaleX(1); }
html[data-boot='entering'] #app { animation: boot-page-in calc(var(--pt-dur) * 0.4) var(--pt-ease) both; }
@keyframes boot-loader-out { to { opacity: 0; translate: 0 -3%; } }
@keyframes boot-page-in { from { opacity: 0; } to { opacity: 1; } }

@media (prefers-reduced-motion: reduce) {
  html[data-boot='intro'] .boot-mark, html[data-boot='intro'] .boot-bar i { animation-name: none; }
  html[data-boot='intro'] .boot-bar i { transform: scaleX(0.5); }
  html[data-boot='leaving'] #boot-loader { animation-duration: 150ms; animation-name: boot-loader-fade; }
  html[data-boot='entering'] #app { animation-duration: 150ms; }
  @keyframes boot-loader-fade { to { opacity: 0; } }
}
```

Mark critical images: `<img data-critical src="/hero.svg" width="1200" height="600" ... />` (give it a size so nothing jumps).

## A Lottie (or other animated) loader

Ask first whether the designer wants one. If so:
- **Host the player runtime and the file on your own domain.** Some Lottie players fetch a WebAssembly file from a public CDN at run time; block that and the loader stalls.
- Set `MIN_VISIBLE_MS` to the animation's full duration (whole loops only), at least 400ms.
- Render a static mark (CSS) first, so something is visible before the player loads; never make the page wait for the player.
- Give it a start timeout (~2s). If it fails, fall back to the CSS intro and still honour the minimum.

## Variant: the hand-over loader (the loader's logo becomes the hero logo)

For showcase and editorial sites. Instead of a loader that leaves and a page that arrives, the loader's animation **is** the page's first frame:
a vector logo builds on a black sheet, the sheet lifts away, and the logo lands exactly where the hero's own logo sits. The page then builds around it. No cut, no
second logo, and old and new content are never both on screen (the only “old” thing is the black sheet).

Measured timeline of a studied page (ms from the start; the intro is ~4.5s, so use it **once per session** and let a click skip it):

| At | What | How |
| --- | --- | --- |
| 0 → 3750 | The logo builds (a Lottie played by a timeline, frame 0 → 99.9%) | the loader layer is a full-screen black sheet with the Lottie on it |
| 1000 → 1900 | The black sheet lifts off the top, revealing the paper; the logo keeps playing on top | `yPercent: -100`, 900ms, in-out |
| 3000 → 3800 | The hero's thick bar grows (height 0 → full) | 800ms, in-out |
| 3200 → 3700 | The hero's own logo fades in under the loader's (identical position and size) | opacity, 500ms |
| 3200 → 4200 | The hairline draws (0 → 98% wide) | 1000ms, in-out |
| 3600, 3700, 3800 | The three hero lines rise from their masks; nav, scroll cue and list fade in; the vertical rule grows | 1000ms ease-out each, 100ms apart |
| 4400 → 4900 | The loader layer fades out (the hero logo underneath is identical) | opacity, 500ms; then `display: none` |

Rules:
- **The loader's last frame must equal the hero composition**: same box (width and aspect ratio), same position. Compare screenshots of the hand-over frame; if they differ by a pixel, the cross-fade shows a double image.
- **The page below does not start building until the sheet has left** (here the first piece starts at 3000, the sheet leaves at 1900).
- **Phones get their own start:** the logo starts 3× larger and 35vh lower and eases into place (1000ms in-out) while the sheet lifts, because the full-width logo is tiny at phone width.
- It is a **fixed-length intro** (never shorter than the whole animation), so it follows the loader rules above: server-rendered start state, `display: none` when done, once per session, a hard timeout if the animation file fails (fall back to the CSS intro).
- Reduced motion: skip the Lottie; show the sheet, then the page, with the quiet fade.

```ts
const tl = gsap.timeline({ paused: true })
tl.to(progress, { p: 99.9, duration: 3.75, ease: 'none', onUpdate: () => setLottieProgress(anim, progress.p) }, 0)
  .to(sheet, { yPercent: -100, duration: 0.9, ease: 'ease.inOut' }, 1.0)
  .to(heroBar, { height: '3.19em', duration: 0.8, ease: 'ease.inOut' }, 3.0)
  .to(heroLogo, { opacity: 1, duration: 0.5, ease: 'none' }, 3.2)
  .to(heroLines, { yPercent: 0, duration: 1, ease: 'ease.out', stagger: 0.1 }, 3.6)
  .to(loader, { opacity: 0, duration: 0.5, ease: 'none' }, 4.4)
  .set(loader, { display: 'none' }, 4.5)
```

## Measured in the demo (production build; intro mode, 1400ms)

| Check | Result |
| --- | --- |
| Loader visible | from the first frame (~70ms) until ~1460ms |
| Loader exit, then page fade-in | 266ms, then ~320ms; frames with loader and page both visible: **0** |
| Reload in the same tab / any later navigation | no loader |
| Reduced motion | same logic, 150ms fades, no console errors |

## Watch out

- Server markup and the client's first render must match. Do not branch on `useReducedMotion()` (or `matchMedia`) to render *different elements* on first render; the server cannot know. Use CSS. (The audited project logged React hydration error #418 for exactly this.)
- `suppressHydrationWarning` on `<html>` is required because the boot script edits it.
- `display: none` on the loader once finished keeps it out of the tab order and the accessibility tree.
- Visible focus and the skip link must still work the moment the page appears.
