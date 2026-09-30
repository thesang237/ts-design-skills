import { HoverPress } from './components/HoverPress';
import { Presets } from './components/Presets';
import { CssScene, ScrollScenes } from './components/ScrollScenes';
import { SpringDemo } from './components/SpringDemo';
import { StaggerGrid } from './components/StaggerGrid';
import { TextGallery } from './components/TextGallery';
import { Tuner } from './components/Tuner';
import { useMotionTokens } from './motion/MotionProvider';
import { TextEffect } from './text/TextEffect';

const SECTIONS = [
    { id: 'presets', label: 'Presets' },
    { id: 'text', label: 'Text' },
    { id: 'hover', label: 'Hover & press' },
    { id: 'groups', label: 'Groups' },
    { id: 'spring', label: 'Spring' },
    { id: 'scroll', label: 'Scroll scenes' },
];

function Section({ id, eyebrow, title, intro, children }: { id: string; eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
    return (
        <section id={id} className="section" aria-labelledby={`${id}-title`}>
            <div className="section-head">
                <p className="eyebrow">{eyebrow}</p>
                <TextEffect as="h2" text={title} effect="mask-up" split="lines" className="section-title" />
                <p className="section-intro">{intro}</p>
            </div>
            {children}
        </section>
    );
}

export default function App() {
    const { reduced } = useMotionTokens();
    return (
        <>
            <a className="skip-link" href="#main">
                Skip to content
            </a>
            <header className="topbar">
                <span className="wordmark">web-motion</span>
                <nav aria-label="Sections">
                    {SECTIONS.map((s) => (
                        <a key={s.id} className="underline" href={`#${s.id}`}>
                            {s.label}
                        </a>
                    ))}
                </nav>
            </header>

            <main id="main">
                <section className="hero">
                    <p className="eyebrow">Skill demo · placeholder content</p>
                    <TextEffect as="h1" className="hero-title" text="Motion that feels considered, never decorated." effect="mask-up" split="lines" trigger="load" hover />
                    <TextEffect
                        className="hero-sub"
                        text="One set of presets drives CSS, GSAP and Motion. Open “Tune motion” to change them and watch the whole page follow."
                        effect="fade-up"
                        split="words"
                        trigger="load"
                        delay={250}
                    />
                    <p className="hero-status" role="note">
                        Reduced motion is <strong>{reduced ? 'on' : 'off'}</strong>
                        {reduced ? ': movement is replaced by short fades.' : '. Switch it on in the tuner or in your system settings.'}
                    </p>
                </section>

                <Section
                    id="presets"
                    eyebrow="01 · Presets"
                    title="Named presets, not magic numbers"
                    intro="Every animation on this page reads these values. Change them in the tuner."
                >
                    <Presets />
                </Section>

                <Section
                    id="text"
                    eyebrow="02 · Text"
                    title="Text reveals with enter, exit and hover"
                    intro="Each card can play once on scroll, every time it scrolls into view, or only from its buttons. Hover works with a mouse or trackpad."
                >
                    <TextGallery />
                </Section>

                <Section
                    id="hover"
                    eyebrow="03 · Hover & press"
                    title="Subtle by default, expressive where it earns it"
                    intro="Hover effects only run on devices that can hover. Pressing always answers straight away."
                >
                    <HoverPress />
                </Section>

                <Section
                    id="groups"
                    eyebrow="04 · Groups"
                    title="A sequence, never a wait"
                    intro="Items in a group start 70ms apart, and the whole group is capped so it never drags."
                >
                    <StaggerGrid />
                </Section>

                <Section
                    id="spring"
                    eyebrow="05 · Spring"
                    title="One spring for things you touch"
                    intro="Springs are only for drag and gestures. The same spring is used by CSS and by Motion."
                >
                    <SpringDemo />
                </Section>

                <Section
                    id="scroll"
                    eyebrow="06 · Scroll scenes"
                    title="Enter, hold, exit: mapped to the scroll"
                    intro="Each scene's heading, text and controls enter as you scroll, hold still while you read, then leave. Use the bar at the bottom to compare layouts and what happens when you scroll back up."
                >
                    <ScrollScenes />
                    <CssScene />
                </Section>

                <footer className="footer">
                    <p>Built for the web-motion skill. Rules and code in plugins/web-motion/skills/web-motion.</p>
                </footer>
            </main>
            <Tuner />
        </>
    );
}
