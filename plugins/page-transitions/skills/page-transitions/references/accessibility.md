# Accessibility for loaders and transitions

## Reduced motion (design it, do not just switch it off)

"Reduce" means less movement, not none of anything. Keep short opacity changes; remove sliding,
scaling, curtains, parallax and shared-element flight.

| Piece | With `prefers-reduced-motion: reduce` |
| --- | --- |
| Native page transition | 100 ms fade out, 160 ms fade in, no translate |
| Shared-element morph | `animation-duration: 0.01ms` (snaps into place) |
| GSAP curtain | Not used. Link falls back to the fade type |
| Motion entrances | `useReducedMotion()` → show content immediately; or `<MotionConfig reducedMotion="user">` |
| Loader | Same readiness logic; exit is a 150 ms fade, no bar transition |
| Smooth-scroll libraries | Do not start them |

Read the preference again on each click (`matchMedia(...).matches`); people change it while the site is open.
Also provide it in CSS (`@media`) because the browser, not your JavaScript, plays the native transition.

## Keyboard and focus

- Links must navigate with Enter exactly like a click. `onNavigate` on `<Link>` handles both.
- **After a client-side navigation, move focus to the new page's `<h1>`** so keyboard and screen-reader users start at the top of the new content instead of being stranded on the link they pressed. Skip on first load. Use `preventScroll: true` so it never fights scroll restoration.

```tsx
'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function RouteFocus() {
  const pathname = usePathname()
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const target = document.querySelector<HTMLElement>('#main h1') ?? document.getElementById('main')
    if (!target) return
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true })
  }, [pathname])
  return null
}
```

```css
#main h1:focus, #main:focus { outline: none; } /* focus was moved by code, a ring here is noise */
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; } /* but everything else keeps a clear ring */
```

- **Skip link** as the first focusable element: `<a class="skip-link" href="#main">Skip to content</a>`, visible on focus, `main` has `id="main"`.
- Give every page a **unique `<h1>`** so the focus move is meaningful.
- Do not trap focus in the loader. While it shows, the page underneath is `visibility: hidden`, so it cannot be tabbed to.
- During a curtain the panel blocks pointer input; it must not trap keyboard focus or hide content from screen readers for longer than the transition (`aria-hidden` on the panel, removed with it).
- Tested in the demo: Enter on a nav link → focus on the new `<h1>` (Chromium, Firefox, WebKit); next Tab continues after the heading.

## Screen readers

- Next.js's App Router includes a built-in **route announcer** (`next-route-announcer`) that reads the new `document.title` after each navigation. **A unique `<title>` on every page is the whole job.** Do not add another `aria-live` region for route changes (double announcements).
- The loader is `role="status"` with visually hidden text "Loading". Announce it once. Do not announce progress percentages.
- Skeletons: `aria-hidden="true"` on the skeleton; mark the region `aria-busy="true"` while loading if useful.
- Decorative moving elements (curtain, morph placeholder): `aria-hidden="true"`.

## Scroll

- **Keep the window as the scroller.** Next restores scroll on Back/Forward for it (tested: 700 → 700 in all three engines). A custom scroll container (`overflow:auto` on a `<main>` with fixed height) must have its position saved and restored by hand, and smooth-scroll libraries need the same care.
- New pages start at the top. Next does this inside the commit, so the new snapshot is already at the top; do not scroll again after the transition.
- Hash links (`#section`): let the browser scroll; do not run a page transition for same-page anchors (skip when the pathname is unchanged).
- Smooth-scroll libraries (Lenis etc.): on route change reset with an immediate (non-animated) scroll; disable entirely for reduced motion.

## Zoom and small screens

- Transitions must not create horizontal scrolling (check `scrollWidth <= innerWidth` on a phone-sized viewport during and after).
- Touch targets stay reachable during a transition: keep `::view-transition { pointer-events: none }` so taps pass through.
