'use client'

import { ViewTransition, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { viewTransitionProps } from '@/lib/transition-types'

/**
 * Used once, from app/template.tsx. `key={pathname}` makes every URL change an
 * exit + enter pair, including /work/a -> /work/b where the segment name is the same.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  return (
    <ViewTransition key={pathname} {...viewTransitionProps}>
      {children}
    </ViewTransition>
  )
}
