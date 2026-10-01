/** Read once and kept live: with reduced motion, swaps are instant and the camera cuts instead of gliding. */
export const motion = { reduced: false };

if (typeof window !== "undefined" && window.matchMedia) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  motion.reduced = mq.matches;
  mq.addEventListener("change", () => (motion.reduced = mq.matches));
}
