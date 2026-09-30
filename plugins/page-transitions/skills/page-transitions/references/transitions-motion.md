# Motion (first-load entrances, overlays, springs)

The package is now called **Motion** (`npm i motion`, import from `motion/react`). Old `framer-motion`
imports still exist but new code should use `motion`. Latest checked: 13.4. (13.0 removed the optional
`@emotion/is-prop-valid` dependency; pass `<MotionConfig isValidProp={...}>` only if you forward unusual props.)

**Use Motion when** you want springs or physical feel, motion that can be interrupted and reversed,
first-load entrances, or overlays, menus and dialogs that mount and unmount.
**Do not use it for** the route change itself in the App Router: the "AnimatePresence + frozen router" pattern
depends on Next.js internals and has broken across releases. Let native View Transitions (or the GSAP curtain)
swap the page and let Motion choreograph what is on it *on the first load*.

## First-load entrances (tested in the demo)

Content rises in, staggered, **only after the intro has completely left**. It does **not** run on
navigation: the page transition owns that moment, and next-page content must not start moving before
the transition ends. Transform and opacity only; respects reduced motion.

A tiny shared flag says whether entrances are still "armed". It is read on the first render on both server
and client (so hydration matches), and switched off by the first navigation (link click or Back/Forward).

```ts
// lib/entrance.ts
export const entrance = { armed: true }
```

```tsx
// components/reveal.tsx
'use client'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { entrance } from '@/lib/entrance'

/** True once the first-load intro has completely finished (or was never shown). */
function useBootDone() {
  const [done, setDone] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    const check = () => { if (!root.dataset.boot) setDone(true) }
    check()
    const observer = new MutationObserver(check)
    observer.observe(root, { attributes: true, attributeFilter: ['data-boot'] })
    return () => observer.disconnect()
  }, [])
  return done
}

export function Reveal({ children, order = 0, as = 'div', className }: {
  children: ReactNode; order?: number; as?: 'div' | 'p' | 'h1' | 'section'; className?: string
}) {
  const reduce = useReducedMotion()
  const bootDone = useBootDone()
  const Tag = motion[as]
  const skip = reduce || !entrance.armed
  return (
    <Tag
      className={className}
      data-reveal
      initial={skip ? false : { opacity: 0, y: 18 }}
      animate={skip || bootDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.7, delay: 0.05 + order * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Tag>
  )
}
```

Things that make this safe:
- On navigation `entrance.armed` is false, so content mounts fully visible and the transition alone decides what is seen. Tested: Reveal items never dip below full opacity after a navigation starts.
- Content is hidden in the server HTML (`initial`) only on the first load. Add a `<noscript>` rule (`[data-reveal]{opacity:1!important;transform:none!important}`) so it is visible without JavaScript.
- With reduced motion the content is simply shown.
- Keep entrances short: 4 to 8 elements, stagger under ~80ms each.

## Overlays that mount and unmount (menu, dialog, toast)

```tsx
'use client'
import { AnimatePresence, motion } from 'motion/react'

export function Overlay({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

Wrap the app once in `<MotionConfig reducedMotion="user">` so every Motion animation drops transforms when
the visitor asks for reduced motion (opacity still animates). *Not run in the demo; standard usage.*

## Spring-shaped page morphs: `AnimateView` (not run in the demo, test before shipping)

Motion 12.41+ ships `animateView` (plain JS) and, with **React 19.3+**, an `AnimateView` component. It is
the native View Transitions machinery with Motion's spring timing and interruption handling (a new
transition queues instead of snapping the old one to its end).

```tsx
import { AnimateView } from 'motion/react-animate-view'   // separate entry point
import { spring } from 'motion'

<AnimateView name={`work-${id}`} transition={{ type: spring, bounce: 0.2 }}>
  <div className="swatch" />
</AnimateView>
```

Same rules as native: one `name` per element, both ends present in the same commit, no support means an
instant swap. Check the designer's "no bouncy springs" answer before using it, and compare against the CSS
`morph` in `view-transitions.md`; choose it only if the spring feel is clearly better.

## Motion + native together

- Native owns the route swap; Motion owns first-load entrances and overlays.
- If a Motion animation must wait for a transition: `await document.activeViewTransition?.finished` (Chrome 142+, Firefox 147+, Safari 26.2+; `undefined` elsewhere, so use optional chaining and carry on).
- Use `m` + `LazyMotion` (or `motion/mini`) if bundle size matters; the full `motion` component is the largest option.
