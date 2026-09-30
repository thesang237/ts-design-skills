import { useState } from 'react';

import { type TierChoice, useStage } from '../stage/StageContext';

const CHOICES: TierChoice[] = ['auto', 'high', 'mid', 'low', 'poster'];

export function TierPicker() {
    const { tierChoice, setTierChoice } = useStage();
    return (
        <div className="segmented" role="radiogroup" aria-label="Quality tier">
            {CHOICES.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={tierChoice === c} onClick={() => setTierChoice(c)}>
                    {c}
                </button>
            ))}
        </div>
    );
}

export function Switch({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
    return (
        <label className="switch">
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
            <span className="switch-track" aria-hidden="true" />
            <span className="switch-label">
                {label}
                {hint && <small>{hint}</small>}
            </span>
        </label>
    );
}

/** Fixed panel: what the stage is doing right now, plus the quality control. */
export function Panel() {
    const { stats, tier, show, reason, stress, setStress } = useStage();
    // open on wide screens, collapsed on phones (it would cover half the page)
    const [open, setOpen] = useState(() => window.matchMedia('(min-width: 640px)').matches);
    return (
        <aside className={`panel ${open ? 'is-open' : ''}`} aria-label="Stage status">
            <button type="button" className="panel-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
                <span className={`dot ${show === 'live' ? 'is-live' : ''}`} aria-hidden="true" />
                {show === 'live' ? `Live · ${tier}` : 'Poster'}
                <span className="panel-caret" aria-hidden="true">
                    {open ? '–' : '+'}
                </span>
            </button>
            {open && (
                <div className="panel-body">
                    <dl className="stats">
                        <div>
                            <dt>fps</dt>
                            <dd>{stats?.fps ?? '–'}</dd>
                        </div>
                        <div>
                            <dt>frame</dt>
                            <dd>{stats ? `${stats.frameMs}ms` : '–'}</dd>
                        </div>
                        <div>
                            <dt>draw calls</dt>
                            <dd>{stats?.calls ?? '–'}</dd>
                        </div>
                        <div>
                            <dt>triangles</dt>
                            <dd>{stats ? `${Math.round(stats.triangles / 1000)}k` : '–'}</dd>
                        </div>
                        <div>
                            <dt>pixel ratio</dt>
                            <dd>{stats?.dpr ?? '–'}</dd>
                        </div>
                        <div>
                            <dt>views</dt>
                            <dd>{stats?.views ?? 0}</dd>
                        </div>
                        <div>
                            <dt>geometries</dt>
                            <dd>{stats?.geometries ?? 0}</dd>
                        </div>
                        <div>
                            <dt>textures</dt>
                            <dd>{stats?.textures ?? 0}</dd>
                        </div>
                    </dl>
                    {show === 'poster' && <p className="panel-note">{reason}</p>}
                    <p className="panel-label">Quality</p>
                    <TierPicker />
                    <Switch label="Simulate a slow device" checked={stress} onChange={setStress} hint="With Auto, watch it step down" />
                </div>
            )}
        </aside>
    );
}
