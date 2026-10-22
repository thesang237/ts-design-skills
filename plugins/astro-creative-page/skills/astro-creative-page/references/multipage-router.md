# Multi-page: ClientRouter lifecycle, persistence, Scope

Astro's `<ClientRouter />` swaps `<body>` content without a full reload. It fires events you hook once.
Use it with `fallback="none"` when you animate the swap yourself (see page-transitions for recipes).

## Lifecycle

| Event | Do |
| --- | --- |
| `astro:before-preparation` | Wrap `ev.loader`: add `is-navigating`, close the menu, lock scroll, play the leave sound, `await Promise.all([wipeIn(), load()])`. The wipe covers the network time. |
| `astro:before-swap` | Copy runtime `<html>` state onto `ev.newDocument.documentElement` (className, style, `--vh`); remove the new document's splash; **`page.scope.revert()`** |
| `astro:page-load` | If not navigating, it is the first load (main.ts owns it). Otherwise: `lenis.resize()`, sync `lenis.scrollTo(scrollY, { immediate: true, force: true })`, `initPage()`, drain the wipe, start the page intro as the last cell drains, unlock scroll |

Release the click-blocking layer (`is-navigating`) as soon as the wipe has drained, not after the intro.

## Persist what should not restart

```astro
<div class="persist" transition:persist="header"><Header /></div>
<div class="persist" transition:persist="lines"><ConstructionLines /></div>
<div class="persist" transition:persist="wipe"><div class="wipe"><canvas data-wipe></canvas></div></div>
```
`.persist { display: contents }` so the wrapper does not affect layout. Things appended to `<html>` (a custom
scrollbar) also survive swaps. Persisted components must not re-run `initX` per page: wire them once in `main.ts`.

## The page Scope

```ts
export class Scope {
  readonly ctx = gsap.context(() => undefined);
  run(fn) { return this.ctx.add(fn) }          // GSAP records tweens/triggers made inside
  add(cleanup) {}                              // anything else
  listen(target, type, fn, opts) {}            // addEventListener + automatic removal
  onResize(fn, wait = 200) {}                  // debounced; ignores height-only changes on touch
  revert() { cleanups.reverse().forEach(c => c()); ctx.revert(); }
}
export function initPage(): Page {
  const scope = new Scope();
  initTilts(scope); initPress(scope); initScenes(scope); /* … */
  ScrollTrigger.refresh();
  return { scope };
}
```
Rules: every `init*` takes the scope; ScrollTriggers are created inside `scope.run`; observers, timers and
canvases register a cleanup; nothing page-specific is created at module load. Test: five round trips, then count
`ScrollTrigger.getAll().length` and listeners: they must not grow.

## Wipe (a page curtain made of cells)

Fixed canvas above everything. Leave: cells fill in a shuffled order a few ms apart (e.g. 6 ms, 0.4 s each,
`expoOut`); enter: they drain from the top so the new page appears from above. Grid size per breakpoint
(5x12 desktop, 4x12 tablet, 3x16 phone). Draw from one timeline `onUpdate`. Clear the canvas when idle.

## Intros per page type

`introFor(page)` returns the timeline for the page type (category intro, project intro, about…). Start it
`wipeOut.duration() - 0.4` s into the drain so the two overlap by one cell. A hero WebGPU/WebGL canvas is
created per page inside the scope; its texture decode runs beside the entrance, nothing waits on it.

## Back / forward and first load

- Back/forward restore scroll through the router; re-sync Lenis after the swap. Test them explicitly.
- Reload with the page scrolled halfway: all content above and in view must be visible (no hidden "waiting for
  trigger" states without a fallback).
- A page that is **not** built (unbuilt project links) lands on the 404 route, so every link resolves.
