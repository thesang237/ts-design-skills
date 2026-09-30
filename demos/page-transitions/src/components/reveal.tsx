'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { entrance } from '@/lib/entrance'

/** True once the first-load intro has completely finished (or was never shown). */
function useBootDone() {
  const [done, setDone] = useState(false)
  useEffect(() => {
    const root = document.documentElement
    const check = () => {
      if (!root.dataset.boot) setDone(true)
    }
    check()
    const observer = new MutationObserver(check)
    observer.observe(root, { attributes: true, attributeFilter: ['data-boot'] })
    return () => observer.disconnect()
  }, [])
  return done
}

/**
 * Motion for in-page choreography on the FIRST load: content rises in, staggered, only after
 * the intro (if any) has completely left. It never runs during page navigation: the page
 * transition owns that moment, and next-page content must not start early.
 * Transform + opacity only.
 */
export function Reveal({
  children,
  order = 0,
  as = 'div',
  className,
}: {
  children: ReactNode
  order?: number
  as?: 'div' | 'p' | 'h1' | 'section'
  className?: string
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
