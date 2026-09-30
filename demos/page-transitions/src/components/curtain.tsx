'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'

type CurtainApi = {
  /**
   * 1. A box slides up and covers the current page.
   * 2. While covered, the route changes and the new content is held hidden.
   * 3. The same-colour box slides away, revealing the new page WITHOUT its content.
   * 4. Only then does the content come in.
   */
  run: (navigate: () => void) => Promise<void>
}

const CurtainContext = createContext<CurtainApi | null>(null)

export function useCurtain() {
  const api = useContext(CurtainContext)
  if (!api) throw new Error('useCurtain must be used inside <CurtainProvider>')
  return api
}

/** Longest we keep the curtain closed waiting for a route. After that, reveal whatever is there. */
const MAX_COVER_MS = 8000

// Shares of the total duration (--pt-dur). They add up to 1, so the whole thing takes --pt-dur.
const COVER = 0.3
const UNCOVER = 0.35
const CONTENT = 0.35

/**
 * Read --pt-dur in seconds. CSS minifiers rewrite `800ms` as `.8s`, so the unit must be read:
 * assuming "milliseconds" here made the curtain run ~1000x too fast in a production build.
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

  // The route has changed: release whoever is waiting for it.
  useEffect(() => {
    onCommit.current?.()
    onCommit.current = null
  }, [pathname])

  useEffect(() => {
    const el = panel.current
    return () => {
      if (el) gsap.killTweensOf(el)
    }
  }, [])

  const run = useCallback(async (navigate: () => void) => {
    const el = panel.current
    if (!el || busy.current) return
    busy.current = true
    const root = document.documentElement
    const total = durationSeconds()
    // Demo setting: does the box leave upward (continues the motion) or back down (like a shutter)?
    let exitDown = false
    try {
      exitDown = localStorage.getItem('pt:curtain-exit') === 'down'
    } catch {}

    el.dataset.active = 'true' // blocks clicks while the page is covered
    root.dataset.ptCurtain = 'on' // keeps the header out of the native snapshot (see transitions.css)

    try {
      // transform only: the box is composited on the GPU, no layout or paint per frame
      await gsap.fromTo(el, { yPercent: 100 }, { yPercent: 0, duration: total * COVER, ease: 'power3.inOut' })

      root.dataset.ptHold = 'true' // new content stays invisible from here until the box has left
      const arrived = new Promise<void>((resolve) => {
        onCommit.current = resolve
      })
      navigate()
      await Promise.race([arrived, sleep(MAX_COVER_MS)])
      onCommit.current = null

      await gsap.to(el, {
        yPercent: exitDown ? 100 : -100,
        duration: total * UNCOVER,
        ease: 'power3.inOut',
        delay: 0.05,
      })

      // The box is gone and the page is empty. Now the content arrives (CSS, see transitions.css).
      root.dataset.ptContent = 'in'
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
