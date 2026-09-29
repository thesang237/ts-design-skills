import { pageOrder, works } from './works'

export type Direction = 'forward' | 'back'

/**
 * Forward = deeper into the site or further along the nav; back = the opposite.
 * Replace this with whatever "position" means in your own site map.
 */
export function getDirection(from: string, to: string): Direction {
  const fromWork = from.startsWith('/work/')
  const toWork = to.startsWith('/work/')
  if (fromWork && toWork) {
    const index = (path: string) => works.findIndex((w) => path.endsWith(w.id))
    return index(to) >= index(from) ? 'forward' : 'back'
  }
  if (toWork) return 'forward'
  if (fromWork) return 'back'
  return pageOrder.indexOf(to) >= pageOrder.indexOf(from) ? 'forward' : 'back'
}
