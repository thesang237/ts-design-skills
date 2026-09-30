import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

import { GSAP_EASE, useMotionTokens } from '../motion/MotionProvider';
import { REDUCED, staggerStep } from '../motion/tokens';
import { Segmented, Toggle } from './Controls';

type Layout = 'pinned' | 'flow';
type UpEnter = 'rewind' | 'play' | 'stay';
type UpExit = 'rewind' | 'play';
type Hold = 'short' | 'medium' | 'long';
type Opts = { layout: Layout; upEnter: UpEnter; upExit: UpExit; hold: number; smooth: boolean };

/** Share of the scroll range where the content holds still. Enter and exit split the rest. */
const HOLD: Record<Hold, number> = { short: 0.2, medium: 0.4, long: 0.55 };

const SCENES = [
    { eyebrow: 'Scene 01', title: 'Arrive with the scroll', desc: 'The heading rises line by line as you scroll. Its progress is your scroll position, not a timer.' },
    { eyebrow: 'Scene 02', title: 'Hold still while people read', desc: 'Once everything is in place, nothing moves. Then the whole group leaves, a little faster than it came.' },
    { eyebrow: 'Scene 03', title: 'Leave the way you came', desc: 'Scroll back up to compare: rewind with the scroll, play back on its own, or stay once shown.' },
];

function Scene({ index, eyebrow, title, desc, opts }: (typeof SCENES)[number] & { index: number; opts: Opts }) {
    const root = useRef<HTMLElement>(null);
    const { tokens: t, reduced } = useMotionTokens();
    const enterPct = Math.round(((1 - opts.hold) / 2) * 100);

    useGSAP(
        () => {
            const el = root.current!;
            const q = gsap.utils.selector(el);
            const content = q('.scene-content')[0] as HTMLElement;
            const titleEl = q('.scene-title .tx-visual')[0] as HTMLElement;
            const descEl = q('.scene-desc .tx-visual')[0] as HTMLElement;
            const eyebrowEl = q('.scene-eyebrow')[0] as HTMLElement;
            const ui = q('.scene-ui > *') as HTMLElement[];
            const fill = q('.scene-meter-fill')[0] as HTMLElement;
            const phaseEl = q('.scene-phase')[0] as HTMLElement;
            // React renders these empty; we own their contents (see text-reveals.md).
            titleEl.textContent = title;
            descEl.textContent = desc;
            el.setAttribute('data-ready', '');

            if (reduced) {
                // No scrubbing, no pinning: content is simply there, with one short fade.
                gsap.from(content, { opacity: 0, duration: REDUCED.fadeIn / 1000, ease: 'none', scrollTrigger: { trigger: content, start: 'top 90%', once: true } });
                return;
            }

            const enterEnd = (1 - opts.hold) / 2; // e.g. 0.3
            const exitStart = enterEnd + opts.hold; // e.g. 0.7
            const words = SplitText.create(descEl, { type: 'words', wordsClass: 'tx-word', aria: 'none' }).words as HTMLElement[];
            let master = gsap.timeline({ paused: true });

            // One timeline, total length 1: enter, an empty hold, exit. Scroll progress maps onto it.
            // Enter animates the pieces; exit animates their containers, so no property is fought over.
            // The scroll is the pacing, so pieces use the gentle in-out curve (a strong ease-out would
            // finish each piece in the first half of its scroll range).
            const build = (lines: HTMLElement[]) => {
                const enter = gsap
                    .timeline({ defaults: { ease: GSAP_EASE.inOut } })
                    .fromTo(eyebrowEl, { opacity: 0, y: t.rise }, { opacity: 1, y: 0, duration: 0.5 }, 0)
                    .fromTo(lines, { yPercent: 120 }, { yPercent: 0, duration: 0.7, stagger: staggerStep(t, lines.length, 'lines') }, 0.05)
                    .fromTo(words, { opacity: 0, y: t.rise }, { opacity: 1, y: 0, duration: 0.6, stagger: staggerStep(t, words.length, 'words') }, 0.2)
                    .fromTo(ui, { opacity: 0, y: t.rise }, { opacity: 1, y: 0, duration: 0.6, stagger: staggerStep(t, ui.length) }, 0.35);
                const exit = gsap
                    .timeline({ defaults: { ease: GSAP_EASE.inOut } })
                    .fromTo(lines, { yPercent: 0 }, { yPercent: -120, duration: 0.5, stagger: staggerStep(t, lines.length, 'lines') * 0.6, immediateRender: false }, 0)
                    .fromTo([eyebrowEl, descEl, ...ui], { opacity: 1, y: 0 }, { opacity: 0, y: -t.rise, duration: 0.45, stagger: 0.03, immediateRender: false }, 0.05);
                enter.duration(enterEnd);
                exit.duration(1 - exitStart);
                return gsap.timeline({ paused: true }).add(enter, 0).add(exit, exitStart);
            };

            SplitText.create(titleEl, {
                type: 'lines',
                mask: 'lines',
                linesClass: 'tx-line',
                aria: 'none',
                autoSplit: true,
                onSplit(self) {
                    const p = master.progress();
                    master.kill();
                    master = build(self.lines as HTMLElement[]);
                    master.progress(p);
                    return master;
                },
            });

            let entered = false;
            let playingTo: number | null = null;
            let lastPhase = '';

            const scrubTo = (target: number, instant = !opts.smooth) => {
                playingTo = null;
                if (instant) {
                    gsap.killTweensOf(master);
                    master.progress(target);
                } else {
                    // A short catch-up smooths out chunky mouse-wheel steps.
                    gsap.to(master, { progress: target, duration: 0.35, ease: GSAP_EASE.out, overwrite: true });
                }
            };
            // Timed playback, independent of the scroll, used for "play back" on the way up.
            const playTo = (target: number, ms: number, span: number) => {
                if (playingTo === target) return;
                playingTo = target;
                const dur = (Math.abs(master.progress() - target) / span) * (ms / 1000);
                gsap.to(master, { progress: target, duration: dur, ease: 'none', overwrite: true, onComplete: () => void (playingTo = null) });
            };

            const drive = (p: number, dir: number, instant = false) => {
                fill.style.transform = `scaleX(${p})`;
                const phase = p < enterEnd ? 'Enter' : p < exitStart ? 'Hold' : 'Exit';
                if (phase !== lastPhase) {
                    phaseEl.textContent = phase;
                    lastPhase = phase;
                }
                let target = p;
                if (opts.upEnter === 'stay' && entered) target = Math.max(target, enterEnd);
                if (dir < 0 && p > exitStart && opts.upExit === 'play') return playTo(enterEnd, t.reveal, 1 - exitStart);
                if (dir < 0 && p < enterEnd && opts.upEnter === 'play') return playTo(0, t.reveal * t.exitRatio, enterEnd);
                if (target >= enterEnd) entered = true;
                scrubTo(target, instant || !opts.smooth);
            };

            const pinned = opts.layout === 'pinned';
            const st = ScrollTrigger.create({
                trigger: pinned ? el : content,
                // Pinned: enter while the stage arrives, then hold and exit while it's stuck, so the
                // exit is finished before the stage scrolls away.
                start: pinned ? 'top 50%' : 'top 88%',
                end: pinned ? 'bottom bottom' : 'bottom 12%',
                onUpdate: (self) => drive(self.progress, self.direction),
            });
            // Start in the right state if the page is already scrolled into this scene.
            drive(st.progress, 1, true);

            // Keyboard: tabbing into a scene shows it, whatever the scroll position.
            const onFocus = () => scrubTo(Math.min(Math.max(master.progress(), enterEnd), exitStart));
            el.addEventListener('focusin', onFocus);
            return () => el.removeEventListener('focusin', onFocus);
        },
        { scope: root, dependencies: [opts.layout, opts.upEnter, opts.upExit, opts.hold, opts.smooth, t, reduced], revertOnUpdate: true },
    );

    return (
        <section ref={root} className="scene" aria-labelledby={`scene-${index}`}>
            <div className="scene-stage">
                <div className="scene-content">
                    <p className="scene-eyebrow eyebrow">{eyebrow}</p>
                    <h3 id={`scene-${index}`} className="scene-title">
                        <span className="sr-only">{title}</span>
                        <span className="tx-visual" aria-hidden="true" />
                    </h3>
                    <p className="scene-desc">
                        <span className="sr-only">{desc}</span>
                        <span className="tx-visual" aria-hidden="true" />
                    </p>
                    <div className="scene-ui">
                        <span className="stat">
                            <b>{enterPct}%</b> enter
                        </span>
                        <span className="stat">
                            <b>{Math.round(opts.hold * 100)}%</b> hold
                        </span>
                        <span className="stat">
                            <b>{enterPct}%</b> exit
                        </span>
                        <a className="btn btn-sm" href="#scroll">
                            Call to action
                        </a>
                    </div>
                </div>
                <div className="scene-meter" aria-hidden="true">
                    <span className="scene-phase">Enter</span>
                    <span className="scene-track" style={{ ['--a' as string]: `${enterPct}%`, ['--b' as string]: `${100 - enterPct}%` }}>
                        <span className="scene-meter-fill" />
                    </span>
                </div>
            </div>
        </section>
    );
}

export function ScrollScenes() {
    const { reduced } = useMotionTokens();
    const [layout, setLayout] = useState<Layout>('pinned');
    const [hold, setHold] = useState<Hold>('medium');
    const [upEnter, setUpEnter] = useState<UpEnter>('rewind');
    const [upExit, setUpExit] = useState<UpExit>('rewind');
    const [smooth, setSmooth] = useState(true);
    const opts: Opts = { layout, upEnter, upExit, hold: HOLD[hold], smooth };

    return (
        <div className="scenes" data-layout={reduced ? 'flow' : layout}>
            {SCENES.map((s, i) => (
                <Scene key={s.eyebrow} index={i} {...s} opts={opts} />
            ))}
            <div className="scene-bar" role="group" aria-label="Scroll scene options">
                <div className="scene-bar-group">
                    <span className="scene-bar-label">Layout</span>
                    <Segmented
                        label="Layout"
                        value={layout}
                        options={[
                            { value: 'pinned', label: 'Pinned' },
                            { value: 'flow', label: 'In flow' },
                        ]}
                        onChange={setLayout}
                    />
                </div>
                <div className="scene-bar-group">
                    <span className="scene-bar-label">Hold</span>
                    <Segmented
                        label="Hold"
                        value={hold}
                        options={[
                            { value: 'short', label: 'Short' },
                            { value: 'medium', label: 'Medium' },
                            { value: 'long', label: 'Long' },
                        ]}
                        onChange={setHold}
                    />
                </div>
                <div className="scene-bar-group">
                    <span className="scene-bar-label">Scroll up · enter</span>
                    <Segmented
                        label="When scrolling up through the enter"
                        value={upEnter}
                        options={[
                            { value: 'rewind', label: 'Rewind' },
                            { value: 'play', label: 'Play back' },
                            { value: 'stay', label: 'Stay' },
                        ]}
                        onChange={setUpEnter}
                    />
                </div>
                <div className="scene-bar-group">
                    <span className="scene-bar-label">Scroll up · exit</span>
                    <Segmented
                        label="When scrolling up through the exit"
                        value={upExit}
                        options={[
                            { value: 'rewind', label: 'Rewind' },
                            { value: 'play', label: 'Play back' },
                        ]}
                        onChange={setUpExit}
                    />
                </div>
                <Toggle label="Smoothing" checked={smooth} onChange={setSmooth} />
            </div>
        </div>
    );
}

/** Zero-JavaScript version: CSS view timelines. Chromium and Safari 26+; elsewhere it's static. */
export function CssScene() {
    const supported = typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()');
    return (
        <div className="css-scene">
            <div className="css-scene-inner">
                <span className="chip">{supported ? 'CSS view timeline: running' : 'Not supported here: shown static'}</span>
                <p className="eyebrow css-a">CSS only</p>
                <h3 className="css-title css-b">Same idea, no JavaScript</h3>
                <p className="css-desc css-c">Each piece has its own enter and exit range on the element’s view timeline, so the stagger happens in scroll distance.</p>
            </div>
        </div>
    );
}
