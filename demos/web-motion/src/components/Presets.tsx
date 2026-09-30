import { useState } from 'react';

import { useMotionTokens } from '../motion/MotionProvider';
import { type Bezier, EASES, exitMs, mainEase } from '../motion/tokens';

export function Curve({ b, size = 44 }: { b: Bezier; size?: number }) {
    const [x1, y1, x2, y2] = b;
    const p = (x: number, y: number) => `${(x * 100).toFixed(1)},${((1 - y) * 100).toFixed(1)}`;
    return (
        <svg className="curve" width={size} height={size} viewBox="-6 -6 112 112" aria-hidden="true">
            <path d="M0,100 L100,0" className="curve-diag" />
            <path d={`M0,100 C${p(x1, y1)} ${p(x2, y2)} 100,0`} className="curve-line" />
        </svg>
    );
}

export function Presets() {
    const { tokens: t } = useMotionTokens();
    const [on, setOn] = useState(false);
    const ease = mainEase(t);

    const eases: { name: string; b: Bezier; use: string }[] = [
        { name: 'ease-out', b: ease, use: 'Anything entering or answering a click' },
        { name: 'ease-in-out', b: EASES.inOut, use: 'Something on screen moving from A to B' },
        { name: 'ease-in', b: EASES.in, use: 'Short exits only' },
    ];
    const durations = [
        { name: 'fast', ms: t.fast, use: 'Press, hover colour, small toggles' },
        { name: 'base', ms: t.base, use: 'Menus, tooltips, popovers' },
        { name: 'slow', ms: t.slow, use: 'Modals, drawers, showcase hovers' },
        { name: 'reveal', ms: t.reveal, use: 'Content arriving on scroll' },
    ];

    return (
        <div className="grid-2">
            <div className="card">
                <header className="card-head">
                    <h3 className="card-title">Curves</h3>
                    <span className="chip">--ease-*</span>
                </header>
                <ul className="token-list">
                    {eases.map((e) => (
                        <li key={e.name}>
                            <Curve b={e.b} />
                            <div>
                                <code>{e.name}</code>
                                <span className="token-val">{e.b.join(', ')}</span>
                                <span className="token-use">{e.use}</span>
                            </div>
                        </li>
                    ))}
                </ul>
                <p className="card-note">
                    Also: rise {t.rise}px · lift {t.lift}px · stagger {t.stagger}ms (max {t.staggerCap}ms per group) · press {t.press} · exits take {Math.round(t.exitRatio * 100)}%
                    of the entrance · gesture spring {t.springDuration}s, bounce {t.springBounce}.
                </p>
            </div>

            <div className="card">
                <header className="card-head">
                    <h3 className="card-title">Durations</h3>
                    <span className="chip">--dur-*</span>
                </header>
                <ul className="lab" data-on={on || undefined}>
                    {durations.map((d) => (
                        <li key={d.name} style={{ ['--d' as string]: `${on ? d.ms : exitMs(t, d.ms)}ms` }}>
                            <div className="lab-head">
                                <code>{d.name}</code>
                                <span className="token-val">{d.ms}ms</span>
                                <span className="token-use">{d.use}</span>
                            </div>
                            <div className="lab-track">
                                <span className="lab-dot" />
                            </div>
                        </li>
                    ))}
                </ul>
                <div className="demo-row">
                    <button type="button" className="btn btn-sm" onClick={() => setOn((v) => !v)}>
                        {on ? 'Send back (exit timing)' : 'Play all four'}
                    </button>
                </div>
            </div>
        </div>
    );
}
