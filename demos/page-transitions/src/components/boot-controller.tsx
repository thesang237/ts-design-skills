'use client'

import { useEffect } from 'react'
import { MIN_VISIBLE_MS, SEEN_KEY } from '@/lib/boot-script'
import { entrance } from '@/lib/entrance'

/** Never wait longer than this for assets. A slow image must not trap the visitor. */
const MAX_WAIT_MS = 4000

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

function whenImageReady(img: HTMLImageElement) {
  const settled = img.complete
    ? Promise.resolve()
    : new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true }) // a broken image must not block
      })
  return settled.then(() => img.decode?.().catch(() => undefined))
}

/** Real work only: fonts, plus images the page marks with data-critical. */
function collectReadiness() {
  const tasks: Promise<unknown>[] = []
  tasks.push(document.fonts?.ready ?? Promise.resolve())
  document.querySelectorAll<HTMLImageElement>('img[data-critical]').forEach((img) => {
    tasks.push(whenImageReady(img))
  })
  try {
    // Demo-only switch to make the loader wait longer than its intro.
    if (localStorage.getItem('pt:demo-slow') === '1') tasks.push(sleep(2500))
  } catch {}
  return tasks
}

/** Resolve when the named CSS animation ends on `el`, or after `fallbackMs`. */
function animationEnd(el: Element | null, name: string, fallbackMs: number) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, fallbackMs)
    el?.addEventListener('animationend', function onEnd(e) {
      if ((e as AnimationEvent).animationName !== name || e.target !== el) return
      el.removeEventListener('animationend', onEnd)
      clearTimeout(timer)
      resolve()
    })
  })
}

async function boot() {
  const root = document.documentElement
  if (!root.dataset.boot) return

  // Ready = real needs met AND the loader has been visible for its full length.
  const ready = Promise.race([Promise.all(collectReadiness()), sleep(MAX_WAIT_MS)])
  const shownAt = (window as unknown as { __bootShownAt?: number }).__bootShownAt
  const minimum = shownAt === undefined ? 0 : Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt))
  await Promise.all([ready, sleep(minimum)])

  const app = document.getElementById('app')
  const loader = document.getElementById('boot-loader')

  // 1. Loader leaves completely (only if it was ever shown)...
  if (root.dataset.loader) {
    root.dataset.boot = 'leaving'
    await animationEnd(loader, 'boot-loader-out', 1500)
  }
  // 2. ...then the page comes in.
  root.dataset.boot = 'entering'
  delete root.dataset.loader
  await animationEnd(app, 'boot-page-in', 1500)

  delete root.dataset.boot // page is ready: entrances may start now
  try {
    sessionStorage.setItem(SEEN_KEY, '1')
  } catch {}
}

export function BootController() {
  useEffect(() => {
    // Entrances are for the first load only. Any later navigation turns them off.
    const disarm = () => {
      entrance.armed = false
    }
    window.addEventListener('popstate', disarm)
    void boot()
    return () => window.removeEventListener('popstate', disarm)
  }, [])
  return null
}
