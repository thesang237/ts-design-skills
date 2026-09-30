import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { animate, motion, type PanInfo, useMotionValue } from 'motion/react';

import { useMotionTokens } from '../motion/MotionProvider';

/** One spring, defined once (seconds to visually arrive + bounce), used by CSS and by Motion. */
export function SpringDemo() {
    const { tokens, reduced } = useMotionTokens();
    const spring = { type: 'spring' as const, visualDuration: tokens.springDuration, bounce: tokens.springBounce };
    const trackRef = useRef<HTMLDivElement>(null);
    const [dist, setDist] = useState(0);
    const [on, setOn] = useState(false);

    // Knob travel = track width minus knob width, kept in px so CSS and Motion share it.
    useEffect(() => {
        const el = trackRef.current!;
        const ro = new ResizeObserver(() => setDist(el.clientWidth - 56));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const release = (_: unknown, info: PanInfo) => {
        // The spring starts with the hand's velocity: that is why gestures get springs.
        animate(x, 0, reduced ? { duration: 0 } : { ...spring, velocity: info.velocity.x });
        animate(y, 0, reduced ? { duration: 0 } : { ...spring, velocity: info.velocity.y });
    };

    return (
        <div className="grid-2">
            <article className="card">
                <header className="card-head">
                    <h3 className="card-title">Same curve, two engines</h3>
                    <span className="chip">CSS linear() + Motion</span>
                </header>
                <div className="spring-tracks" style={{ '--dist': `${on ? dist : 0}px` } as CSSProperties}>
                    <div className="spring-label">CSS</div>
                    <div className="spring-track" ref={trackRef}>
                        <div className="spring-knob spring-knob-css" data-knob="css" />
                    </div>
                    <div className="spring-label">Motion</div>
                    <div className="spring-track">
                        <motion.div className="spring-knob" data-knob="motion" animate={{ x: on ? dist : 0 }} transition={spring} />
                    </div>
                </div>
                <div className="demo-row">
                    <button type="button" className="btn btn-sm" onClick={() => setOn((v) => !v)}>
                        Move both
                    </button>
                </div>
                <p className="card-note">
                    The CSS knob uses <code>var(--spring)</code>, a <code>linear()</code> curve that Motion generates from the same two numbers. They should travel together.
                </p>
            </article>

            <article className="card">
                <header className="card-head">
                    <h3 className="card-title">Drag and let go</h3>
                    <span className="chip">Motion</span>
                </header>
                <div className="drag-area">
                    <motion.div
                        className="drag-chip"
                        drag
                        dragMomentum={false}
                        style={{ x, y, touchAction: 'none' }}
                        whileDrag={{ scale: 1.04 }}
                        onDragEnd={release}
                        tabIndex={0}
                        aria-label="Draggable chip. It springs back when released."
                    >
                        Drag me
                    </motion.div>
                </div>
                <p className="card-note">
                    It follows your finger exactly, then springs home carrying the speed of your throw. {tokens.springDuration}s, bounce {tokens.springBounce}: it arrives, barely
                    overshoots, and settles.
                </p>
            </article>
        </div>
    );
}
