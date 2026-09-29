'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'

/** True once the first-load loader has left (or was never shown). */
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
 * Motion for in-page choreography: content rises in, staggered, once the page
 * (and the loader, if it showed) is out of the way. Transform + opacity only.
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
  return (
    <Tag
      className={className}
      data-reveal
      initial={reduce ? false : { opacity: 0, y: 18 }}
      animate={reduce || bootDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.7, delay: 0.12 + order * 0.07, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  )
}
