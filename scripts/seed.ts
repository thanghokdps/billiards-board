/**
 * Seeds the five players. With `--demo`, also adds two weeks of sample matches for a
 * local/preview database. Never run `--demo` against production data.
 */
import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { matches, matchPlayers, players, sessions } from "../src/db/schema";

const url = process.env["DATABASE_URL"];
if (!url) throw new Error("DATABASE_URL is not set (see .env.example)");
const pool = new Pool({
  connectionString: url,
  ssl: url.includes("localhost") ? false : { rejectUnauthorized: false },
});
const db = drizzle(pool);

const ROSTER = [
  {
    slug: "then",
    name: "Thén",
    nickname: "Thén Sát Thủ",
    aliases: ["then", "thằng thén"],
    ballColor: "#F5C451",
    ballNumber: 1,
    catchphrase: "Ăn điểm trước, ăn bill sau.",
  },
  {
    slug: "du",
    name: "Dũ",
    nickname: "Dũ Bi Xanh",
    aliases: ["du", "thằng dũ", "dũ ka"],
    ballColor: "#2F7DE1",
    ballNumber: 2,
    catchphrase: "Đánh chậm mà chắc.",
  },
  {
    slug: "bo",
    name: "Bổ",
    nickname: "Bổ Bóp",
    aliases: ["bo", "thằng bổ"],
    ballColor: "#D7263D",
    ballNumber: 3,
    catchphrase: "Kèo này thơm.",
  },
  {
    slug: "hi",
    name: "Hi",
    nickname: "Hi Hú",
    aliases: ["thằng hi", "hí"],
    ballColor: "#8E5BD6",
    ballNumber: 4,
    catchphrase: "Cơ này mới mua.",
  },
  {
    slug: "lam",
    name: "Lâm",
    nickname: "Lâm Béo",
    aliases: ["lam", "lâm béo", "thằng lâm"],
    ballColor: "#F28C28",
    ballNumber: 5,
    catchphrase: "Để tao quay bánh.",
  },
];

await db.insert(players).values(ROSTER).onConflictDoNothing({ target: players.slug });
const all = await db.select().from(players);
console.log(`players: ${all.map((p) => p.name).join(", ")}`);

if (process.argv.includes("--demo")) {
  const ids = all.map((p) => p.id);
  const types = ["3c_real", "3c_fake", "libre"] as const;
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const today = new Date();
  for (let back = 20; back >= 0; back--) {
    const day = new Date(today.getTime() - back * 86_400_000);
    const dow = day.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const dateStr = day.toISOString().slice(0, 10);
    const [session] = await db.insert(sessions).values({ date: dateStr }).onConflictDoNothing().returning();
    if (!session) continue;
    const count = 2 + Math.floor(rand() * 3);
    for (let i = 0; i < count; i++) {
      const shuffled = [...ids].sort(() => rand() - 0.5);
      const is2v2 = rand() < 0.25;
      const sideA = is2v2 ? shuffled.slice(0, 2) : shuffled.slice(0, 1);
      const sideB = is2v2 ? shuffled.slice(2, 4) : shuffled.slice(1, 2);
      const gameType = types[Math.floor(rand() * 3)]!;
      const target = gameType === "libre" ? 40 : 15;
      const winnerSide = rand() < 0.5 ? "a" : "b";
      const loserScore = Math.floor(rand() * (target - 1));
      const playedAt = new Date(`${dateStr}T05:${String(10 + i * 12).padStart(2, "0")}:00Z`);
      const [match] = await db
        .insert(matches)
        .values({
          sessionId: session.id,
          playedAt,
          gameType,
          format: is2v2 ? "2v2" : "1v1",
          scoreA: winnerSide === "a" ? target : loserScore,
          scoreB: winnerSide === "b" ? target : loserScore,
          winnerSide,
          bill: gameType === "3c_real" ? 45_000 : gameType === "3c_fake" ? 30_000 : 50_000,
          tags: rand() < 0.15 ? ["#kèo-thơm"] : [],
        })
        .returning();
      if (!match) continue;
      await db
        .insert(matchPlayers)
        .values([
          ...sideA.map((playerId) => ({ matchId: match.id, playerId, side: "a" as const })),
          ...sideB.map((playerId) => ({ matchId: match.id, playerId, side: "b" as const })),
        ]);
    }
  }
  const [latest] = await db.select({ id: sessions.id }).from(sessions).orderBy(desc(sessions.date)).limit(1);
  const [threeWay] = latest
    ? await db
        .insert(matches)
        .values({
          sessionId: latest.id,
          playedAt: new Date(),
          gameType: "libre",
          format: "1v1v1",
          winnerSide: "a",
          bill: 60_000,
        })
        .returning()
    : [];
  const [first, second, third] = ids;
  if (threeWay && first && second && third) {
    await db.insert(matchPlayers).values([
      { matchId: threeWay.id, playerId: first, side: "a", score: 40 },
      { matchId: threeWay.id, playerId: second, side: "a", score: 32 },
      { matchId: threeWay.id, playerId: third, side: "b", score: 18 },
    ]);
  }
  console.log("demo matches seeded");
}

await pool.end();
