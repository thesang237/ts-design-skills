'use client'

import type { ComponentProps } from 'react'
import { usePathname } from 'next/navigation'
import { TransitionLink } from './transition-link'

export function NavLink({ href, ...props }: ComponentProps<typeof TransitionLink>) {
  const pathname = usePathname()
  const current = typeof href === 'string' && (href === '/' ? pathname === '/' : pathname.startsWith(href))
  return <TransitionLink href={href} aria-current={current ? 'page' : undefined} {...props} />
}
