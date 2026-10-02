# Toolkit: watching, measuring and comparing

Small, disposable scripts kept in a git-ignored analysis folder (not in the project's source).

## 1. Contact sheets from a recording

```bash
# overview: one frame every 2 s, 6 per row
ffmpeg -loglevel error -i ref.mp4 -vf "fps=0.5,scale=480:-1,tile=6x6" -frames:v 1 sheet.png
# a transition in detail: 8 frames per second from 44 s to 56 s
ffmpeg -loglevel error -ss 44 -t 12 -i ref.mp4 -vf "fps=8,scale=480:-1,tile=6x8" -frames:v 1 flip.png
# one full-size frame to measure
ffmpeg -loglevel error -ss 104.5 -i ref.mp4 -frames:v 1 frame.png
```

Note any part of the recording that isn't real (a repainted background, a visible cursor).

## 2. Measuring pixels

```python
from PIL import Image
im = Image.open('frame.png').convert('RGB'); px = im.load()
def bbox(x0, y0, x1, y1, is_ink):                 # bounds of matching pixels in a region
    pts = [(x, y) for y in range(y0, y1, 2) for x in range(x0, x1, 2) if is_ink(px[x, y])]
    xs, ys = zip(*pts); return min(xs), min(ys), max(xs), max(ys)
card = bbox(700, 540, 1240, 1000, lambda p: abs(p[0] - p[1]) + abs(p[1] - p[2]) > 60)   # coloured vs white page
```

- Rules (hairlines): scan one row or column for pixels slightly darker than the background.
- Type: measure cap height and line pitch of a heading; derive the font size from the cap height.
- Convert to the page's unit (for a page whose rem = 10px at a 1600px-wide viewport: `u = px / (vw / 160)`).

## 3. The screenshot script (Playwright)

One script, three modes; everything goes through the page's own clock.

- **shots**: for a list of moments, scroll there instantly (through the page's scroll ↔ time
  mapping when it has one), wait for the scene to settle, screenshot. Approach each moment from
  slightly before, so time-based reveals have played.
- **pointer pairs** (`--ptr=0.05,0.15;0.95,0.85`): at each moment, move the pointer to each spot, wait
  ~1.5s for the damping, screenshot. Left vs right must show the intended tilt and parallax.
- **perf**: scroll the whole page at a steady speed, record every frame's duration (p50/p95/p99, max,
  frames over 33ms), with and without 4× CPU slowdown.

Launch flags for a real GPU on macOS: `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`; log
the renderer string so a software fallback is noticed. Expose the page's scroll mapping and
smooth-scroller on `window` only under a debug query flag.

Hover checks: put the pointer on the element, then capture a small clip every ~25ms; the sequence
must show in-between states.

## 4. Side-by-side sheets

Pair each build screenshot with the reference frame of the same moment, labelled, in one image. Look
at the whole sheet first (composition, timing), then crop to details (a corner, an edge) at 4× with
nearest-neighbour scaling to see single pixels.

```python
sheet = Image.new('RGB', (2 * w, rows * (h + 14)))
for i, (mine, ref) in enumerate(pairs):
    sheet.paste(Image.open(mine).resize((w, h)), (0, i * (h + 14) + 14))
    sheet.paste(Image.open(ref).resize((w, h)), (w, i * (h + 14) + 14))
```

## 5. Housekeeping

- Check which dev server is running before starting one (the designer may have their own on another
  port); never stop processes by a broad name pattern.
- Guard shell variables in deletions (`rm -f "${DIR:?}"/*.png`) or write into a fresh folder.
