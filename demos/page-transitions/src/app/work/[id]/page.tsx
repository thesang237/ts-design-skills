import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ViewTransition } from 'react'
import { getWork, works } from '@/lib/works'
import { Reveal } from '@/components/reveal'
import { TransitionLink } from '@/components/transition-link'

export function generateStaticParams() {
  return works.map((w) => ({ id: w.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return { title: getWork(id)?.title ?? 'Not found' }
}

export default async function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const work = getWork(id)
  if (!work) notFound()
  const index = works.indexOf(work)
  const next = works[(index + 1) % works.length]
  const prev = works[(index - 1 + works.length) % works.length]

  return (
    <div className="page">
      <TransitionLink href="/" className="back">
        ← All work
      </TransitionLink>
      <ViewTransition name={`work-${work.id}`} share={{ curtain: 'none', default: 'morph' }} default="none">
        <div className="swatch swatch-hero" style={{ ['--from' as string]: work.from, ['--to' as string]: work.to }} />
      </ViewTransition>
      <Reveal as="h1" className="display">
        {work.title}
      </Reveal>
      <Reveal as="p" order={1} className="lede">
        {work.year}. Placeholder description. The block above is the same element as the card you clicked, so the
        browser moves it instead of cutting between two pages.
      </Reveal>
      <Reveal order={2} className="pager">
        <TransitionLink href={`/work/${prev.id}`}>← {prev.title}</TransitionLink>
        <TransitionLink href={`/work/${next.id}`}>{next.title} →</TransitionLink>
      </Reveal>
    </div>
  )
}
