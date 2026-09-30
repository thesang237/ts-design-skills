import { type CSSProperties, useEffect, useRef } from 'react';

/** Link whose letters roll up to a copy of themselves. Pure CSS transitions, so a quick
 *  in-and-out retargets smoothly instead of snapping. */
function RollLink({ text, href }: { text: string; href: string }) {
    return (
        <a className="roll" href={href}>
            <span className="sr-only">{text}</span>
            <span className="roll-visual" aria-hidden="true">
                {[...text].map((c, i) => (
                    <span key={i} className="roll-char" data-c={c === ' ' ? ' ' : c} style={{ '--i': i } as CSSProperties}>
                        {c === ' ' ? ' ' : c}
                    </span>
                ))}
            </span>
        </a>
    );
}

/** Three dots. Infinite loops pause when off screen so they cost nothing while you scroll. */
function TypingIndicator() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current!;
        const io = new IntersectionObserver(([e]) => el.toggleAttribute('data-paused', !e.isIntersecting));
        io.observe(el);
        return () => io.disconnect();
    }, []);
    return (
        <div ref={ref} className="typing">
            <span className="sr-only">Someone is typing</span>
            <span className="typing-dot" aria-hidden="true" />
            <span className="typing-dot" aria-hidden="true" />
            <span className="typing-dot" aria-hidden="true" />
        </div>
    );
}

const SHOWCASE = [
    { title: 'Project one', year: '2026', tone: 'a' },
    { title: 'Project two', year: '2025', tone: 'b' },
    { title: 'Project three', year: '2024', tone: 'c' },
];

function ShowcaseCard({ title, year, tone }: { title: string; year: string; tone: string }) {
    return (
        <a className="show-card" href="#hover">
            <div className="show-media">
                <div className={`show-img tone-${tone}`} />
            </div>
            <div className="show-meta">
                <span className="show-title">{title}</span>
                <span className="show-year">{year}</span>
            </div>
            <span className="show-more">
                View case study{' '}
                <span className="show-arrow" aria-hidden="true">
                    →
                </span>
            </span>
        </a>
    );
}

export function HoverPress() {
    return (
        <div className="stack">
            <div className="grid-3">
                <article className="card">
                    <header className="card-head">
                        <h3 className="card-title">Buttons</h3>
                        <span className="chip">CSS</span>
                    </header>
                    <div className="demo-row">
                        <button type="button" className="btn">
                            Primary action
                        </button>
                        <button type="button" className="btn btn-ghost">
                            Secondary
                        </button>
                    </div>
                    <p className="card-note">Colour shifts on hover (fast, 160ms). Pressing scales to 0.97 and answers at once, on touch screens too.</p>
                </article>

                <article className="card">
                    <header className="card-head">
                        <h3 className="card-title">Links</h3>
                        <span className="chip">CSS</span>
                    </header>
                    <div className="demo-col">
                        <a className="underline" href="#hover">
                            Underline draws in, leaves forward
                        </a>
                        <RollLink text="Letters roll on hover" href="#hover" />
                    </div>
                    <p className="card-note">Same effect on keyboard focus. On touch screens there is no hover, so nothing is hidden behind it.</p>
                </article>

                <article className="card">
                    <header className="card-head">
                        <h3 className="card-title">Status</h3>
                        <span className="chip">CSS</span>
                    </header>
                    <div className="demo-row">
                        <div className="bubble">
                            <TypingIndicator />
                        </div>
                    </div>
                    <p className="card-note">Dots lift in turn on a gentle in-out curve. With reduced motion they only pulse softly.</p>
                </article>
            </div>
            <div className="grid-3">
                {SHOWCASE.map((c) => (
                    <ShowcaseCard key={c.title} {...c} />
                ))}
            </div>
            <p className="card-note caption">
                Showcase cards only: the image eases in slightly (1.04, slow 400ms) inside a fixed frame, so the layout never moves. Details slide in and the arrow nudges forward.
                On touch screens the details are simply always visible.
            </p>
        </div>
    );
}
