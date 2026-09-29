/**
 * One place that maps a "transition type" (chosen at click time) to the CSS class
 * that styles it. The class names are targeted in styles/transitions.css.
 *
 * A single type per navigation keeps things unambiguous.
 * Browser back/forward buttons carry no type, so they get `default`.
 */
export type TransitionStyle = 'fade' | 'slide' | 'curtain'
export type TransitionType = 'fade' | 'slide-forward' | 'slide-back' | 'curtain'

export const TRANSITION_STYLES: Array<{ id: TransitionStyle; label: string; note: string }> = [
  { id: 'fade', label: 'Fade + rise', note: 'Native view transition, CSS only' },
  { id: 'slide', label: 'Directional slide', note: 'Forward / back, native, CSS only' },
  { id: 'curtain', label: 'Curtain (GSAP)', note: 'Choreographed cover, works everywhere' },
]

const toClass = {
  fade: 'pt-fade',
  'slide-forward': 'pt-slide-forward',
  'slide-back': 'pt-slide-back',
  // The curtain animates its own overlay; the native transition must stay quiet.
  curtain: 'none',
} as const

export const viewTransitionProps = {
  enter: { ...toClass, default: 'pt-fade' },
  exit: { ...toClass, default: 'pt-fade' },
  default: 'none',
} as const
