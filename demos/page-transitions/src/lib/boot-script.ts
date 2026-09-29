/**
 * Inline script that runs before first paint, before React exists.
 *
 * Boot states on <html data-boot="...">:
 *   pending  page is hidden, nothing else is shown yet (first ~SHOW_AFTER_MS)
 *   slow     still not ready after SHOW_AFTER_MS, so the loader is visible
 *   leaving  ready, loader is playing its exit
 *   (absent) page is visible
 *
 * The loader is only shown when loading is actually slow. If everything is ready
 * inside SHOW_AFTER_MS the visitor never sees it and there is no artificial wait.
 */
export const SHOW_AFTER_MS = 200
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
  d.dataset.boot = 'pending';
  setTimeout(function(){
    if (d.dataset.boot === 'pending') { d.dataset.boot = 'slow'; d.dataset.loader = 'on'; window.__bootSlowAt = performance.now(); }
  }, ${SHOW_AFTER_MS});
})();`
