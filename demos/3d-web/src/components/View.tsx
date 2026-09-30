import { type ReactNode, useEffect, useRef } from 'react';

import type { SceneFactory } from '../stage/Stage';
import { useStage } from '../stage/StageContext';

type Props = {
    id: string;
    factory: SceneFactory;
    /** Which designed still to show when 3D can't run. */
    poster: 'crystals' | 'product' | 'particles';
    posterAlt: string;
    className?: string;
    children?: ReactNode;
};

/**
 * A rectangle in the page where the shared canvas draws a scene. It never owns a canvas:
 * it registers its element with the stage. When 3D can't run, its poster shows instead.
 */
export function View({ id, factory, poster, posterAlt, className = '', children }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const { show, reason, register, stageReady } = useStage();
    const live = show === 'live' && stageReady;

    useEffect(() => {
        if (!live || !ref.current) return;
        return register(id, ref.current, factory); // returns the cleanup that disposes the scene
    }, [live, id, factory, register]);

    return (
        <div ref={ref} className={`view ${className}`} data-live={live}>
            <div className="poster" data-kind={poster} role="img" aria-label={posterAlt} aria-hidden={live}>
                <span className="poster-art" />
                {!live && show === 'poster' && <span className="poster-note">Poster · {reason}</span>}
            </div>
            {children}
        </div>
    );
}
