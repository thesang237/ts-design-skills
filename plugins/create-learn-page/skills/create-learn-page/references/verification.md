# Verification

Run all of these before calling the guide done. A check that prints nothing must be proven to have
run (see the first pitfall).

## 1. Types and lint

```bash
npx tsc --noEmit -p . 2>&1 | grep -E "<GuideFolder>|learn/" ; echo "exit: ${PIPESTATUS[0]}"
npx eslint --fix <guide folder> <route folder>
```
- Don't wrap commands in tools that may not exist (`timeout` isn't on macOS). If filtering output with
  grep, print the real exit code too.
- Fix lint as you write (patterns in `pitfalls.md`), not at the end.

## 2. Every chapter mounts without errors (browser console)

```js
(async () => {
  const errs = [];
  addEventListener('error', (e) => errs.push(e.message));
  const orig = console.error; console.error = (...a) => { errs.push(a.join(' ').slice(0, 200)); orig(...a); };
  const out = {};
  for (const tab of document.querySelectorAll('[data-tab]')) {
    tab.click(); await new Promise((r) => setTimeout(r, 2500));
    const panel = document.querySelector('[role=tabpanel]');
    out[tab.dataset.tab] = { h1: panel.querySelector('h1')?.textContent.slice(0, 30), sections: panel.querySelectorAll('section').length, canvases: panel.querySelectorAll('canvas').length, errors: errs.length };
  }
  console.table(out);
})();
```

## 3. No sideways scroll (phone 375px and desktop 1440px)

```js
(async () => {
  const out = {};
  for (const tab of document.querySelectorAll('[data-tab]')) {
    tab.click(); await new Promise((r) => setTimeout(r, 1500));
    const W = document.documentElement.clientWidth;
    const wide = [...document.querySelectorAll('body *')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.right > W + 2 && !e.closest('[class*="overflow-x-auto"], [class*="overflow-hidden"]');
    }).slice(0, 3).map((e) => `${e.tagName}.${String(e.className).slice(0, 50)}`);
    out[tab.dataset.tab] = { scrollWidth: document.documentElement.scrollWidth, W, wide };
  }
  console.table(out);
})();
```
On a phone the layout viewport grows to fit overflowing content, so fixed bars appear "too wide":
look for the real cause (often an invisible tooltip or a wide table) rather than the fixed element.

## 4. Look at it

- Screenshots of each chapter's demos at 1440px (controls beside) and 375px (controls below), light
  source pages and dark guide.
- Hover a few `Term`s near the right edge; flip a card; answer two quiz questions; press back/forward.
- If the preview pane is unavailable, use a headless browser (Playwright): `page.screenshot()` after
  `page.goto(url)` and a wait, with `colorScheme` and viewport set. For 3D numbers, launch Chromium
  with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist` (macOS) to use the real GPU.

## 5. 3D demos

- Frame times stay near 16.7ms while a demo is on screen; they pause when scrolled away (check with
  a counter in the frame function).
- Switch tabs 5 times and compare JS heap and `renderer.info.memory` (geometries, textures): flat.
- No "Too many active WebGL contexts" warning.
