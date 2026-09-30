# Native view transitions (the default choice)

**In plain words:** the browser takes a picture of the old page, swaps in the new page, takes a
picture of that, and animates between the two pictures. React's `<ViewTransition>` component
decides *what* is animated; CSS decides *how*. It runs on the graphics chip, so it stays smooth
even when JavaScript is busy.

All code below was run and checked in the demo (`demos/page-transitions`) on Next 16.3.7 / React 19.3.

## Support and setup

- Same-document view transitions are Baseline (Chrome/Edge 111+, Safari 18+, Firefox 144+). Older browsers get an instant swap. That is fine and needs no code.
- **Next.js 16.3+: nothing to enable.** No `experimental.viewTransition` flag, no `react@canary`. `import { ViewTransition } from 'react'` works in the App Router, and `<Link transitionTypes>` / `router.push(href, { transitionTypes })` exist. Types come with `@types/react` 19.3.
- Only *Transitions* animate. Next's navigations already are Transitions; a plain `setState` is not.
- Pages Router or non-React: see "Without React" at the end.

## 1. Every page enters and leaves the same way: one file

Put the wrapper in `app/template.tsx` (it re-renders on every navigation), and key it on the
pathname so `/work/a` → `/work/b` also counts as leaving one page and entering another.

```tsx
// components/page-transition.tsx
'use client'
import { ViewTransition, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { viewTransitionProps } from '@/lib/transition-types'

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <ViewTransition key={pathname} {...viewTransitionProps}>
      {children}
    </ViewTransition>
  )
}
```

```tsx
// app/template.tsx
import type { ReactNode } from 'react'
import { PageTransition } from '@/components/page-transition'
export default function Template({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
```

Next's own guide puts the wrapper in each `page.tsx` instead. Both work; the template version is
one file instead of one per page and also covers `loading.tsx`.

## 2. One map from "type of navigation" to "which CSS class"

```ts
// lib/transition-types.ts
export type TransitionStyle = 'fade' | 'slide' | 'curtain'
export type TransitionType = 'fade' | 'slide-forward' | 'slide-back' | 'curtain'

const toClass = {
  fade: 'pt-fade',
  'slide-forward': 'pt-slide-forward',
  'slide-back': 'pt-slide-back',
  curtain: 'none', // the curtain animates its own overlay; the native transition stays quiet
} as const

export const viewTransitionProps = {
  enter: { ...toClass, default: 'pt-fade' },
  exit: { ...toClass, default: 'pt-fade' },
  default: 'none', // elements only animate when a rule above says so
} as const
```

Pass **one** type per navigation. Two types at once make it unclear which rule wins.

## 3. A link that chooses its transition when clicked

`onNavigate` fires only for real in-app navigations (not Cmd/Ctrl-click, not new tabs, not
downloads), so prefetching and browser behaviour stay intact.

```tsx
// components/transition-link.tsx
'use client'
import type { ComponentProps } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getDirection } from '@/lib/direction'
import { entrance } from '@/lib/entrance'
import type { TransitionStyle, TransitionType } from '@/lib/transition-types'

function pickType(style: TransitionStyle, dir: 'forward' | 'back', reduce: boolean): TransitionType {
  if (reduce) return 'fade' // reduced motion: quiet fade only
  if (style === 'slide') return dir === 'forward' ? 'slide-forward' : 'slide-back'
  return style
}

export function TransitionLink({ href, onNavigate, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter()
  const pathname = usePathname()
  return (
    <Link
      href={href}
      {...props}
      onNavigate={(event) => {
        onNavigate?.(event)
        const target = typeof href === 'string' ? href : (href.pathname ?? '')
        if (!target.startsWith('/') || target.split(/[?#]/)[0] === pathname) return
        event.preventDefault()
        entrance.armed = false // first-load entrances are over; the transition owns this moment
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const style = (document.documentElement.dataset.ptStyle as TransitionStyle | undefined) ?? 'fade'
        router.push(target, { transitionTypes: [pickType(style, getDirection(pathname, target), reduce)] })
      }}
    />
  )
}
```

With the curtain style the link calls `curtain.run(() => router.push(...))` instead (see `transitions-gsap.md`).

`getDirection(from, to)` is *your* site map: deeper or further along the nav = `forward`, otherwise
`back`. Keep it in one small file.

## 4. The CSS (fade + rise, slide, morph, reveal, reduced motion)

**`--pt-dur` is the total time of one page change** (the designer chose 800ms). It is split so the old
page has completely gone before the new page starts to appear: **no overlap, ever**.

```
old page leaves : 0.00 to 0.35 x dur
new page arrives: 0.35 to 1.00 x dur   (starts exactly when the old one ends)
```

Only `opacity` and `translate` move. Timing comes from variables; the numbers come from web-motion.

```css
:root {
  --pt-dur: 800ms;
  --pt-ease: cubic-bezier(0.22, 1, 0.36, 1);
  --pt-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --pt-ease-inout: cubic-bezier(0.65, 0, 0.35, 1);
  --pt-distance: 56px;
  --pt-rise: 16px;
}

/* Let clicks reach the live page while a transition plays. */
::view-transition { pointer-events: none; }

/* Header: give it view-transition-name: site-header in its own CSS, then keep it still. */
::view-transition-group(site-header) { animation: none; z-index: 10; }
::view-transition-old(site-header) { display: none; }
::view-transition-new(site-header) { animation: none; }

/* Fade + rise: the old page fades out, THEN the new page fades in and rises a little. */
::view-transition-old(.pt-fade) { animation: pt-out calc(var(--pt-dur) * 0.35) var(--pt-ease-in) both; }
::view-transition-new(.pt-fade) {
  animation:
    pt-in calc(var(--pt-dur) * 0.65) var(--pt-ease) calc(var(--pt-dur) * 0.35) both,
    pt-rise calc(var(--pt-dur) * 0.65) var(--pt-ease) calc(var(--pt-dur) * 0.35) both;
}

/* Directional slide: forward moves left, back moves right. Same sequence as the fade. */
::view-transition-old(.pt-slide-forward) { --offset: calc(var(--pt-distance) * -1); animation: pt-out calc(var(--pt-dur) * 0.35) var(--pt-ease-in) both, pt-slide calc(var(--pt-dur) * 0.35) var(--pt-ease-in) both reverse; }
::view-transition-new(.pt-slide-forward) { --offset: var(--pt-distance); animation: pt-in calc(var(--pt-dur) * 0.65) var(--pt-ease) calc(var(--pt-dur) * 0.35) both, pt-slide calc(var(--pt-dur) * 0.65) var(--pt-ease) calc(var(--pt-dur) * 0.35) both; }
::view-transition-old(.pt-slide-back) { --offset: var(--pt-distance); animation: pt-out calc(var(--pt-dur) * 0.35) var(--pt-ease-in) both, pt-slide calc(var(--pt-dur) * 0.35) var(--pt-ease-in) both reverse; }
::view-transition-new(.pt-slide-back) { --offset: calc(var(--pt-distance) * -1); animation: pt-in calc(var(--pt-dur) * 0.65) var(--pt-ease) calc(var(--pt-dur) * 0.35) both, pt-slide calc(var(--pt-dur) * 0.65) var(--pt-ease) calc(var(--pt-dur) * 0.35) both; }

/* Shared element: the browser moves it between positions over the whole duration.
   It is pulled out of both page snapshots, so it is not "page content overlapping". */
::view-transition-group(.morph) { animation-duration: var(--pt-dur); animation-timing-function: var(--pt-ease-inout); z-index: 5; }
::view-transition-old(.morph), ::view-transition-new(.morph) { height: 100%; object-fit: cover; }

/* Suspense reveal: the skeleton leaves first, THEN the real content arrives. */
::view-transition-old(.pt-reveal-out) { animation: pt-out 150ms var(--pt-ease-in) both; }
::view-transition-new(.pt-reveal-in) { animation: pt-in calc(var(--pt-dur) * 0.5) var(--pt-ease) 150ms both, pt-rise calc(var(--pt-dur) * 0.5) var(--pt-ease) 150ms both; }

@keyframes pt-out { to { opacity: 0; } }
@keyframes pt-in { from { opacity: 0; } }
@keyframes pt-rise { from { translate: 0 var(--pt-rise); } }
@keyframes pt-slide { from { translate: var(--offset) 0; } }

/* Reduced motion: still sequential, short, opacity only, and shared elements snap. */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(.pt-fade), ::view-transition-old(.pt-slide-forward), ::view-transition-old(.pt-slide-back), ::view-transition-old(.pt-reveal-out) { animation: pt-out 100ms linear both; }
  ::view-transition-new(.pt-fade), ::view-transition-new(.pt-slide-forward), ::view-transition-new(.pt-slide-back), ::view-transition-new(.pt-reveal-in) { animation: pt-in 160ms linear 100ms both; }
  ::view-transition-group(.morph) { animation-duration: 0.01ms; }
}
```

Check it: in the browser, `document.getAnimations()` during a transition lists the pseudo-element
animations. The old page's opacity animation must end at or before the new page's animation delay
(demo: old ends at 280ms, new starts at 280ms and ends at 800ms).

Header anchoring: `header { view-transition-name: site-header; }`. Without it the header fades
and slides with the page, which loses the fixed reference point.

## 5. Shared element (a card that becomes the hero)

Give the same `name` to both ends. Use `share="morph"` to get the `.morph` class, and
`default="none"` so it does not also fade on unrelated navigations. If you add `default="none"`
you must keep an explicit `share`, otherwise the pair silently stops morphing.

```tsx
// on the list page
<ViewTransition name={`work-${id}`} share={{ curtain: 'none', default: 'morph' }} default="none">
  <div className="swatch" />
</ViewTransition>
// on the detail page: same name, same props
```

`share={{ curtain: 'none', default: 'morph' }}` switches the morph off when the GSAP curtain is the
chosen style. Every name must be unique on the page at any moment. The morph plays when the
destination renders in the same commit as the navigation (static or prefetched pages). If the
destination has to wait for data, it enters with the normal page animation instead of morphing.

## 6. Slow routes: reveal, do not freeze

Show the page shell at once with a skeleton, then reveal the data. Fallbacks appear without
animation; the real content animates in.

```tsx
import { Suspense, ViewTransition } from 'react'

<Suspense fallback={<ViewTransition exit="pt-reveal-out" default="none"><Skeleton /></ViewTransition>}>
  <ViewTransition enter="pt-reveal-in" default="none">
    <Entries /> {/* async server component */}
  </ViewTransition>
</Suspense>
```

Measured in the demo with a 1.4s server delay: URL changes at ~135ms, skeleton visible at ~140ms,
content at ~1.9s, no frame gap over 100ms.

Do not add a route `loading.tsx` that repeats the page heading. When the loading page swaps for the
real page the heading remounts and its entrance replays. Put the Suspense boundary inside the page instead.

## 7. Known limit: browser Back / Forward

In Next 16.3 (Chromium, Firefox, WebKit engines) pressing the browser's Back or Forward button runs
**no** view transition at all: the page cuts. Scroll position is restored correctly. Next's guide
says the morph still applies on Back; in testing it did not. In-app "Back" links (a normal push)
do animate. If Back animation matters, see the upgrade notes in `pitfalls.md`.

## Without React (plain JS, Pages Router, other frameworks)

```js
function navigateWithTransition(update) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  if (!document.startViewTransition || reduce) return update()
  // Do the smallest possible work in the callback; the page is frozen until it resolves.
  document.startViewTransition(update)
}
```

The callback must resolve quickly. Never `await fetch()` inside it: the whole screen freezes for as
long as it takes. Fetch first, then call the update. (Project audited for this skill did exactly
that and froze for 3 seconds on a slow route.)
