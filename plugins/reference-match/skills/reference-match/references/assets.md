# Assets: identify, place, and fill the gaps

## Identify before wiring

| Asset | Debug view | Look for |
| --- | --- | --- |
| glTF scene (`.glb`) | Render it from its own camera, unlit, with the node list (name, draw order, texture size, depth) and a pointer to move the camera | Painted planes at depths (parallax art), head meshes with projected paint, a baked camera clip (its duration), effect planes with **no texture** (they play a flipbook) |
| Sprite sheet (KTX2/WebP + TexturePacker JSON) | Lay out every Nth frame in a grid on a checker background | What it animates, frame size, whether frames are **trimmed** (`spriteSourceSize`), the last useful frame |
| Texture without JSON | Show it with its alpha; detect the grid from alpha runs along x and y | Cell size and padding |
| After Effects / Lottie JSON | List compositions, layers and keyframes | Positions and scales over time you can copy as numbers |
| Saved HTML | Search inline SVGs and `<style>` blocks | Real logos and icons (paths), button shapes, the page's unit and type scale |

Keep a table: file → content → where it's used → or why it's unused.

Compare new files with ones already copied (`cmp`) so duplicates aren't wired twice.

## Placeholders

When art is missing, placeholders keep the **right shapes, layers and colours** (so motion and
composition can be judged) and each layer carries a short art brief: subject, framing, depth,
aspect, transparency. Swapping in real art should be one field per layer.

## Generating art that fits the set

- Briefs describe **original** characters and places in the reference's style, never copies.
- One shared prompt frame (composition, crop, style, background), with only the subject varying, so
  the set reads as one series.
- Generate several at once (in parallel, a few at a time), review them as a contact sheet, then crop
  to the set's aspect.
- If the reference images have a baked shape (a notched card cut-out), **reuse that alpha mask** on
  the generated images so they match exactly.
