/** For effects started from a browser event or effect; render code uses CSS `motion-reduce:` instead. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
