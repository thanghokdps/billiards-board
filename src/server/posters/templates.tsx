import "server-only";

import { Fragment, type ReactElement, type ReactNode } from "react";

import type { PosterPlayer } from "./data";

export const POSTER_SIZE = { width: 1080, height: 1350 } as const;

// Satori renders outside the page, so CSS variables do not reach it: these mirror the @theme tokens in globals.css.
const C = {
  night: "#0b1410",
  feltDeep: "#0f3a28",
  felt: "#1f6b4a",
  lamp: "#f5c451",
  ball: "#d7263d",
  ivory: "#f3eedc",
  muted: "#b9b29c",
  paper: "#e9dcb8",
  ink: "#2a1d12",
};

const DISPLAY = { fontFamily: "Display", fontWeight: 800 } as const;

function Frame({ children, background }: { children: ReactNode; background?: string }) {
  return (
    <div
      style={{
        ...POSTER_SIZE,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background:
          background ??
          `radial-gradient(ellipse 70% 45% at 50% 0%, rgba(245,196,81,0.35), transparent), linear-gradient(180deg, ${C.feltDeep}, ${C.night})`,
        color: C.ivory,
        fontFamily: "Body",
        padding: 64,
      }}
    >
      {children}
    </div>
  );
}

function Avatar({ player, size, grey }: { player: PosterPlayer; size: number; grey?: boolean }) {
  const ring = {
    width: size,
    height: size,
    borderRadius: size,
    border: `10px solid ${player.ballColor}`,
    display: "flex",
  };
  if (player.avatar) {
    return (
      <img
        src={player.avatar}
        width={size}
        height={size}
        alt=""
        style={{ ...ring, objectFit: "cover", filter: grey ? "grayscale(1)" : undefined }}
      />
    );
  }
  return (
    <div style={{ ...ring, alignItems: "center", justifyContent: "center", background: player.ballColor }}>
      <div
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size,
          background: C.ivory,
          color: C.night,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.26,
          ...DISPLAY,
        }}
      >
        {player.name.slice(0, 1)}
      </div>
    </div>
  );
}

function Brand({ label }: { label: string }) {
  return <div style={{ display: "flex", fontSize: 30, letterSpacing: 8, color: C.lamp, ...DISPLAY }}>{label}</div>;
}

export interface MatchPosterProps {
  brand: string;
  headline: string;
  gameLabel: string;
  dateLabel: string;
  billLabel: string | null;
  sideA: PosterPlayer[];
  sideB: PosterPlayer[];
  scoreA: number | null;
  scoreB: number | null;
  winnerSide: "a" | "b";
  winLabel: string;
  /** Set for a 1v1v1: every player's score, and the loser's label; sideA and sideB then hold winners and loser. */
  threeWay: { scores: { playerId: number; score: number }[]; loserLabel: string } | null;
}

/** Barlow has no ★ glyph, so the winner mark is drawn. */
function Star({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.5l7.1-.6z" fill={C.lamp} />
    </svg>
  );
}

/** Fight-night card: headline from the special reason, both sides, the score as a scoreboard. */
export function MatchPoster(p: MatchPosterProps): ReactElement {
  const threeWay = p.threeWay;
  const side = (players: PosterPlayer[], won: boolean) => (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", width: threeWay ? 310 : 420, gap: 20 }}
    >
      <div style={{ display: "flex", gap: 16 }}>
        {players.map((pl) => (
          <Avatar key={pl.id} player={pl} size={threeWay ? 220 : players.length > 1 ? 180 : 280} grey={!won} />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: threeWay ? 52 : 64,
          textTransform: "uppercase",
          color: won ? C.ivory : C.muted,
          textAlign: "center",
          ...DISPLAY,
        }}
      >
        {players.map((pl) => pl.name).join(" & ")}
      </div>
      {won && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 30,
            color: C.lamp,
            letterSpacing: 6,
            ...DISPLAY,
          }}
        >
          <Star size={30} />
          {p.winLabel}
        </div>
      )}
      {threeWay && !won && (
        <div style={{ display: "flex", fontSize: 30, color: C.ball, letterSpacing: 6, ...DISPLAY }}>
          {threeWay.loserLabel}
        </div>
      )}
    </div>
  );
  const seated = [...p.sideA, ...p.sideB];
  const threeWayScores = threeWay
    ? seated.flatMap((pl) => threeWay.scores.filter((s) => s.playerId === pl.id).map((s) => s.score))
    : [];
  const scores = threeWay ? threeWayScores : [p.scoreA ?? "–", p.scoreB ?? "–"];
  return (
    <Frame>
      <Brand label={p.brand} />
      <div
        style={{
          display: "flex",
          marginTop: 40,
          fontSize: 132,
          lineHeight: 1,
          color: C.lamp,
          textAlign: "center",
          textTransform: "uppercase",
          ...DISPLAY,
        }}
      >
        {p.headline}
      </div>
      <div style={{ display: "flex", marginTop: 16, fontSize: 34, color: C.muted, letterSpacing: 4 }}>
        {p.gameLabel} · {p.dateLabel}
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        {threeWay ? (
          seated.map((pl) => <Fragment key={pl.id}>{side([pl], p.sideA.includes(pl))}</Fragment>)
        ) : (
          <>
            {side(p.sideA, p.winnerSide === "a")}
            <div style={{ display: "flex", fontSize: 72, color: C.ball, ...DISPLAY }}>VS</div>
            {side(p.sideB, p.winnerSide === "b")}
          </>
        )}
      </div>
      {scores.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 40,
            padding: "20px 56px",
            borderRadius: 28,
            background: "rgba(0,0,0,0.55)",
            border: `3px solid rgba(245,196,81,0.4)`,
            fontSize: 140,
            color: C.lamp,
            ...DISPLAY,
          }}
        >
          {scores.map((score, i) => (
            <Fragment key={i}>
              {i > 0 && <span style={{ fontSize: 80, color: C.muted }}>:</span>}
              <span>{score}</span>
            </Fragment>
          ))}
        </div>
      )}
      {p.billLabel && <div style={{ display: "flex", marginTop: 28, fontSize: 36, color: C.ivory }}>{p.billLabel}</div>}
    </Frame>
  );
}

export interface WantedPosterProps {
  title: string;
  subtitle: string;
  rewardLabel: string;
  reward: string;
  player: PosterPlayer;
  crime: string;
  footer: string;
}

/** Old-west WANTED sheet on paper; the bounty is the money paid this month. */
export function WantedPoster(p: WantedPosterProps): ReactElement {
  return (
    <Frame background={`radial-gradient(ellipse at 50% 40%, #f4ead0, ${C.paper} 60%, #cdb98a)`}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: "100%",
          // Satori has no `double` border style: a solid border plus an inset ring draws the same frame.
          border: `6px solid ${C.ink}`,
          boxShadow: `inset 0 0 0 10px ${C.paper}, inset 0 0 0 14px ${C.ink}`,
          padding: 48,
          color: C.ink,
        }}
      >
        <div style={{ display: "flex", fontSize: 190, lineHeight: 1, letterSpacing: 12, ...DISPLAY }}>{p.title}</div>
        <div style={{ display: "flex", fontSize: 40, letterSpacing: 8, marginTop: 8, ...DISPLAY }}>{p.subtitle}</div>
        <div
          style={{ display: "flex", marginTop: 48, padding: 16, border: `6px solid ${C.ink}`, background: "#fff8e6" }}
        >
          <Avatar player={p.player} size={440} grey />
        </div>
        <div style={{ display: "flex", marginTop: 40, fontSize: 104, textTransform: "uppercase", ...DISPLAY }}>
          {p.player.name}
        </div>
        <div style={{ display: "flex", fontSize: 38, marginTop: 4, textAlign: "center" }}>{p.crime}</div>
        <div style={{ display: "flex", flex: 1 }} />
        <div style={{ display: "flex", fontSize: 44, letterSpacing: 6, ...DISPLAY }}>{p.rewardLabel}</div>
        <div style={{ display: "flex", fontSize: 130, lineHeight: 1, color: C.ball, ...DISPLAY }}>{p.reward}</div>
        <div style={{ display: "flex", marginTop: 20, fontSize: 28, opacity: 0.75 }}>{p.footer}</div>
      </div>
    </Frame>
  );
}

export interface RivalryPosterProps {
  brand: string;
  title: string;
  a: PosterPlayer;
  b: PosterPlayer;
  aWins: number;
  bWins: number;
  meetings: string;
}

export function RivalryPoster(p: RivalryPosterProps): ReactElement {
  const fighter = (pl: PosterPlayer, wins: number) => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, width: 440 }}>
      <Avatar player={pl} size={340} />
      <div style={{ display: "flex", fontSize: 76, textTransform: "uppercase", ...DISPLAY }}>{pl.name}</div>
      <div style={{ display: "flex", fontSize: 180, lineHeight: 1, color: C.lamp, ...DISPLAY }}>{wins}</div>
    </div>
  );
  return (
    <Frame
      background={`linear-gradient(115deg, ${p.a.ballColor}55 0%, ${C.night} 45%, ${C.night} 55%, ${p.b.ballColor}55 100%), ${C.night}`}
    >
      <Brand label={p.brand} />
      <div style={{ display: "flex", marginTop: 32, fontSize: 150, lineHeight: 1, color: C.lamp, ...DISPLAY }}>
        {p.title}
      </div>
      <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        {fighter(p.a, p.aWins)}
        <div style={{ display: "flex", fontSize: 96, color: C.ball, ...DISPLAY }}>VS</div>
        {fighter(p.b, p.bWins)}
      </div>
      <div style={{ display: "flex", fontSize: 40, color: C.muted, letterSpacing: 4 }}>{p.meetings}</div>
    </Frame>
  );
}
