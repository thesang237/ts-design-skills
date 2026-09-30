import { createContext, type ReactNode, use, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { MotionConfig, spring } from 'motion/react';

import { type Bezier, bezierCss, DEFAULT_TOKENS, EASES, mainEase, REDUCED, type Tokens } from './tokens';

gsap.registerPlugin(CustomEase, ScrollTrigger, SplitText);
// Phones resize the viewport when the address bar hides; that must not re-run every trigger.
ScrollTrigger.config({ ignoreMobileResize: true });

const bezierPath = ([x1, y1, x2, y2]: Bezier) => `M0,0 C${x1},${y1} ${x2},${y2} 1,1`;

/** GSAP names for the three curves. Use these instead of 'power3.out' etc. */
export const GSAP_EASE = { out: 'wm.out', inOut: 'wm.inOut', in: 'wm.in' } as const;

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';
const subscribeOs = (cb: () => void) => {
    const mq = window.matchMedia(REDUCE_QUERY);
    mq.addEventListener('change', cb);
    return () => mq.removeEventListener('change', cb);
};
const readOs = () => window.matchMedia(REDUCE_QUERY).matches;

type Ctx = {
    tokens: Tokens;
    setTokens: (patch: Partial<Tokens>) => void;
    resetTokens: () => void;
    /** True when the OS asks for reduced motion OR the demo toggle is on. */
    reduced: boolean;
    osReduced: boolean;
    forceReduced: boolean;
    setForceReduced: (v: boolean) => void;
    /** Bumps when the user presses "Replay all". */
    replayKey: number;
    replayAll: () => void;
};

const MotionCtx = createContext<Ctx | null>(null);

export function MotionProvider({ children }: { children: ReactNode }) {
    const [tokens, setAll] = useState<Tokens>(DEFAULT_TOKENS);
    const [forceReduced, setForceReduced] = useState(false);
    const [replayKey, setReplayKey] = useState(0);
    const osReduced = useSyncExternalStore(subscribeOs, readOs, () => false);
    const reduced = osReduced || forceReduced;

    // Register GSAP eases before children's layout effects run (parents' effects run after
    // children's, so do it during render; CustomEase.create is idempotent per name).
    const ease = mainEase(tokens);
    useMemo(() => {
        CustomEase.create(GSAP_EASE.out, bezierPath(ease));
        CustomEase.create(GSAP_EASE.inOut, bezierPath(EASES.inOut));
        CustomEase.create(GSAP_EASE.in, bezierPath(EASES.in));
    }, [ease]);

    // Same tokens as CSS variables, so plain CSS transitions follow the tuner too.
    useLayoutEffect(() => {
        const root = document.documentElement;
        const vars: Record<string, string> = {
            '--ease-out': bezierCss(ease),
            '--ease-in-out': bezierCss(EASES.inOut),
            '--ease-in': bezierCss(EASES.in),
            '--dur-fast': `${tokens.fast}ms`,
            '--dur-base': `${tokens.base}ms`,
            '--dur-slow': `${tokens.slow}ms`,
            '--dur-reveal': `${tokens.reveal}ms`,
            '--exit-ratio': String(tokens.exitRatio),
            '--rise': `${tokens.rise}px`,
            '--lift': `${tokens.lift}px`,
            '--stagger': `${tokens.stagger}ms`,
            '--press': String(tokens.press),
            // Motion turns the spring into a CSS linear() curve: "<settle time> linear(...)".
            '--spring': spring(tokens.springDuration, tokens.springBounce).toString(),
        };
        for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
        root.dataset.motion = reduced ? 'reduce' : 'full';
    }, [tokens, ease, reduced]);

    const value = useMemo<Ctx>(
        () => ({
            tokens,
            setTokens: (patch) => setAll((t) => ({ ...t, ...patch })),
            resetTokens: () => setAll(DEFAULT_TOKENS),
            reduced,
            osReduced,
            forceReduced,
            setForceReduced,
            replayKey,
            replayAll: () => setReplayKey((k) => k + 1),
        }),
        [tokens, reduced, osReduced, forceReduced, replayKey],
    );

    return (
        <MotionCtx value={value}>
            {/* Motion: transforms off when reduced, opacity and colour kept. */}
            <MotionConfig reducedMotion={reduced ? 'always' : 'never'} transition={{ duration: tokens.reveal / 1000, ease: [...ease] }}>
                {children}
            </MotionConfig>
        </MotionCtx>
    );
}

export function useMotionTokens() {
    const ctx = use(MotionCtx);
    if (!ctx) throw new Error('useMotionTokens must be used inside <MotionProvider>');
    return ctx;
}

export { REDUCED };
