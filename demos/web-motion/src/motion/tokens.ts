// The one place motion taste lives. CSS variables, GSAP eases and Motion transitions are all
// generated from this object, so changing a value here (or in the tuner) retunes everything.

export type Bezier = readonly [number, number, number, number];

export const EASES = {
    // Main curve: anything that enters or answers a click. Fast start, soft landing.
    out: [0.22, 1, 0.36, 1],
    // Something already on screen moving from A to B (toggles, reorder, tabs).
    inOut: [0.65, 0, 0.35, 1],
    // Exits only, and only short ones: things accelerate away.
    in: [0.4, 0, 1, 1],
} as const satisfies Record<string, Bezier>;

// Smooth-out is the only arrival curve (Sang, 2026-09-30).
export const EASE_CHOICES = {
    'smooth-out': EASES.out,
} as const satisfies Record<string, Bezier>;
export type EaseChoice = keyof typeof EASE_CHOICES;

export type Tokens = {
    ease: EaseChoice;
    /** ms. Buttons, hovers, small toggles. */
    fast: number;
    /** ms. Menus, tooltips, popovers. UI stays at or under 300ms. */
    base: number;
    /** ms. Modals, drawers, expressive card hovers. */
    slow: number;
    /** ms. Content arriving on scroll or first load. */
    reveal: number;
    /** Exit duration = enter x this. Exits are always quicker than entrances. */
    exitRatio: number;
    /** px. How far revealed content rises. */
    rise: number;
    /** px. Hover lift. */
    lift: number;
    /** ms between items in a group (cards, list rows, lines of a heading). */
    stagger: number;
    /** ms. A group never takes longer than this to start its last item. */
    staggerCap: number;
    /** Gesture spring: seconds until it visually arrives, and 0-1 bounce. */
    springDuration: number;
    springBounce: number;
    /** Scale while pressed. */
    press: number;
};

export const DEFAULT_TOKENS: Tokens = {
    ease: 'smooth-out',
    fast: 160,
    base: 240,
    slow: 400,
    reveal: 700,
    exitRatio: 0.6,
    rise: 18,
    lift: 2,
    stagger: 70,
    staggerCap: 490,
    springDuration: 0.4,
    springBounce: 0.1,
    press: 0.97,
};

// Reduced motion: short fades only, nothing travels, nothing staggers far.
export const REDUCED = { fadeIn: 160, fadeOut: 100, stagger: 0 } as const;

export const bezierCss = (b: Bezier) => `cubic-bezier(${b.join(', ')})`;
export const mainEase = (t: Tokens): Bezier => EASE_CHOICES[t.ease];

/**
 * Per-item stagger for a group, in seconds. Smaller pieces get a smaller step
 * (words about half, characters about a fifth), and the whole group is capped so
 * a long list or heading never drags.
 */
export function staggerStep(t: Tokens, count: number, unit: 'items' | 'lines' | 'words' | 'chars' = 'items') {
    const factor = unit === 'chars' ? 0.2 : unit === 'words' ? 0.5 : 1;
    const step = t.stagger * factor;
    const capped = count > 1 ? Math.min(step, t.staggerCap / (count - 1)) : step;
    return capped / 1000;
}

export const exitMs = (t: Tokens, enterMs: number) => Math.max(100, Math.round(enterMs * t.exitRatio));
