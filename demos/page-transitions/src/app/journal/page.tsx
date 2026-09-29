import type { Metadata } from 'next'
import { Suspense, ViewTransition } from 'react'
import { connection } from 'next/server'
import { Reveal } from '@/components/reveal'
import { JournalSkeleton } from './skeleton'

export const metadata: Metadata = { title: 'Journal' }

async function Entries() {
  await connection() // opt in to request-time rendering
  await new Promise((r) => setTimeout(r, 1400)) // stands in for a slow database or CMS
  return (
    <ul className="entries">
      {['Notes on a new series', 'Behind the scenes', 'Materials I keep coming back to', 'A year in review'].map((t, i) => (
        <li key={t}>
          <span className="entry-date">{`0${i + 1} / 2026`}</span>
          <span className="entry-title">{t}</span>
        </li>
      ))}
    </ul>
  )
}

export default function JournalPage() {
  return (
    <div className="page">
      <Reveal as="h1" className="display">
        Journal
      </Reveal>
      <Reveal as="p" order={1} className="lede">
        This page waits 1.4 seconds for its data. The page opens at once with a skeleton, so the screen never
        freezes, and the entries fade in when they arrive.
      </Reveal>
      <Suspense
        fallback={
          <ViewTransition exit="pt-reveal-out" default="none">
            <JournalSkeleton />
          </ViewTransition>
        }
      >
        <ViewTransition enter="pt-reveal-in" default="none">
          <Entries />
        </ViewTransition>
      </Suspense>
    </div>
  )
}
