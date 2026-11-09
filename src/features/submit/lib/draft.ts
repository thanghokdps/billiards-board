import { PLAYERS_IN_FORMAT, type GameType, type PairingFormat } from "@/lib/domain";
import type { PlayerRef } from "@/server/matches/schema";
import type { SubmissionInput } from "@/server/submissions/schema";

/** 1v1 and 2v2 pick a winning side; a 1v1v1 picks the one loser, by seat. */
export type Result = { side: "a" | "b" } | { loser: number };

/** What a score dial changes: a side, or a seat in a 1v1v1. */
export type ScoreTarget = "a" | "b" | number;

export interface Draft {
  gameType: GameType;
  format: PairingFormat;
  /** One entry per seat (player id, or null while empty); a typed guest has a negative id. */
  seats: (number | null)[];
  /** Guests typed on the slate: no database row exists until the admin approves. */
  newGuests: PlayerRef[];
  result: Result | null;
  scoreA: number | null;
  scoreB: number | null;
  /** 1v1v1 only, per seat. */
  scores: (number | null)[];
  bill: number | null;
  note: string;
  submitter: string;
}

export const MAX_BILL = 10_000_000;
export const MAX_SCORE = 999;
const NEW_GUEST_COLORS = ["#8b9bb4", "#a08cb8", "#7fae9d", "#b8a27f", "#b88a8a", "#7f9fb8", "#9aae7f", "#b8947f"];

export function emptyDraft(): Draft {
  return {
    gameType: "3c_real",
    format: "1v1",
    seats: [null, null],
    newGuests: [],
    result: null,
    scoreA: null,
    scoreB: null,
    scores: [null, null, null],
    bill: null,
    note: "",
    submitter: "",
  };
}

export const isNewGuest = (id: number): boolean => id < 0;
export const sameName = (a: string, b: string): boolean => a.trim().toLowerCase() === b.trim().toLowerCase();

export function makeNewGuest(name: string, existing: PlayerRef[]): PlayerRef {
  const id = Math.min(0, ...existing.map((p) => p.id)) - 1;
  return {
    id,
    slug: `new-${-id}`,
    name: name.trim(),
    nickname: null,
    ballColor: NEW_GUEST_COLORS[(-id - 1) % NEW_GUEST_COLORS.length]!,
    ballNumber: 0,
    avatarUrl: null,
    guest: true,
  };
}

/** Which side a seat belongs to; a 1v1v1 has no sides before the loser is picked. */
export function sideOfSeat(format: PairingFormat, index: number): "a" | "b" | null {
  if (format === "1v1v1") return null;
  return index < PLAYERS_IN_FORMAT[format] / 2 ? "a" : "b";
}

export const isFull = (draft: Draft): boolean => draft.seats.every((id) => id !== null);

/** Seat indexes that lose: the other side, or the one picked loser. */
export function loserSeats({ result, format, seats }: Pick<Draft, "result" | "format" | "seats">): number[] {
  if (!result) return [];
  if ("loser" in result) return [result.loser];
  return seats.flatMap((_, i) => (sideOfSeat(format, i) !== result.side ? [i] : []));
}

export function withFormat(draft: Draft, format: PairingFormat): Draft {
  if (format === draft.format) return draft;
  const seated = draft.seats.filter((id) => id !== null);
  const seats = Array.from({ length: PLAYERS_IN_FORMAT[format] }, (_, i) => seated[i] ?? null);
  return { ...draft, format, seats, result: null, scoreA: null, scoreB: null, scores: [null, null, null] };
}

/** Puts a player on `prefer` if it is free, else on the first free seat. A full table ignores the call. */
export function seatPlayer(draft: Draft, id: number, prefer: number | null): Draft {
  const free = draft.seats.findIndex((s) => s === null);
  const at = prefer !== null && draft.seats[prefer] === null ? prefer : free;
  if (at < 0 || draft.seats.includes(id)) return draft;
  return { ...draft, seats: draft.seats.map((s, i) => (i === at ? id : s)), result: null };
}

export function unseat(draft: Draft, index: number): Draft {
  return { ...draft, seats: draft.seats.map((s, i) => (i === index ? null : s)), result: null };
}

/** Removing a typed guest also empties their seat. */
export function removeGuest(draft: Draft, id: number): Draft {
  const seats = draft.seats.map((s) => (s === id ? null : s));
  return { ...draft, seats, newGuests: draft.newGuests.filter((g) => g.id !== id), result: null };
}

/** The seats in the order the server stores them: sideA then sideB; a 1v1v1 stores its two winners, then the loser. */
export function inputOrder(draft: Draft): number[] {
  const all = draft.seats.map((_, i) => i);
  const { result } = draft;
  if (!result || !("loser" in result)) return all;
  return [...all.filter((i) => i !== result.loser), result.loser];
}

/** True when the scores contradict the result (a draw, or the winner behind); the server refuses both. */
export function scoreProblem(draft: Draft): boolean {
  const { result, scoreA, scoreB, scores } = draft;
  if (!result) return false;
  if ("loser" in result) {
    const loser = scores[result.loser];
    return loser != null && scores.some((s, i) => i !== result.loser && s !== null && s <= loser);
  }
  if (scoreA === null || scoreB === null) return false;
  return result.side === "a" ? scoreA <= scoreB : scoreB <= scoreA;
}

/** The seated players split as the server stores them, for titles and the summary strip. */
export function draftSides(draft: Draft, people: PlayerRef[]): { sideA: PlayerRef[]; sideB: PlayerRef[] } {
  const seated = inputOrder(draft).flatMap((i) => people.find((p) => p.id === draft.seats[i]) ?? []);
  const sideSize = draft.format === "1v1v1" ? 2 : seated.length / 2;
  return { sideA: seated.slice(0, sideSize), sideB: seated.slice(sideSize) };
}

export function toInput(draft: Draft, people: PlayerRef[]): SubmissionInput {
  const order = inputOrder(draft);
  const seatOf = (index: number) => {
    const id = draft.seats[index]!;
    const person = people.find((p) => p.id === id);
    return isNewGuest(id) ? { guestName: person?.name ?? "" } : { playerId: id };
  };
  const seats = order.map(seatOf);
  const threeWay = draft.format === "1v1v1";
  const sideSize = threeWay ? 2 : seats.length / 2;
  const anyScore = threeWay ? draft.scores.some((s) => s !== null) : draft.scoreA !== null || draft.scoreB !== null;
  return {
    gameType: draft.gameType,
    format: draft.format,
    sideA: seats.slice(0, sideSize),
    sideB: seats.slice(sideSize),
    winnerSide: threeWay || (draft.result && "side" in draft.result && draft.result.side === "a") ? "a" : "b",
    ...(anyScore && !threeWay && { scoreA: draft.scoreA ?? 0, scoreB: draft.scoreB ?? 0 }),
    ...(anyScore && threeWay && { scores: order.map((i) => draft.scores[i] ?? 0) }),
    ...(draft.bill !== null && { bill: draft.bill }),
    ...(draft.note.trim() && { note: draft.note.trim() }),
    ...(draft.submitter.trim() && { submitter: draft.submitter.trim() }),
  };
}

/** The scene prefilled from a stored submission, for the admin's Edit. */
export function fromInput(input: SubmissionInput): Draft {
  let newGuests: PlayerRef[] = [];
  const idOf = (seat: SubmissionInput["sideA"][number]): number => {
    if ("playerId" in seat) return seat.playerId;
    const known = newGuests.find((g) => sameName(g.name, seat.guestName));
    if (known) return known.id;
    const guest = makeNewGuest(seat.guestName, newGuests);
    newGuests = [...newGuests, guest];
    return guest.id;
  };
  const seats = [...input.sideA, ...input.sideB].map(idOf);
  const threeWay = input.format === "1v1v1";
  return {
    ...emptyDraft(),
    gameType: input.gameType,
    format: input.format,
    seats,
    newGuests,
    result: threeWay ? { loser: 2 } : { side: input.winnerSide },
    scoreA: input.scoreA ?? null,
    scoreB: input.scoreB ?? null,
    scores: [0, 1, 2].map((i) => input.scores?.[i] ?? null),
    bill: input.bill ?? null,
    note: input.note ?? "",
    submitter: input.submitter ?? "",
  };
}
