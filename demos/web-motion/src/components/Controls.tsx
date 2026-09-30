import { useId } from 'react';

type Option<T extends string> = { value: T; label: string };

/** Native radio buttons styled as a segmented control: keyboard and screen readers for free. */
export function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: Option<T>[]; onChange: (v: T) => void }) {
    const name = useId();
    return (
        <fieldset className="seg">
            <legend className="sr-only">{label}</legend>
            {options.map((o) => (
                <label key={o.value} className="seg-item">
                    <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
                    <span>{o.label}</span>
                </label>
            ))}
        </fieldset>
    );
}

export function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <label className="toggle" data-disabled={disabled || undefined}>
            <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
            <span className="toggle-track" aria-hidden="true" />
            <span>{label}</span>
        </label>
    );
}

export function Slider({
    label,
    value,
    min,
    max,
    step,
    unit = '',
    onChange,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    unit?: string;
    onChange: (v: number) => void;
}) {
    const id = useId();
    return (
        <div className="slider">
            <label htmlFor={id}>{label}</label>
            <output htmlFor={id}>
                {value}
                {unit}
            </output>
            <input id={id} type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        </div>
    );
}
