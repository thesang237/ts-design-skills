'use client'

import { useEffect, useState } from 'react'
import { TRANSITION_STYLES, type TransitionStyle } from '@/lib/transition-types'
import { NO_VT_KEY, SEEN_KEY, STYLE_KEY } from '@/lib/boot-script'

const EASES = [
  { label: 'Smooth out', value: 'cubic-bezier(0.22, 1, 0.36, 1)' },
  { label: 'Soft in-out', value: 'cubic-bezier(0.65, 0, 0.35, 1)' },
  { label: 'Snappy', value: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  { label: 'Linear (for comparison)', value: 'linear' },
]

const read = (key: string, fallback: string) => {
  try {
    return localStorage.getItem(key) ?? fallback
  } catch {
    return fallback
  }
}
const write = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

/** Demo-only controls so you can feel and compare the settings. Not part of the skill's code. */
export function DemoPanel() {
  const [open, setOpen] = useState(true)
  const [style, setStyle] = useState<TransitionStyle>('fade')
  const [dur, setDur] = useState(500)
  const [ease, setEase] = useState(EASES[0].value)
  const [slow, setSlow] = useState(false)
  const [noVt, setNoVt] = useState(false)

  useEffect(() => {
    setStyle(read(STYLE_KEY, 'fade') as TransitionStyle)
    setDur(Number(read('pt:dur', '500')))
    setEase(read('pt:ease', EASES[0].value))
    setSlow(read('pt:demo-slow', '0') === '1')
    setNoVt(read(NO_VT_KEY, '0') === '1')
  }, [])

  const root = () => document.documentElement
  return (
    <aside className="demo-panel" aria-label="Demo controls" data-open={open}>
      <button className="demo-toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        Demo controls
      </button>
      {open && (
        <div className="demo-body">
          <fieldset>
            <legend>Transition style</legend>
            {TRANSITION_STYLES.map((s) => (
              <label key={s.id}>
                <input
                  type="radio"
                  name="style"
                  checked={style === s.id}
                  onChange={() => {
                    setStyle(s.id)
                    root().dataset.ptStyle = s.id
                    write(STYLE_KEY, s.id)
                  }}
                />
                <span>
                  {s.label}
                  <small>{s.note}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="row">
            Duration <output>{dur} ms</output>
            <input
              type="range"
              min={200}
              max={1200}
              step={50}
              value={dur}
              onChange={(e) => {
                const v = Number(e.target.value)
                setDur(v)
                root().style.setProperty('--pt-dur', `${v}ms`)
                write('pt:dur', String(v))
              }}
            />
          </label>
          <label className="row">
            Easing
            <select
              value={ease}
              onChange={(e) => {
                setEase(e.target.value)
                root().style.setProperty('--pt-ease', e.target.value)
                write('pt:ease', e.target.value)
              }}
            >
              {EASES.map((e) => (
                <option key={e.label} value={e.value}>
                  {e.label}
                </option>
              ))}
            </select>
          </label>
          <hr />
          <label className="check">
            <input
              type="checkbox"
              checked={slow}
              onChange={(e) => {
                setSlow(e.target.checked)
                write('pt:demo-slow', e.target.checked ? '1' : '0')
              }}
            />
            Make the loader slow (adds 2.5 s, demo only)
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={noVt}
              onChange={(e) => {
                setNoVt(e.target.checked)
                write(NO_VT_KEY, e.target.checked ? '1' : '0')
                location.reload()
              }}
            />
            Pretend the browser has no view transitions
          </label>
          <button
            className="demo-button"
            onClick={() => {
              try {
                sessionStorage.removeItem(SEEN_KEY)
              } catch {}
              location.reload()
            }}
          >
            Replay the loader
          </button>
        </div>
      )}
    </aside>
  )
}
