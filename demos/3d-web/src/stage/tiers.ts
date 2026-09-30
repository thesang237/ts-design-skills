/** Quality tiers: what each device class gets. See the skill's references/performance-tiers.md. */
export type Tier = 'high' | 'mid' | 'low' | 'poster';
export type LiveTier = Exclude<Tier, 'poster'>;
export type TierSettings = { dpr: number; share: number; shadows: boolean };

export const TIERS: Record<LiveTier, TierSettings> = {
    high: { dpr: 2, share: 1, shadows: true },
    mid: { dpr: 1.25, share: 0.5, shadows: true },
    low: { dpr: 1, share: 0.25, shadows: false },
};

export const ORDER: LiveTier[] = ['high', 'mid', 'low'];

export function hasWebGL2() {
    try {
        return !!document.createElement('canvas').getContext('webgl2');
    } catch {
        return false;
    }
}

/** A cheap first guess from the device. The runtime monitor corrects it. */
export function initialTier(): LiveTier {
    const cores = navigator.hardwareConcurrency ?? 4;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const small = Math.min(screen.width, screen.height) < 768;
    if (cores <= 4 || mem <= 2) return 'low';
    if (small || cores <= 6) return 'mid';
    return 'high';
}

/**
 * Watches frame time in 1.5s windows. Two slow windows (avg > 20ms, under ~50fps) → step down.
 * Four fast windows (avg < 12ms) → step back up, never above the starting tier. At most 4 changes.
 */
export class TierMonitor {
    private sum = 0;
    private frames = 0;
    private elapsed = 0;
    private slow = 0;
    private fast = 0;
    private changes = 0;
    private settle = 1; // ignore the first window after a change

    constructor(
        private ceiling: LiveTier,
        private onChange: (next: Tier) => void,
    ) {}

    reset(ceiling?: LiveTier) {
        if (ceiling) this.ceiling = ceiling;
        this.sum = this.frames = this.elapsed = this.slow = this.fast = this.changes = 0;
        this.settle = 1;
    }

    sample(frameMs: number, current: LiveTier) {
        this.sum += frameMs;
        this.frames++;
        this.elapsed += frameMs;
        if (this.elapsed < 1500) return;
        const avg = this.sum / this.frames;
        this.sum = this.frames = this.elapsed = 0;
        if (this.settle > 0) {
            this.settle--;
            return;
        }
        if (avg > 20) {
            this.slow++;
            this.fast = 0;
        } else if (avg < 12) {
            this.fast++;
            this.slow = 0;
        } else {
            this.slow = this.fast = 0;
        }
        if (this.changes >= 4) return;
        const i = ORDER.indexOf(current);
        if (this.slow >= 2) {
            this.slow = 0;
            this.changes++;
            this.settle = 1;
            this.onChange(i < ORDER.length - 1 ? ORDER[i + 1] : 'poster');
        } else if (this.fast >= 4 && i > ORDER.indexOf(this.ceiling)) {
            this.fast = 0;
            this.changes++;
            this.settle = 1;
            this.onChange(ORDER[i - 1]);
        }
    }
}
