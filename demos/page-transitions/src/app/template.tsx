import type { ReactNode } from 'react'
import { PageTransition } from '@/components/page-transition'

// A template re-renders on every navigation, so this is the one place that
// gives every page the same enter/exit behaviour.
export default function Template({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>
}
