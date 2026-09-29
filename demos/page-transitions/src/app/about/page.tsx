import type { Metadata } from 'next'
import { Reveal } from '@/components/reveal'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <div className="page prose">
      <Reveal as="h1" className="display">
        About
      </Reveal>
      {['A short paragraph of placeholder text about a fictional studio.', 'Move between Work, About and Journal to feel the slide direction: further along the nav slides one way, going back slides the other.', 'Try the browser back button as well. It gets a gentle fade because the browser does not tell us which direction it is going.'].map((text, i) => (
        <Reveal as="p" key={text} order={i + 1}>
          {text}
        </Reveal>
      ))}
    </div>
  )
}
