/**
 * One messages file per namespace and locale (`messages/<locale>/<namespace>.json`), so each screen owns
 * its own text. Adding a namespace = add both files and its name here.
 */
export const NAMESPACES = [
  "common",
  "nav",
  "home",
  "history",
  "leaderboard",
  "player",
  "money",
  "fame",
  "rivalry",
  "wheel",
  "wrapped",
  "tv",
  "audit",
  "admin",
  "chat",
  "poster",
  "submit",
  "auth",
] as const;

export type Namespace = (typeof NAMESPACES)[number];
