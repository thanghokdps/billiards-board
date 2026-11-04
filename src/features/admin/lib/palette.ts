/** The ball colours of the five regulars; players store a hex, so any other colour is allowed too. */
export const BALL_PALETTE = [
  { key: "yellow", hex: "#F5C451" },
  { key: "blue", hex: "#2F7DE1" },
  { key: "red", hex: "#D7263D" },
  { key: "purple", hex: "#8E5BD6" },
  { key: "orange", hex: "#F28C28" },
] as const;

export type PaletteKey = (typeof BALL_PALETTE)[number]["key"];
