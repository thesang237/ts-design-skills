'use client'

import type { ComponentProps } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCurtain } from './curtain'
import { getDirection } from '@/lib/direction'
import { entrance } from '@/lib/entrance'
import type { TransitionStyle, TransitionType } from '@/lib/transition-types'

function pickType(style: TransitionStyle, direction: 'forward' | 'back', reduceMotion: boolean): TransitionType {
  // Reduced motion: never the curtain, never sideways movement. A quiet fade only.
  if (reduceMotion) return 'fade'
  if (style === 'slide') return direction === 'forward' ? 'slide-forward' : 'slide-back'
  return style
}

/**
 * A normal <Link> (prefetching, modifier-key and middle-click behaviour all intact)
 * that chooses its transition at click time.
 *
 * Native styles: router.push with `transitionTypes` -> React <ViewTransition> picks the CSS.
 * Curtain: GSAP covers the page, and the native transition stays quiet.
 */
export function TransitionLink({ href, onNavigate, ...props }: ComponentProps<typeof Link>) {
  const router = useRouter()
  const pathname = usePathname()
  const curtain = useCurtain()

  return (
    <Link
      href={href}
      {...props}
      onNavigate={(event) => {
        onNavigate?.(event)
        const target = typeof href === 'string' ? href : (href.pathname ?? '')
        if (!target.startsWith('/') || target.split(/[?#]/)[0] === pathname) return // let Next handle it

        event.preventDefault()
        entrance.armed = false // first-load entrances are over; the transition owns this moment
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        const style = (document.documentElement.dataset.ptStyle as TransitionStyle | undefined) ?? 'fade'
        const type = pickType(style, getDirection(pathname, target), reduce)

        if (type === 'curtain') void curtain.run(() => router.push(target, { transitionTypes: [type] }))
        else router.push(target, { transitionTypes: [type] })
      }}
    />
  )
}
