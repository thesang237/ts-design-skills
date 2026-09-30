import { type ElementType, useRef, useState } from 'react';

import type { Effect, Split } from '../text/engines';
import { TextEffect, type TextEffectHandle, type Trigger } from '../text/TextEffect';
import { Segmented, Toggle } from './Controls';

type CardProps = {
    title: string;
    tool: string;
    note: string;
    text: string;
    effect: Effect;
    split?: Split;
    splitChoices?: Split[];
    as?: ElementType;
    size: 'xl' | 'lg' | 'md' | 'mono';
    prompt?: string;
};

const TRIGGERS: { value: Exclude<Trigger, 'load'>; label: string }[] = [
    { value: 'scroll-once', label: 'Scroll, once' },
    { value: 'scroll-repeat', label: 'Every time' },
    { value: 'manual', label: 'Manual' },
];

function EffectCard({ title, tool, note, text, effect, split: initialSplit = 'lines', splitChoices, as = 'p', size, prompt }: CardProps) {
    const fx = useRef<TextEffectHandle>(null);
    const [trigger, setTrigger] = useState<Exclude<Trigger, 'load'>>('scroll-once');
    const [split, setSplit] = useState<Split>(initialSplit);
    const [hover, setHover] = useState(true);

    return (
        <article className="card fx-card">
            <header className="card-head">
                <h3 className="card-title">{title}</h3>
                <span className="chip">{tool}</span>
            </header>
            <div className={`fx-stage size-${size}`} data-prompt={prompt ? '' : undefined}>
                {prompt && (
                    <span className="prompt" aria-hidden="true">
                        {prompt}
                    </span>
                )}
                <TextEffect ref={fx} as={as} text={text} effect={effect} split={split} trigger={trigger} hover={hover} />
            </div>
            <p className="card-note">{note}</p>
            <div className="fx-controls">
                <Segmented label="Trigger" value={trigger} options={TRIGGERS} onChange={setTrigger} />
                {splitChoices && (
                    <Segmented label="Split by" value={split} options={splitChoices.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }))} onChange={setSplit} />
                )}
                <div className="fx-actions">
                    <button type="button" className="btn btn-sm" onClick={() => fx.current?.enter()}>
                        Enter
                    </button>
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => fx.current?.exit()}>
                        Exit
                    </button>
                    <Toggle label="Hover" checked={hover} onChange={setHover} />
                </div>
            </div>
        </article>
    );
}

export function TextGallery() {
    return (
        <div className="grid-2">
            <EffectCard
                title="Mask up · lines"
                tool="GSAP SplitText"
                note="Signature heading reveal. Re-splits itself when the font loads or the width changes. Hover: lines roll through the mask."
                text="Every line rises from behind its own edge, then settles without a bounce."
                effect="mask-up"
                split="lines"
                as="h3"
                size="xl"
            />
            <EffectCard
                title="Mask up · words"
                tool="GSAP SplitText"
                note="Words step up at half the item stagger. Good for short headings of one or two lines."
                text="Words slide up through a clean edge."
                effect="mask-up"
                split="words"
                as="h3"
                size="lg"
            />
            <EffectCard
                title="Mask up · characters"
                tool="GSAP SplitText"
                note="Most expressive. Keep it to a short word or two; the whole group is capped at about half a second."
                text="Characters"
                effect="mask-up"
                split="chars"
                as="h3"
                size="xl"
            />
            <EffectCard
                title="Fade up · no mask"
                tool="GSAP SplitText"
                note="Softer: no hard edge, a short rise and a fade. Switch the split to compare."
                text="A gentle rise and fade, no hard edge anywhere."
                effect="fade-up"
                split="words"
                splitChoices={['lines', 'words', 'chars']}
                as="h3"
                size="lg"
            />
            <EffectCard
                title="Fade in · no movement"
                tool="GSAP SplitText"
                note="Opacity only, word by word. Calm, and the closest to what reduced motion shows."
                text="Sometimes the calmest move is no movement at all."
                effect="fade-in"
                split="words"
                as="p"
                size="md"
            />
            <EffectCard
                title="Random ASCII"
                tool="GSAP + custom"
                note="Each letter scrambles for a moment, then settles. Every letter keeps its real width, so the line never jumps. Hover re-scrambles."
                text="SIGNAL ACQUIRED — 128 NODES ONLINE"
                effect="scramble"
                as="p"
                size="mono"
            />
            <EffectCard
                title="Terminal typing"
                tool="GSAP + CSS caret"
                note="Human rhythm: small jitter, pauses after punctuation. The caret is solid while typing and blinks at rest. Exit backspaces."
                text="build complete. 42 pages, no errors, 1.2s."
                effect="type"
                as="p"
                size="mono"
                prompt="$"
            />
        </div>
    );
}
