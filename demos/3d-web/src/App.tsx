import { lazy, type ReactNode, Suspense, useEffect, useRef, useState } from 'react';

import { Ledger, snapshot, type Visit } from './components/Ledger';
import { Panel, Switch, TierPicker } from './components/Panel';
import { View } from './components/View';
import { createCrystals } from './scenes/crystals';
import { createParticles } from './scenes/particles';
import { createProduct, productDials } from './scenes/product';
import { StageProvider, useStage } from './stage/StageContext';

// three/webgpu is a separate copy of three: load it only when asked
const WebGPUScene = lazy(() => import('./webgpu/WebGPUScene'));

function Section({ id, eyebrow, title, intro, children }: { id: string; eyebrow: string; title: string; intro: ReactNode; children?: ReactNode }) {
    return (
        <section id={id} className="section" aria-labelledby={`${id}-title`}>
            <div className="section-head">
                <p className="eyebrow">{eyebrow}</p>
                <h2 id={`${id}-title`} className="section-title">
                    {title}
                </h2>
                <p className="section-intro">{intro}</p>
            </div>
            {children}
        </section>
    );
}

function TryThis({ items }: { items: ReactNode[] }) {
    return (
        <ul className="try">
            {items.map((it, i) => (
                <li key={i}>{it}</li>
            ))}
        </ul>
    );
}

/** Live readout of the dials the scroll produces for the product scene. */
function Dials() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        let raf = 0;
        const loop = () => {
            const el = ref.current;
            if (el) {
                el.querySelectorAll<HTMLElement>('[data-dial]').forEach((n) => {
                    const v = productDials[n.dataset.dial as keyof typeof productDials];
                    n.querySelector('b')!.textContent = v.toFixed(2);
                    n.querySelector<HTMLElement>('i')!.style.transform = `scaleX(${v})`;
                });
            }
            raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(raf);
    }, []);
    return (
        <div ref={ref} className="dials" aria-label="Scroll dials">
            {[
                ['progress', 'section progress (0 enter → 1 leave)'],
                ['explode', 'explode (0.30 → 0.55, back by 0.88)'],
                ['turn', 'camera rail'],
            ].map(([k, label]) => (
                <div key={k} data-dial={k} className="dial">
                    <span>{label}</span>
                    <b>0.00</b>
                    <span className="dial-bar">
                        <i />
                    </span>
                </div>
            ))}
        </div>
    );
}

function FallbackControls() {
    const { mode, loseContext, restoreContext, simReduced, setSimReduced, simNoWebGL, setSimNoWebGL, stageReady } = useStage();
    return (
        <div className="controls-card">
            <div className="row">
                <button type="button" className="btn" disabled={!stageReady || mode === 'lost'} onClick={loseContext}>
                    Simulate a GPU crash
                </button>
                <button type="button" className="btn btn-ghost" disabled={mode !== 'lost'} onClick={restoreContext}>
                    Restore
                </button>
            </div>
            <Switch label="Pretend reduced motion is on" checked={simReduced} onChange={setSimReduced} hint="Your real system setting is read live too" />
            <Switch label="Pretend WebGL is missing" checked={simNoWebGL} onChange={setSimNoWebGL} hint="The stage is destroyed, like on a device without WebGL" />
        </div>
    );
}

function Page3D({ visits, onLeave }: { visits: Visit[]; onLeave: () => void }) {
    const { stress, setStress } = useStage();
    const [gpu, setGpu] = useState(false);
    const [forceWebGL, setForceWebGL] = useState(false);
    return (
        <>
            <section className="hero">
                <p className="eyebrow">Skill demo · placeholder content</p>
                <h1 className="hero-title">One canvas, many scenes, never a blank page.</h1>
                <p className="hero-sub">
                    Every 3D picture on this page is drawn by one shared canvas into the section it belongs to. Quality adapts to the device, a designed poster stands in whenever 3D
                    can’t run, and leaving the page frees the GPU. Move the pointer over the scenes.
                </p>
                <View id="crystals" factory={createCrystals} poster="crystals" posterAlt="A field of pale crystals floating in the dark" className="view-hero" />
            </section>

            <Section
                id="views"
                eyebrow="01 · Views, not canvases"
                title="Three scenes, one WebGL context."
                intro="Each scene is a plain page element. Every frame, the one canvas behind the page draws each visible scene into its element’s rectangle and skips the rest. Browsers only allow about sixteen canvases with 3D at once; this page uses one."
            >
                <TryThis items={['Open the panel (bottom right): “views” counts the scenes on screen right now. Scroll and watch it change.', 'Draw calls stay tiny: the crystal field is one instanced mesh, the particles are one draw.']} />
            </Section>

            <Section
                id="scroll"
                eyebrow="02 · Scroll drives numbers"
                title="The scroll only moves dials."
                intro="As this section passes through the screen, it produces one number (0 → 1). The scene maps it to an explode amount and a camera rail; every part has its own delay window. No animation library touches three.js."
            >
                <div className="split">
                    <View id="product" factory={createProduct} poster="product" posterAlt="A pale capsule-shaped object on a soft grey studio floor" className="view-tall" />
                    <Dials />
                </div>
            </Section>

            <Section
                id="tiers"
                eyebrow="03 · Quality that adapts"
                title="Lighter 3D for weaker devices, measured live."
                intro="The page guesses a tier from the device, then watches real frame times. Two slow windows in a row step it down (lower pixel ratio, fewer particles, no shadows); a long run of fast frames steps it back up."
            >
                <View id="particles" factory={createParticles} poster="particles" posterAlt="A soft sphere of tiny glowing points on black" className="view-wide" />
                <div className="controls-card">
                    <p className="panel-label">Quality</p>
                    <TierPicker />
                    <Switch label="Simulate a slow device" checked={stress} onChange={setStress} hint="Adds work each frame that scales with the tier" />
                </div>
                <TryThis items={['Keep “auto”, switch on the slow device, wait ~4 seconds: the tier drops until frames are smooth again.', 'Pick “low” by hand: particles thin out (and grow a little), the pixel ratio drops to 1, the product loses its shadow.']} />
            </Section>

            <Section
                id="fallback"
                eyebrow="04 · Always a poster"
                title="When 3D can’t run, a designed still takes its place."
                intro="No WebGL, a GPU crash, reduced motion, or a device too slow even on the low tier: every scene swaps to its poster (here, placeholder art). A crashed context is asked back; when it returns, the scenes rebuild."
            >
                <FallbackControls />
            </Section>

            <Section
                id="cleanup"
                eyebrow="05 · Clean up when you leave"
                title="Leaving the page frees the GPU."
                intro="Switch to the plain page and back a few times. Each visit should show the same numbers, and the plain page should show zero open contexts."
            >
                <Ledger visits={visits} />
                <button type="button" className="btn" onClick={onLeave}>
                    Go to the plain page →
                </button>
            </Section>

            <Section
                id="webgpu"
                eyebrow="06 · WebGPU, when a project needs it"
                title="The upgrade path, loaded only on request."
                intro="The new renderer uses WebGPU where the browser has it and falls back to WebGL 2 by itself. Custom looks are written as nodes (TSL) instead of shader strings, and post effects run through a render pipeline."
            >
                {gpu ? (
                    <>
                        <Switch label="Force the WebGL 2 fallback" checked={forceWebGL} onChange={setForceWebGL} hint="What visitors without WebGPU get" />
                        <Suspense fallback={<div className="gpu-card gpu-loading">Loading the WebGPU renderer…</div>}>
                            <WebGPUScene key={String(forceWebGL)} forceWebGL={forceWebGL} />
                        </Suspense>
                    </>
                ) : (
                    <button type="button" className="btn" onClick={() => setGpu(true)}>
                        Load the WebGPU scene
                    </button>
                )}
            </Section>
            <Panel />
        </>
    );
}

function PlainPage({ visits, onBack }: { visits: Visit[]; onBack: () => void }) {
    return (
        <section className="hero plain">
            <p className="eyebrow">Plain page · no 3D here</p>
            <h1 className="hero-title">Nothing left behind.</h1>
            <p className="hero-sub">The 3D page’s scenes, textures and its canvas were disposed when you left. Open contexts should read 0.</p>
            <Ledger visits={visits} />
            <button type="button" className="btn" onClick={onBack}>
                ← Back to the 3D page
            </button>
        </section>
    );
}

export default function App() {
    const [page, setPage] = useState<'3d' | 'plain'>('3d');
    const [visits, setVisits] = useState<Visit[]>([]);
    const go = (next: '3d' | 'plain') => {
        if (page === '3d' && next === 'plain') setVisits((v) => [...v, snapshot(v.length + 1)]);
        setPage(next);
        window.scrollTo(0, 0);
    };
    return (
        <>
            <a className="skip-link" href="#main">
                Skip to content
            </a>
            <header className="topbar">
                <span className="wordmark">3d-web</span>
                <nav aria-label="Pages">
                    <button type="button" className="navlink" aria-current={page === '3d' ? 'page' : undefined} onClick={() => go('3d')}>
                        3D page
                    </button>
                    <button type="button" className="navlink" aria-current={page === 'plain' ? 'page' : undefined} onClick={() => go('plain')}>
                        Plain page
                    </button>
                </nav>
            </header>
            <main id="main">
                {page === '3d' ? (
                    <StageProvider>
                        <Page3D visits={visits} onLeave={() => go('plain')} />
                    </StageProvider>
                ) : (
                    <PlainPage visits={visits} onBack={() => go('3d')} />
                )}
            </main>
            <footer className="footer">3d-web skill demo · placeholder content · three.js r186</footer>
        </>
    );
}
