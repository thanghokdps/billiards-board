/** Casual-name matching shared by the agent tools (server) and the wheel (browser). */

export interface NamedPlayer {
  name: string;
  slug: string;
  nickname: string | null;
  aliases?: string[];
}

export function normaliseName(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/^(thang|con|anh|chu|ong|be|em)\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

export type NameResolution<P> =
  { status: "found"; player: P } | { status: "ambiguous"; candidates: P[] } | { status: "unknown" };

const namesOf = (p: NamedPlayer) => [p.name, p.slug, p.nickname ?? "", ...(p.aliases ?? [])].filter(Boolean);

/** Maps "thằng Hi", "Lâm béo", "then" to one player; ambiguous or unknown is returned, never guessed. */
export function resolvePlayerName<P extends NamedPlayer>(name: string, roster: P[]): NameResolution<P> {
  const target = normaliseName(name);
  if (!target) return { status: "unknown" };
  const exact = roster.filter((p) => namesOf(p).some((n) => normaliseName(n) === target));
  if (exact.length === 1) return { status: "found", player: exact[0]! };
  if (exact.length > 1) return { status: "ambiguous", candidates: exact };
  const partial = roster.filter((p) =>
    namesOf(p).some((n) => {
      const key = normaliseName(n);
      return (
        key.length > 1 && (target.startsWith(`${key} `) || key.startsWith(`${target} `) || key === target.split(" ")[0])
      );
    }),
  );
  if (partial.length === 1) return { status: "found", player: partial[0]! };
  if (partial.length > 1) return { status: "ambiguous", candidates: partial };
  return { status: "unknown" };
}
