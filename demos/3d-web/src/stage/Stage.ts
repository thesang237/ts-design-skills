import * as THREE from 'three';

import { type LiveTier, type Tier, TierMonitor, TIERS, type TierSettings } from './tiers';

/** What a scene gets every frame. */
export type FrameCtx = {
    time: number;
    dt: number;
    /** How far the view has travelled through the screen: 0 entering at the bottom → 1 leaving at the top. */
    progress: number;
    /** Pointer in the view's own NDC (−1..1, y up), plus whether it's over the view. */
    pointer: { x: number; y: number; over: boolean };
    tier: TierSettings;
};

export type SceneApp = {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    update: (ctx: FrameCtx) => void;
    applyTier?: (s: TierSettings) => void;
    dispose: () => void;
};

export type SceneFactory = (renderer: THREE.WebGLRenderer) => SceneApp;

export type Stats = {
    fps: number;
    frameMs: number;
    calls: number;
    triangles: number;
    geometries: number;
    textures: number;
    programs: number;
    dpr: number;
    views: number;
};

export type Mode = 'live' | 'lost';

type ViewEntry = { el: HTMLElement; app: SceneApp; pointer: { x: number; y: number; over: boolean } };

// How many WebGL contexts are alive right now, and the last stats seen (for the cleanup ledger).
export const contextCounter = { open: 0, created: 0 };
export const lastSeen: { stats: Stats | null } = { stats: null };

/**
 * One fixed, transparent canvas for the whole page. Each <View> registers a scene and a DOM
 * element; every frame the stage draws each visible scene into its element's rectangle
 * (viewport + scissor). One WebGL context, however many sections have 3D.
 */
export class Stage {
    readonly renderer: THREE.WebGLRenderer;
    readonly canvas: HTMLCanvasElement;
    private views = new Map<string, ViewEntry>();
    private last = performance.now();
    private statT = 0;
    private statFrames = 0;
    private statMs = 0;
    private pointer = { x: -1, y: -1 };
    private monitor: TierMonitor;
    /** Grab the extension up front: once the context is lost, getExtension() returns null. */
    private loseExt: WEBGL_lose_context | null = null;
    tier: LiveTier;
    auto = true;
    stress = false;
    mode: Mode = 'live';
    /** True while the poster is showing: no rendering at all. */
    paused = false;

    constructor(
        tier: LiveTier,
        private hooks: { onStats: (s: Stats) => void; onMode: (m: Mode) => void; onTier: (t: Tier) => void },
    ) {
        this.tier = tier;
        this.canvas = document.createElement('canvas');
        this.canvas.className = 'stage-canvas';
        this.canvas.setAttribute('aria-hidden', 'true');
        document.body.prepend(this.canvas);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
        contextCounter.open++;
        contextCounter.created++;
        this.renderer.toneMapping = THREE.NeutralToneMapping;
        this.renderer.shadowMap.type = THREE.PCFShadowMap; // PCFSoftShadowMap was removed in r18x
        this.loseExt = this.renderer.getContext().getExtension('WEBGL_lose_context');
        this.renderer.info.autoReset = false; // several renders per frame: reset once per frame ourselves
        this.renderer.setClearColor(0x000000, 0);
        this.monitor = new TierMonitor(tier, (next) => this.hooks.onTier(next));
        this.applyTier(tier);

        window.addEventListener('resize', this.onResize);
        window.addEventListener('pointermove', this.onPointer, { passive: true });
        this.canvas.addEventListener('webglcontextlost', this.onLost);
        this.canvas.addEventListener('webglcontextrestored', this.onRestored);
        this.renderer.setAnimationLoop(this.frame);
    }

    add(id: string, el: HTMLElement, factory: SceneFactory) {
        const app = factory(this.renderer);
        app.applyTier?.(TIERS[this.tier]);
        this.views.set(id, { el, app, pointer: { x: 0, y: 0, over: false } });
        return () => {
            const v = this.views.get(id);
            if (v?.app === app) this.views.delete(id);
            app.dispose();
        };
    }

    applyTier(tier: LiveTier) {
        this.tier = tier;
        const s = TIERS[tier];
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, s.dpr));
        this.renderer.setSize(window.innerWidth, window.innerHeight, false);
        if (this.renderer.shadowMap.enabled !== s.shadows) {
            this.renderer.shadowMap.enabled = s.shadows;
            this.views.forEach((v) =>
                v.app.scene.traverse((o) => {
                    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
                    if (m) m.needsUpdate = true;
                }),
            );
        }
        this.views.forEach((v) => v.app.applyTier?.(s));
        this.monitor.reset();
    }

    setAuto(auto: boolean, ceiling?: LiveTier) {
        this.auto = auto;
        this.monitor.reset(ceiling);
    }

    /** Simulate a GPU reset (the browser can do this at any time). */
    loseContext() {
        this.loseExt?.loseContext();
    }

    restoreContext() {
        this.loseExt?.restoreContext();
    }

    dispose() {
        this.renderer.setAnimationLoop(null);
        window.removeEventListener('resize', this.onResize);
        window.removeEventListener('pointermove', this.onPointer);
        this.canvas.removeEventListener('webglcontextlost', this.onLost);
        this.canvas.removeEventListener('webglcontextrestored', this.onRestored);
        this.views.forEach((v) => v.app.dispose());
        this.views.clear();
        this.renderer.dispose();
        if (this.mode === 'live') this.loseExt?.loseContext(); // free the context now, don't wait for GC
        this.canvas.remove();
        contextCounter.open--;
    }

    private onResize = () => this.renderer.setSize(window.innerWidth, window.innerHeight, false);

    private onPointer = (e: PointerEvent) => {
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
    };

    private onLost = (e: Event) => {
        e.preventDefault(); // "I want this context back"
        this.mode = 'lost';
        this.hooks.onMode('lost');
    };

    private onRestored = () => {
        this.mode = 'live';
        this.applyTier(this.tier);
        this.hooks.onMode('live');
    };

    private frame = (time: number) => {
        const now = performance.now();
        const frameMs = now - this.last;
        this.last = now;
        if (this.mode !== 'live' || this.paused || document.hidden) return;
        const dt = Math.min(frameMs / 1000, 1 / 30);
        const t = time / 1000;
        const r = this.renderer;
        const H = window.innerHeight;
        r.info.reset();
        r.setScissorTest(false);
        r.setClearColor(0x000000, 0); // a scene's background changes the clear colour: reset it, or the whole page gets painted
        r.clear();
        r.setScissorTest(true);
        let drawn = 0;

        for (const v of this.views.values()) {
            const rect = v.el.getBoundingClientRect(); // one read per view per frame, no writes in between
            if (rect.bottom < 0 || rect.top > H || rect.width < 2 || rect.height < 2) continue; // off screen: skip
            const progress = Math.min(1, Math.max(0, (H - rect.top) / (H + rect.height)));
            const over = this.pointer.x >= rect.left && this.pointer.x <= rect.right && this.pointer.y >= rect.top && this.pointer.y <= rect.bottom;
            v.pointer.over = over;
            if (over) {
                v.pointer.x = ((this.pointer.x - rect.left) / rect.width) * 2 - 1;
                v.pointer.y = -((this.pointer.y - rect.top) / rect.height) * 2 + 1;
            }
            const cam = v.app.camera;
            const aspect = rect.width / rect.height;
            if (Math.abs(cam.aspect - aspect) > 1e-3) {
                cam.aspect = aspect;
                cam.updateProjectionMatrix();
            }
            v.app.update({ time: t, dt, progress, pointer: v.pointer, tier: TIERS[this.tier] });
            const y = H - rect.bottom; // WebGL measures from the bottom
            r.setViewport(rect.left, y, rect.width, rect.height);
            r.setScissor(rect.left, y, rect.width, rect.height);
            r.render(v.app.scene, cam);
            drawn++;
        }

        // "Simulate a slow device": extra work that scales with the tier's cost, like real GPU load
        if (this.stress) {
            const cost = { high: 26, mid: 9, low: 4 }[this.tier];
            const until = performance.now() + cost;
            while (performance.now() < until) {
                /* busy */
            }
        }

        if (this.auto) this.monitor.sample(frameMs, this.tier);

        this.statT += frameMs;
        this.statFrames++;
        this.statMs += frameMs;
        if (this.statT > 500) {
            const stats: Stats = {
                fps: Math.round((this.statFrames * 1000) / this.statT),
                frameMs: +(this.statMs / this.statFrames).toFixed(1),
                calls: r.info.render.calls,
                triangles: r.info.render.triangles,
                geometries: r.info.memory.geometries,
                textures: r.info.memory.textures,
                programs: r.info.programs?.length ?? 0,
                dpr: +r.getPixelRatio().toFixed(2),
                views: drawn, // scenes drawn in the last frame (on screen)
            };
            lastSeen.stats = stats;
            this.hooks.onStats(stats);
            this.statT = this.statFrames = this.statMs = 0;
        }
    };
}
