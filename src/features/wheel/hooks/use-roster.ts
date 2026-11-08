import { useEffect, useMemo, useState } from "react";

import type { PlayerRef } from "@/server/matches/schema";

import { makeTempGuest } from "../lib/temp-guest";

/** How long a just-added tile keeps its highlight; the refresh that brings a saved guest in must land inside it. */
const ARRIVAL_MS = 2500;

/**
 * Who is on the wheel screen: the saved players (members first, then guests), the viewer's temporary guests,
 * and who is sitting out. Tracking who rests, not who plays, means a guest that arrives with the next server
 * refresh is on the wheel without any state being set during render.
 */
export function useRoster(saved: PlayerRef[]) {
  const [temps, setTemps] = useState<PlayerRef[]>([]);
  const [rested, setRested] = useState<number[]>([]);
  const [arrivedId, setArrivedId] = useState<number | null>(null);

  const roster = useMemo(
    () => [...saved.filter((p) => !p.guest), ...saved.filter((p) => p.guest), ...temps],
    [saved, temps],
  );
  const included = useMemo(() => roster.filter((p) => !rested.includes(p.id)).map((p) => p.id), [roster, rested]);

  useEffect(() => {
    if (arrivedId === null) return;
    const timer = setTimeout(() => setArrivedId(null), ARRIVAL_MS);
    return () => clearTimeout(timer);
  }, [arrivedId]);

  const include = (id: number) => setRested((ids) => ids.filter((x) => x !== id));

  return {
    roster,
    included,
    arrivedId,
    toggle: (id: number) => setRested((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])),
    include,
    /** A saved guest came back from the server: on the wheel, with the arrival animation. */
    markSaved: (id: number) => {
      include(id);
      setArrivedId(id);
    },
    addTemp: (name: string) => {
      const guest = makeTempGuest(name, temps);
      setTemps([...temps, guest]);
      setArrivedId(guest.id);
    },
    removeTemp: (id: number) => setTemps((all) => all.filter((p) => p.id !== id)),
  };
}
