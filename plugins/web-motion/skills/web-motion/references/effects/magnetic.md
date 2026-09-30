# Magnetic buttons (opt-in: only when the request names it)

A control leans toward the cursor while it's inside a generous hit area, then settles back when the
cursor leaves. It reads as "this wants to be clicked". Use for a few large, standalone controls
(prev/next arrows, a hero call to action, a round icon button), never for text links or dense UI.

## Values

| Setting | House default | Immersive mode |
| --- | --- | --- |
| Pull (share of the cursor offset followed) | 0.2 | 0.25 |
| Follow | `quickTo`, 0.5s, `ease.out` | same |
| Release | 0.6s `ease.out` (no overshoot) | `elastic.out(1, 0.45)`, 0.8s |
| Hit area | the button plus 16 to 24px padding | same |

## Code

```ts
function magnetic(button: HTMLElement, inner: HTMLElement, pull = 0.2) {
  const xTo = gsap.quickTo(inner, 'x', { duration: 0.5, ease: 'ease.out' })
  const yTo = gsap.quickTo(inner, 'y', { duration: 0.5, ease: 'ease.out' })
  const move = (e: PointerEvent) => {
    const r = button.getBoundingClientRect()                  // read once per event, no writes in between
    xTo((e.clientX - (r.left + r.width / 2)) * pull)
    yTo((e.clientY - (r.top + r.height / 2)) * pull)
  }
  const leave = () => gsap.to(inner, { x: 0, y: 0, duration: 0.6, ease: 'ease.out', overwrite: true })
  button.addEventListener('pointermove', move)
  button.addEventListener('pointerleave', leave)
  return () => { button.removeEventListener('pointermove', move); button.removeEventListener('pointerleave', leave) }
}
```
- Move an **inner** element, not the button: the hit area stays still, so the button can't run away
  from the cursor.
- Pair it with the button's normal hover (ring drawing on, label decode, arrow shaft stretching).

## Rules

- Only with `(hover: hover) and (pointer: fine)`; off for reduced motion (no movement, keep the hover colour).
- Keyboard focus gets the normal focus style, not a magnetic offset.
- One magnetic cluster per screen at most.
