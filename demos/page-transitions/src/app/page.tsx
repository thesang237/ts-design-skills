import { ViewTransition } from 'react'
import { works } from '@/lib/works'
import { Reveal } from '@/components/reveal'
import { TransitionLink } from '@/components/transition-link'

export default function HomePage() {
  return (
    <div className="page">
      <Reveal as="h1" className="display">
        Selected work
      </Reveal>
      <Reveal as="p" order={1} className="lede">
        Twelve placeholder studies. Open one to see the shared-element morph, then use the browser back button.
      </Reveal>
      <Reveal order={2}>
        {/* data-critical: the loader waits for this image, and nothing else. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero" data-critical src="/hero.svg" alt="Abstract orange circle and dark square" width={1200} height={600} />
      </Reveal>
      <ul className="grid">
        {works.map((work, i) => (
          <li key={work.id}>
            <TransitionLink href={`/work/${work.id}`} className="card">
              {/* `share` swaps to "none" for the curtain, which runs its own choreography. */}
              <ViewTransition name={`work-${work.id}`} share={{ curtain: 'none', default: 'morph' }} default="none">
                <div className="swatch" style={{ ['--from' as string]: work.from, ['--to' as string]: work.to }} />
              </ViewTransition>
              <span className="card-title">{work.title}</span>
              <span className="card-meta">{work.year}</span>
              <span className="sr-only">{`, item ${i + 1} of ${works.length}`}</span>
            </TransitionLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
