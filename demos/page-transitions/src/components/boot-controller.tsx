'use client'

import { useEffect } from 'react'
import { SEEN_KEY } from '@/lib/boot-script'

/** Never wait longer than this for assets. A slow image must not trap the visitor. */
const MAX_WAIT_MS = 4000
/**
 * Only applies when the loader is already visible: keeps it from flashing for a
 * few frames. 0 = off (no artificial time at all). Ask the designer before raising it.
 */
const MIN_VISIBLE_MS = 0

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
    // Demo-only switch to make the loader visible on a fast connection.
    if (localStorage.getItem('pt:demo-slow') === '1') tasks.push(sleep(2500))
  } catch {}
  return tasks
}

async function boot() {
  const root = document.documentElement
  if (!root.dataset.boot) return

  const tasks = collectReadiness()
  let done = 0
  const setProgress = (n: number) => root.style.setProperty('--boot-progress', String(n / tasks.length))
  setProgress(0)
  tasks.forEach((t) => t.finally(() => setProgress(++done)))

  await Promise.race([Promise.all(tasks), sleep(MAX_WAIT_MS)])

  const shownAt = (window as unknown as { __bootSlowAt?: number }).__bootSlowAt
  if (root.dataset.loader && shownAt !== undefined) {
    await sleep(Math.max(0, MIN_VISIBLE_MS - (performance.now() - shownAt)))
  }

  root.dataset.boot = 'leaving'
  const finish = () => {
    delete root.dataset.boot
    delete root.dataset.loader
    try {
      sessionStorage.setItem(SEEN_KEY, '1')
    } catch {}
  }
  const app = document.getElementById('app')
  const onEnd = (e: AnimationEvent) => {
    if (e.target === app && e.animationName === 'boot-page-in') finish()
  }
  app?.addEventListener('animationend', onEnd)
  setTimeout(finish, 1200) // safety net: never leave the page hidden
}

export function BootController() {
  useEffect(() => {
    void boot()
  }, [])
  return null
}
