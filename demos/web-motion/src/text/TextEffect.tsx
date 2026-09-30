import { type ElementType, type Ref, useImperativeHandle, useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { useMotionTokens } from '../motion/MotionProvider';
import { createEngine, type Effect, type Engine, type Split } from './engines';

gsap.registerPlugin(useGSAP);

export type Trigger = 'load' | 'scroll-once' | 'scroll-repeat' | 'manual';
export type TextEffectHandle = { enter: () => void; exit: () => void };

type Props = {
    text: string;
    effect: Effect;
    split?: Split;
    trigger?: Trigger;
    /** Play a small flourish on hover (mouse and trackpad only). */
    hover?: boolean;
    /** ms. Only for trigger="load": offsets this piece inside a first-load sequence. */
    delay?: number;
    as?: ElementType;
    className?: string;
    ref?: Ref<TextEffectHandle>;
};

const FINE_POINTER = '(hover: hover) and (pointer: fine)';
const FONT_WAIT_MS = 1000;

export function TextEffect({ text, effect, split = 'lines', trigger = 'scroll-once', hover = false, delay = 0, as: Tag = 'p', className, ref }: Props) {
    const root = useRef<HTMLElement>(null);
    const visual = useRef<HTMLSpanElement>(null);
    const engine = useRef<Engine | null>(null);
    const shown = useRef(false);
    const lastReplay = useRef(0);
    const { tokens, reduced, replayKey } = useMotionTokens();

    const { contextSafe } = useGSAP(
        () => {
            const el = root.current!;
            if (replayKey !== lastReplay.current) {
                lastReplay.current = replayKey;
                shown.current = false; // "Replay all": start hidden again
            }
            const eng = createEngine(effect, visual.current!, text, { tokens, reduced, split });
            engine.current = eng;
            eng.set(shown.current);
            el.setAttribute('data-ready', ''); // safe to show the visual layer now

            const enter = () => {
                shown.current = true;
                eng.enter();
            };
            const exit = () => {
                shown.current = false;
                eng.exit();
            };

            if (trigger === 'load') {
                // A hero waits for its web font (max 1s) so lines are measured with the real font.
                const wait = new Promise((r) => setTimeout(r, FONT_WAIT_MS));
                Promise.race([document.fonts.ready, wait]).then(contextSafe!(() => gsap.delayedCall(delay / 1000, enter)));
            } else if (trigger === 'scroll-once') {
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 88%',
                    end: 'bottom 12%',
                    once: true,
                    onEnter: enter,
                    onEnterBack: enter, // also reveal if it was scrolled past before the page was ready
                });
            } else if (trigger === 'scroll-repeat') {
                ScrollTrigger.create({
                    trigger: el,
                    start: 'top 88%',
                    end: 'bottom 12%',
                    onEnter: enter,
                    onEnterBack: enter,
                    onLeave: exit,
                    onLeaveBack: exit,
                });
            }

            if (hover && !reduced && window.matchMedia(FINE_POINTER).matches) {
                const onHover = contextSafe!(() => eng.hover());
                el.addEventListener('pointerenter', onHover);
                return () => el.removeEventListener('pointerenter', onHover);
            }
        },
        { scope: root, dependencies: [text, effect, split, trigger, hover, delay, tokens, reduced, replayKey], revertOnUpdate: true },
    );

    useImperativeHandle(ref, () => ({
        enter: contextSafe(() => {
            shown.current = true;
            engine.current?.enter();
        }),
        exit: contextSafe(() => {
            shown.current = false;
            engine.current?.exit();
        }),
    }));

    return (
        <Tag ref={root} className={['tx', className].filter(Boolean).join(' ')} data-effect={effect}>
            {/* Screen readers get the plain text once; the animated copy is hidden from them. */}
            <span className="sr-only">{text}</span>
            <span ref={visual} className="tx-visual" aria-hidden="true" />
        </Tag>
    );
}
