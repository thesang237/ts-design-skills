import { useEffect, useState } from 'react';

import { contextCounter, lastSeen } from '../stage/Stage';

export type Visit = { n: number; geometries: number; textures: number; programs: number; heapMB: number | null };

const heap = () => {
    const m = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    return m ? Math.round(m.usedJSHeapSize / 1e6) : null;
};

/** Snapshot of the stage when leaving the 3D page — called by the page switcher. */
export function snapshot(n: number): Visit {
    const s = lastSeen.stats;
    return { n, geometries: s?.geometries ?? 0, textures: s?.textures ?? 0, programs: s?.programs ?? 0, heapMB: heap() };
}

/** Live context count + one row per visit. Flat rows = nothing leaks. */
export function Ledger({ visits }: { visits: Visit[] }) {
    const [now, setNow] = useState({ open: contextCounter.open, created: contextCounter.created, heapMB: heap() });
    useEffect(() => {
        const id = window.setInterval(() => setNow({ open: contextCounter.open, created: contextCounter.created, heapMB: heap() }), 500);
        return () => window.clearInterval(id);
    }, []);

    return (
        <div className="ledger">
            <div className="ledger-now">
                <div>
                    <b>{now.open}</b>
                    <span>WebGL contexts open now</span>
                </div>
                <div>
                    <b>{now.created}</b>
                    <span>created since load</span>
                </div>
                <div>
                    <b>{now.heapMB ?? 'n/a'}</b>
                    <span>JS heap (MB, Chromium)</span>
                </div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Visit to the 3D page</th>
                        <th>geometries</th>
                        <th>textures</th>
                        <th>shader programs</th>
                        <th>heap MB when leaving</th>
                    </tr>
                </thead>
                <tbody>
                    {visits.length ? (
                        visits.map((v) => (
                            <tr key={v.n}>
                                <td>#{v.n}</td>
                                <td>{v.geometries}</td>
                                <td>{v.textures}</td>
                                <td>{v.programs}</td>
                                <td>{v.heapMB ?? 'n/a'}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5}>Switch pages a few times; each visit adds a row. The numbers should stay the same.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
