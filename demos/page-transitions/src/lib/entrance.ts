/**
 * Content entrances (the Motion `Reveal` component) belong to the FIRST load only, after the
 * intro. Every later navigation is owned by the page transition, and the next page's content
 * must not start moving before that transition has ended.
 *
 * Read on first render on both server and client, so the markup matches during hydration.
 */
export const entrance = { armed: true }
