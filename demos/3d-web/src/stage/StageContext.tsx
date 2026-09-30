import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { type Mode, type SceneFactory, Stage, type Stats } from './Stage';
import { hasWebGL2, initialTier, type LiveTier, type Tier } from './tiers';

export type TierChoice = 'auto' | Tier;

type StageApi = {
    /** What the views should show: live 3D, or the poster (and why). */
    show: 'live' | 'poster';
    reason: string;
    tier: Tier;
    tierChoice: TierChoice;
    setTierChoice: (t: TierChoice) => void;
    stats: Stats | null;
    mode: Mode;
    stress: boolean;
    setStress: (v: boolean) => void;
    simReduced: boolean;
    setSimReduced: (v: boolean) => void;
    simNoWebGL: boolean;
    setSimNoWebGL: (v: boolean) => void;
    loseContext: () => void;
    restoreContext: () => void;
    register: (id: string, el: HTMLElement, factory: SceneFactory) => () => void;
    stageReady: boolean;
};

const Ctx = createContext<StageApi | null>(null);

export function useStage() {
    const v = useContext(Ctx);
    if (!v) throw new Error('useStage outside <StageProvider>');
    return v;
}

const reducedQuery = () => window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Owns the one Stage for this page. Decides live vs poster from support, reduced motion,
 * context state and the tier, and tears everything down when the page unmounts.
 */
export function StageProvider({ children }: { children: ReactNode }) {
    const [start] = useState<LiveTier>(initialTier);
    const [supported] = useState(hasWebGL2);
    const [osReduced, setOsReduced] = useState(() => reducedQuery().matches);
    const [simReduced, setSimReduced] = useState(false);
    const [simNoWebGL, setSimNoWebGL] = useState(false);
    const [tierChoice, setTierChoiceState] = useState<TierChoice>('auto');
    const [tier, setTier] = useState<Tier>(start);
    const [stats, setStats] = useState<Stats | null>(null);
    const [mode, setMode] = useState<Mode>('live');
    const [stress, setStressState] = useState(false);
    const [stage, setStage] = useState<Stage | null>(null);
    const stageRef = useRef<Stage | null>(null);

    // read reduced motion live: people change it while the page is open
    useEffect(() => {
        const q = reducedQuery();
        const on = () => setOsReduced(q.matches);
        q.addEventListener('change', on);
        return () => q.removeEventListener('change', on);
    }, []);

    const reduced = osReduced || simReduced;
    const canRun = supported && !simNoWebGL && !reduced;

    // create / destroy the stage
    useEffect(() => {
        if (!canRun) return;
        const s = new Stage(start, {
            onStats: setStats,
            onMode: setMode,
            onTier: (next) => {
                setTier(next);
                if (next !== 'poster') stageRef.current?.applyTier(next);
            },
        });
        stageRef.current = s;
        setStage(s);
        setTier(start);
        return () => {
            s.dispose();
            stageRef.current = null;
            setStage(null);
            setStats(null);
            setMode('live');
        };
    }, [canRun, start]);

    const setTierChoice = useCallback(
        (t: TierChoice) => {
            setTierChoiceState(t);
            const s = stageRef.current;
            if (!s) return;
            if (t === 'auto') {
                s.setAuto(true, start);
                setTier(start);
                s.applyTier(start);
            } else {
                s.setAuto(false);
                setTier(t);
                if (t !== 'poster') s.applyTier(t);
            }
        },
        [start],
    );

    const setStress = useCallback((v: boolean) => {
        setStressState(v);
        if (stageRef.current) stageRef.current.stress = v;
    }, []);

    const register = useCallback((id: string, el: HTMLElement, factory: SceneFactory) => stageRef.current?.add(id, el, factory) ?? (() => {}), []);

    let show: 'live' | 'poster' = 'live';
    let reason = '';
    if (!supported) [show, reason] = ['poster', 'WebGL 2 is not available in this browser'];
    else if (simNoWebGL) [show, reason] = ['poster', 'Pretending WebGL is missing'];
    else if (reduced) [show, reason] = ['poster', osReduced ? 'Reduced motion is on in your system settings' : 'Pretending reduced motion is on'];
    else if (mode === 'lost') [show, reason] = ['poster', 'The GPU context was lost; waiting to restore'];
    else if (tier === 'poster') [show, reason] = ['poster', tierChoice === 'auto' ? 'Too slow even on the low tier' : 'Poster chosen'];

    // poster on screen → the stage stops rendering entirely
    useEffect(() => {
        if (stage) stage.paused = show === 'poster';
    }, [stage, show]);

    const api = useMemo<StageApi>(
        () => ({
            show,
            reason,
            tier,
            tierChoice,
            setTierChoice,
            stats,
            mode,
            stress,
            setStress,
            simReduced,
            setSimReduced,
            simNoWebGL,
            setSimNoWebGL,
            loseContext: () => stageRef.current?.loseContext(),
            restoreContext: () => stageRef.current?.restoreContext(),
            register,
            stageReady: !!stage,
        }),
        [show, reason, tier, tierChoice, setTierChoice, stats, mode, stress, setStress, simReduced, simNoWebGL, register, stage],
    );

    return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
