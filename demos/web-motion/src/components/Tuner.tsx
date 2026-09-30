import { useState } from 'react';

import { useMotionTokens } from '../motion/MotionProvider';
import { EASE_CHOICES } from '../motion/tokens';
import { Slider, Toggle } from './Controls';
import { Curve } from './Presets';

/** Demo-only panel: every value here is a token, and every animation on the page reads it. */
export function Tuner() {
    const { tokens: t, setTokens, resetTokens, reduced, osReduced, forceReduced, setForceReduced, replayAll } = useMotionTokens();
    const [open, setOpen] = useState(false);

    return (
        <aside className="tuner" data-open={open || undefined} aria-label="Motion tuner">
            <button type="button" className="tuner-toggle" aria-expanded={open} aria-controls="tuner-body" onClick={() => setOpen((v) => !v)}>
                <span className="tuner-dot" data-reduced={reduced || undefined} aria-hidden="true" />
                <span>
                    Tune<span className="tuner-long"> motion</span>
                </span>
            </button>
            <div id="tuner-body" className="tuner-body" hidden={!open}>
                <div className="tuner-row">
                    <span className="tuner-label">Main curve</span>
                    <div className="tuner-ease">
                        <Curve b={EASE_CHOICES[t.ease]} size={36} />
                        <code className="token-val">smooth-out · {EASE_CHOICES[t.ease].join(', ')}</code>
                    </div>
                </div>
                <Slider label="Reveal" value={t.reveal} min={300} max={1400} step={50} unit="ms" onChange={(reveal) => setTokens({ reveal })} />
                <Slider label="Rise" value={t.rise} min={0} max={48} step={1} unit="px" onChange={(rise) => setTokens({ rise })} />
                <Slider label="Stagger" value={t.stagger} min={20} max={150} step={5} unit="ms" onChange={(stagger) => setTokens({ stagger })} />
                <Slider label="Exit length" value={t.exitRatio} min={0.3} max={1} step={0.05} unit="×" onChange={(exitRatio) => setTokens({ exitRatio })} />
                <Slider label="Spring time" value={t.springDuration} min={0.2} max={1} step={0.05} unit="s" onChange={(springDuration) => setTokens({ springDuration })} />
                <Slider label="Spring bounce" value={t.springBounce} min={0} max={0.5} step={0.05} onChange={(springBounce) => setTokens({ springBounce })} />
                <Toggle label={`Reduce motion${osReduced ? ' (on in your system)' : ''}`} checked={reduced} disabled={osReduced} onChange={setForceReduced} />
                <div className="tuner-actions">
                    <button type="button" className="btn btn-sm" onClick={replayAll}>
                        Replay all
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm btn-ghost"
                        onClick={() => {
                            resetTokens();
                            if (forceReduced) setForceReduced(false);
                        }}
                    >
                        Reset
                    </button>
                </div>
            </div>
        </aside>
    );
}
