'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import gsap from 'gsap'

type CurtainApi = {
  /** Cover the page, run `navigate`, wait for the new route to commit, then uncover. */
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

function durationSeconds() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--pt-dur')
  const ms = Number.parseFloat(raw)
  return (Number.isFinite(ms) ? ms : 500) / 1000
}

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
    const total = durationSeconds()
    el.dataset.active = 'true' // blocks clicks while the page is covered

    try {
      // transform only: the panel is composited on the GPU, no layout or paint per frame
      await gsap.fromTo(el, { yPercent: 100 }, { yPercent: 0, duration: total * 0.5, ease: 'power3.inOut' })

      const arrived = new Promise<void>((resolve) => {
        onCommit.current = resolve
      })
      navigate()
      await Promise.race([arrived, new Promise((r) => setTimeout(r, MAX_COVER_MS))])
      onCommit.current = null

      await gsap.to(el, { yPercent: -100, duration: total * 0.6, ease: 'power3.inOut', delay: 0.05 })
    } finally {
      gsap.set(el, { yPercent: 100 })
      el.dataset.active = 'false'
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
