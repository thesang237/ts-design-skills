// Text effect engines. Every engine has the same shape (enter / exit / hover / set) so one
// component can drive any of them from scroll, a button, or a hover.
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

import { GSAP_EASE } from '../motion/MotionProvider';
import { REDUCED, staggerStep, type Tokens } from '../motion/tokens';

export type Effect = 'mask-up' | 'fade-up' | 'fade-in' | 'scramble' | 'type';
export type Split = 'lines' | 'words' | 'chars';

export type Engine = {
    enter: () => void;
    exit: () => void;
    hover: () => void;
    /** Jump to shown / hidden without animating. */
    set: (shown: boolean) => void;
};

type Opts = { tokens: Tokens; reduced: boolean; split: Split };

const s = (ms: number) => ms / 1000;

/**
 * `el` must be an element React renders with no children: the engine owns everything inside it,
 * so React never tries to update text nodes that have been split apart.
 */
export function createEngine(effect: Effect, el: HTMLElement, text: string, o: Opts): Engine {
    el.textContent = text;
    if (o.reduced) return fadeEngine(el);
    if (effect === 'scramble') return scrambleEngine(el, o);
    if (effect === 'type') return typeEngine(el, o);
    return splitEngine(el, effect, o);
}

/* Reduced motion: no splitting, no travel. A short fade, still sequential. */
function fadeEngine(el: HTMLElement): Engine {
    const tl = gsap.timeline({ paused: true }).fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: s(REDUCED.fadeIn), ease: 'none' });
    return {
        enter: () => void tl.timeScale(1).play(),
        exit: () => void tl.timeScale(REDUCED.fadeIn / REDUCED.fadeOut).reverse(),
        hover: () => {},
        set: (shown) => void tl.pause().progress(shown ? 1 : 0),
    };
}

/* Mask up / fade up / fade in, by lines, words or characters (GSAP SplitText). */
function splitEngine(el: HTMLElement, effect: Effect, { tokens: t, split }: Opts): Engine {
    const masked = effect === 'mask-up';
    // Masks are padded in CSS so descenders (g, y, p) are not clipped; travel a bit more than
    // 100% so nothing peeks into that padding while hidden.
    const HIDDEN = 120;
    let tl = gsap.timeline({ paused: true });
    let units: HTMLElement[] = [];
    let hoverTl: gsap.core.Animation | null = null;
    let shown = false;
    // True while an enter or exit is playing. A re-split (font load, resize) can happen at any
    // moment, and the new timeline must keep playing in the same direction.
    let moving = false;
    const settle = () => (moving = false);

    SplitText.create(el, {
        type: split === 'chars' ? 'words,chars' : split,
        mask: masked ? split : undefined,
        linesClass: 'tx-line',
        wordsClass: 'tx-word',
        charsClass: 'tx-char',
        aria: 'none', // the component already provides a screen-reader copy
        autoSplit: split === 'lines', // re-split when fonts load or the width changes
        onSplit(self) {
            hoverTl?.kill();
            units = self[split] as HTMLElement[];
            const each = staggerStep(t, units.length, split);
            const dur = s(split === 'chars' ? t.reveal * 0.7 : t.reveal);
            const from = masked ? { yPercent: HIDDEN } : effect === 'fade-up' ? { y: t.rise, autoAlpha: 0 } : { autoAlpha: 0 };
            const to = masked ? { yPercent: 0 } : effect === 'fade-up' ? { y: 0, autoAlpha: 1 } : { autoAlpha: 1 };
            tl = gsap.timeline({ paused: true, onComplete: settle, onReverseComplete: settle }).fromTo(units, from, { ...to, duration: dur, ease: GSAP_EASE.out, stagger: each });
            if (moving) void (shown ? tl.play() : tl.timeScale(1 / t.exitRatio).reverse());
            else tl.progress(shown ? 1 : 0);
            return tl; // SplitText then moves the playhead to where the old timeline was
        },
    });

    return {
        enter: () => {
            shown = true;
            moving = tl.progress() < 1;
            hoverTl?.progress(1).kill();
            tl.timeScale(1).play();
        },
        exit: () => {
            shown = false;
            moving = tl.progress() > 0;
            hoverTl?.progress(1).kill();
            tl.timeScale(1 / t.exitRatio).reverse(); // reversed ease-out = accelerates away
        },
        hover: () => {
            if (!shown || tl.progress() < 1 || hoverTl?.isActive()) return;
            const each = staggerStep(t, units.length, split) * 0.5;
            hoverTl = masked
                ? // Roll through the mask: out the top, back in from below.
                  gsap.to(units, {
                      keyframes: [
                          { yPercent: -HIDDEN, duration: s(t.fast), ease: GSAP_EASE.in },
                          { yPercent: HIDDEN, duration: 0 },
                          { yPercent: 0, duration: s(t.base), ease: GSAP_EASE.out },
                      ],
                      stagger: each,
                  })
                : // Small wave; opacity untouched so the text stays readable.
                  gsap.to(units, {
                      keyframes: [
                          { yPercent: -14, duration: s(t.fast), ease: GSAP_EASE.out },
                          { yPercent: 0, duration: s(t.base), ease: GSAP_EASE.inOut },
                      ],
                      stagger: each,
                  });
        },
        set: (v) => {
            shown = v;
            moving = false;
            hoverTl?.progress(1).kill();
            tl.pause().progress(v ? 1 : 0);
        },
    };
}

/* Shared: split into per-character slots. Each slot keeps the real character (which fixes the
   layout, so nothing ever shifts) plus an overlay that can show something else. */
function charSlots(el: HTMLElement, withOverlay: boolean) {
    const text = el.textContent ?? '';
    el.textContent = '';
    const slots: { real: HTMLSpanElement; glyph?: HTMLSpanElement; ch: string }[] = [];
    for (const word of text.split(/(\s+)/)) {
        if (!word) continue;
        if (/^\s+$/.test(word)) {
            el.append(document.createTextNode(word));
            continue;
        }
        const w = document.createElement('span');
        w.className = 'tx-word';
        for (const ch of word) {
            const slot = document.createElement('span');
            slot.className = 'tx-slot';
            const real = document.createElement('span');
            real.className = 'tx-real';
            real.textContent = ch;
            slot.append(real);
            let glyph: HTMLSpanElement | undefined;
            if (withOverlay) {
                glyph = document.createElement('span');
                glyph.className = 'tx-glyph';
                slot.append(glyph);
            }
            w.append(slot);
            slots.push({ real, glyph, ch });
        }
        el.append(w);
    }
    return slots;
}

// Deterministic pseudo-random so a reversed animation shows the same frames.
const hash = (a: number, b: number) => {
    let h = (a * 374761393 + b * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+=/<>?';

/* Random ASCII that settles, letter by letter, into the real text. */
function scrambleEngine(el: HTMLElement, { tokens: t }: Opts): Engine {
    const slots = charSlots(el, true);
    const n = slots.length;
    const step = staggerStep(t, n, 'chars');
    const settle = s(t.reveal * 0.5); // how long each letter scrambles before settling
    const total = step * (n - 1) + settle;
    const GLYPH_FPS = 20; // glyph changes per second: lively without strobing
    const state = { time: 0 };
    let shown = false;
    let hoverTl: gsap.core.Tween | null = null;

    // start: when letter i begins scrambling; dur: how long it scrambles; before: what shows until then.
    const render = (time: number, start: (i: number) => number, dur: number, before: 'hidden' | 'real', seed = 0) => {
        const frame = Math.floor(time * GLYPH_FPS);
        for (let i = 0; i < n; i++) {
            const { real, glyph } = slots[i];
            const local = time - start(i);
            const phase = local < 0 ? before : local < dur ? 'scramble' : 'real';
            if (real.dataset.p !== phase) {
                real.dataset.p = phase; // CSS shows/hides the real letter and the overlay
            }
            if (phase === 'scramble' && glyph) {
                const g = GLYPHS[Math.floor(hash(i + seed, frame) * GLYPHS.length)];
                if (glyph.textContent !== g) glyph.textContent = g; // write only when it changes
            }
        }
    };
    const draw = () => render(state.time, (i) => i * step, settle, 'hidden');
    const tl = gsap.timeline({ paused: true }).to(state, { time: total, duration: total, ease: 'none', onUpdate: draw });
    draw();

    return {
        enter: () => {
            shown = true;
            hoverTl?.progress(1).kill();
            tl.timeScale(1).play();
        },
        exit: () => {
            shown = false;
            hoverTl?.progress(1).kill();
            tl.timeScale(1 / t.exitRatio).reverse();
        },
        hover: () => {
            if (!shown || tl.progress() < 1 || hoverTl?.isActive()) return;
            // Quick re-scramble sweeping left to right; letters never disappear.
            const h = { time: 0 };
            const hs = Math.min(0.012, 0.25 / n);
            const hd = s(t.base);
            const seed = Math.floor(Math.random() * 1000);
            hoverTl = gsap.to(h, {
                time: hs * n + hd,
                duration: hs * n + hd,
                ease: 'none',
                onUpdate: () => render(h.time, (i) => i * hs, hd, 'real', seed),
                onComplete: draw,
            });
        },
        set: (v) => {
            shown = v;
            hoverTl?.kill();
            tl.pause().progress(v ? 1 : 0);
            draw();
        },
    };
}

/* Terminal typing: human rhythm, a caret that is solid while typing and blinks at rest. */
function typeEngine(el: HTMLElement, { tokens: t }: Opts): Engine {
    const slots = charSlots(el, false);
    const n = slots.length;
    const root = el.closest<HTMLElement>('.tx') ?? el;
    // Per-letter delay, tied to the stagger token so the tuner speeds it up too.
    const base = Math.min(80, Math.max(22, t.stagger * 0.5)) / 1000;
    const times: number[] = [];
    let acc = s(t.base); // a short "thinking" pause with the caret blinking first
    slots.forEach((_, i) => {
        const prev = i > 0 ? slots[i - 1].ch : '';
        let d = base * (0.65 + hash(i, 7) * 0.7); // +-35% jitter
        if (/[,;:]/.test(prev)) d += base * 4;
        if (/[.!?]/.test(prev)) d += base * 8;
        acc += d;
        times.push(acc);
    });
    const state = { count: 0 };
    let shown = false;

    const draw = () => {
        const c = Math.round(state.count);
        slots.forEach(({ real }, i) => {
            const v = i < c ? 'real' : 'hidden';
            if (real.dataset.p !== v) real.dataset.p = v;
            // Caret sits after the last typed letter, or before the first one.
            const caret = c === 0 ? (i === 0 ? 'before' : '') : i === c - 1 ? 'after' : '';
            if ((real.dataset.caret ?? '') !== caret) {
                if (caret) real.dataset.caret = caret;
                else delete real.dataset.caret;
            }
        });
    };

    let tween: gsap.core.Animation | null = null;
    const typing = (on: boolean) => root.classList.toggle('is-typing', on);

    const typeFrom = (from: number, speed = 1) => {
        tween?.kill();
        const start = from > 0 ? times[from - 1] : 0;
        const prog = { time: start };
        typing(true);
        tween = gsap.to(prog, {
            time: times[n - 1],
            duration: (times[n - 1] - start) / speed,
            ease: 'none',
            onUpdate: () => {
                let c = 0;
                while (c < n && times[c] <= prog.time) c++;
                state.count = c;
                draw();
            },
            onComplete: () => typing(false),
        });
    };

    const erase = () => {
        tween?.kill();
        typing(true);
        const dur = Math.min(state.count * 0.018, s(t.reveal * t.exitRatio)); // quick, even backspace
        tween = gsap.to(state, { count: 0, duration: dur, ease: 'none', onUpdate: draw, onComplete: () => typing(false) });
    };

    draw();
    return {
        enter: () => {
            if (shown && state.count >= n) return;
            shown = true;
            typeFrom(Math.round(state.count));
        },
        exit: () => {
            shown = false;
            erase();
        },
        hover: () => {
            if (!shown || tween?.isActive()) return;
            // Retype the last word, twice as fast: a small sign of life.
            const lastSpace = slots.map((x) => x.ch).lastIndexOf(' ');
            state.count = lastSpace + 1;
            draw();
            typeFrom(lastSpace + 1, 2);
        },
        set: (v) => {
            shown = v;
            tween?.kill();
            typing(false);
            state.count = v ? n : 0;
            draw();
        },
    };
}
