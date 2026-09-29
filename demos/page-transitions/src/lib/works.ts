// Placeholder content. Swatches are plain CSS gradients: no images, no brands.
export type Work = { id: string; title: string; year: string; from: string; to: string }

const palette: Array<[string, string]> = [
  ['#e8d5c4', '#b08968'],
  ['#c7d3d4', '#4f6d7a'],
  ['#e9c46a', '#e76f51'],
  ['#d8e2dc', '#6b9080'],
  ['#cdb4db', '#5e548e'],
  ['#f4acb7', '#9d8189'],
  ['#bde0fe', '#2a6f97'],
  ['#ffe5d9', '#d08c60'],
  ['#dad7cd', '#588157'],
  ['#e0c3fc', '#8ec5fc'],
  ['#fbc4ab', '#f08080'],
  ['#caffbf', '#3a7d44'],
]

export const works: Work[] = palette.map(([from, to], i) => ({
  id: `study-${String(i + 1).padStart(2, '0')}`,
  title: `Study ${String(i + 1).padStart(2, '0')}`,
  year: String(2019 + (i % 7)),
  from,
  to,
}))

export const getWork = (id: string) => works.find((w) => w.id === id)

/** Order of top-level pages. Used to decide "forward" vs "back" for the slide style. */
export const pageOrder = ['/', '/about', '/journal']
