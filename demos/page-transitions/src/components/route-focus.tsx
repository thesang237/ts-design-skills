'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * After a client-side navigation, move keyboard focus to the new page's heading so
 * keyboard and screen-reader users start at the top of the new content instead of
 * being left on the link they pressed. Skipped on first load.
 *
 * Screen readers are told about the new page by Next.js's built-in route announcer
 * (it reads document.title), so this does NOT add another live region.
 */
export function RouteFocus() {
  const pathname = usePathname()
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    const target = document.querySelector<HTMLElement>('#main h1') ?? document.getElementById('main')
    if (!target) return
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
    target.focus({ preventScroll: true }) // never fight scroll restoration
  }, [pathname])

  return null
}
