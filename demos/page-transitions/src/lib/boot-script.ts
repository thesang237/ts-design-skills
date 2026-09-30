/**
 * Inline script that runs before first paint, before React exists.
 *
 * Boot states on <html data-boot="...">, in order. Each one finishes before the next starts,
 * so the loader and the page are never visible at the same time:
 *   intro     loader visible, page hidden
 *   leaving   loader plays its exit, page still hidden
 *   entering  page fades in, loader gone
 *   (absent)  page is visible, entrances (Reveal) may play
 *
 * Two ways to run the loader, chosen with the two constants below:
 *   Intro (fixed length, once per session):  SHOW_AFTER_MS = 0,   MIN_VISIBLE_MS = the intro's length
 *   Only when slow:                          SHOW_AFTER_MS = 200, MIN_VISIBLE_MS = 0
 * This demo uses the intro, at the designer's request.
 */
export const SHOW_AFTER_MS = 0
/** The loader stays visible at least this long: the full length of its animation, never under 400ms. */
export const MIN_VISIBLE_MS = 1400
export const SEEN_KEY = 'pt:boot-seen'
export const STYLE_KEY = 'pt:style'
export const NO_VT_KEY = 'pt:no-view-transitions'

export const bootScript = `(function(){
  var d = document.documentElement;
  try {
    var s = localStorage.getItem(${JSON.stringify(STYLE_KEY)});
    if (s) d.dataset.ptStyle = s;
    var dur = localStorage.getItem('pt:dur'); if (dur) d.style.setProperty('--pt-dur', dur + 'ms');
    var ease = localStorage.getItem('pt:ease'); if (ease) d.style.setProperty('--pt-ease', ease);
    if (localStorage.getItem(${JSON.stringify(NO_VT_KEY)}) === '1') {
      // Demo switch: pretend this browser has no View Transitions API.
      document.startViewTransition = undefined;
    }
    if (sessionStorage.getItem(${JSON.stringify(SEEN_KEY)})) return;
  } catch (e) {}
  d.style.setProperty('--boot-min', ${MIN_VISIBLE_MS} + 'ms');
  function show() { d.dataset.boot = 'intro'; d.dataset.loader = 'on'; window.__bootShownAt = performance.now(); }
  if (${SHOW_AFTER_MS} === 0) { show(); return; }
  d.dataset.boot = 'pending';
  setTimeout(function(){ if (d.dataset.boot === 'pending') show(); }, ${SHOW_AFTER_MS});
})();`
