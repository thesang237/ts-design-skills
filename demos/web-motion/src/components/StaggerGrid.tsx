import { useState } from 'react';
import { motion, stagger, type Variants } from 'motion/react';

import { useMotionTokens } from '../motion/MotionProvider';
import { exitMs, mainEase, staggerStep } from '../motion/tokens';
import { Segmented } from './Controls';

const ITEMS = ['Research', 'Direction', 'Identity', 'Interface', 'Prototype', 'Motion', 'Build', 'Launch'];

export function StaggerGrid() {
    const { tokens, replayKey } = useMotionTokens();
    const [mode, setMode] = useState<'once' | 'repeat'>('once');
    const step = staggerStep(tokens, ITEMS.length);
    const ease = [...mainEase(tokens)] as [number, number, number, number];

    const list: Variants = {
        hidden: { transition: { delayChildren: stagger(step * tokens.exitRatio, { from: 'last' }) } },
        show: { transition: { delayChildren: stagger(step) } },
    };
    const item: Variants = {
        // Exit: quicker, accelerating, and in reverse order.
        hidden: { opacity: 0, y: tokens.rise, transition: { duration: exitMs(tokens, tokens.reveal) / 1000, ease: [0.4, 0, 1, 1] } },
        show: { opacity: 1, y: 0, transition: { duration: tokens.reveal / 1000, ease } },
    };

    return (
        <div className="card">
            <header className="card-head">
                <h3 className="card-title">Eight items, {tokens.stagger}ms apart</h3>
                <span className="chip">Motion</span>
            </header>
            <motion.ul key={`${replayKey}-${mode}`} className="stagger-grid" variants={list} initial="hidden" whileInView="show" viewport={{ once: mode === 'once', amount: 0.4 }}>
                {ITEMS.map((label, i) => (
                    <motion.li key={label} className="stagger-item" variants={item}>
                        <span className="stagger-num">{String(i + 1).padStart(2, '0')}</span>
                        {label}
                    </motion.li>
                ))}
            </motion.ul>
            <div className="fx-controls">
                <Segmented
                    label="Repeat"
                    value={mode}
                    options={[
                        { value: 'once', label: 'Scroll, once' },
                        { value: 'repeat', label: 'Every time' },
                    ]}
                    onChange={setMode}
                />
            </div>
            <p className="card-note">
                The last item starts {Math.round(step * 1000 * (ITEMS.length - 1))}ms after the first. A group never takes longer than {tokens.staggerCap}ms to start its last item:
                longer lists space their items closer instead of dragging. Leaving plays faster, in reverse.
            </p>
        </div>
    );
}
