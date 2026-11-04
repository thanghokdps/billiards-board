"use client";

import { Download, ExternalLink } from "lucide-react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { Bar, BarChart, LabelList, Rectangle, ResponsiveContainer, XAxis, YAxis, type BarShapeProps } from "recharts";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { MatchRow } from "@/components/ui/match-row";
import { Skeleton } from "@/components/ui/misc";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { useChat } from "@/features/shell";
import { WheelPanel } from "@/features/wheel";
import type {
  HeadToHeadResult,
  NameProblem,
  NeedsInput,
  PosterResult,
  StatsResult,
  WheelSetup,
} from "@/lib/agent-results";
import { formatCompactVnd, formatVnd } from "@/lib/domain";

import { useSend } from "../lib/send-context";

/** One question, answered by tapping a chip (requirement: missing info → exactly one question). */
export function AskChips({ result }: { result: NeedsInput | NameProblem }) {
  const t = useTranslations("chat.ask");
  const send = useSend();
  const [picked, setPicked] = useState<string | null>(null);
  const question =
    result.status === "needs_input"
      ? t(result.question)
      : t(result.status === "ambiguous_player" ? "ambiguous" : "unknown", { name: result.name });
  const options =
    result.status === "needs_input"
      ? (result.options ?? []).map((o) => ({ label: o.label, reply: o.label }))
      : result.candidates.map((p) => ({ label: p.name, reply: `${result.name} = ${p.name}` }));
  return (
    <div className="my-2">
      <p className="mb-2 text-sm font-semibold text-ivory-muted">{question}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip
            key={o.label}
            selected={picked === o.label}
            disabled={picked !== null}
            onClick={() => {
              setPicked(o.label);
              send(o.reply);
            }}
          >
            {o.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function formatValue(unit: StatsResult["unit"], value: number, locale: string): string {
  if (unit === "vnd") return formatCompactVnd(value, locale);
  if (unit === "percent") return `${value}%`;
  if (unit === "streak") return value > 0 ? `🔥${value}` : value < 0 ? `🧊${-value}` : "0";
  return String(value);
}

/** Answer + mini bar chart in the chat (query_stats). */
export function StatsCard({ result }: { result: StatsResult }) {
  const locale = useLocale();
  const t = useTranslations("chat.stats");
  const rows = result.rows.map((r) => ({
    ...r,
    display: formatValue(result.unit, r.value, locale),
    plot: Math.max(Math.abs(r.value), 0.0001),
  }));
  const top = rows[0];
  return (
    <Card className="my-2 p-3">
      {top && result.unit === "vnd" && <p className="mb-1 text-xs text-ivory-muted">{formatVnd(top.value, locale)}</p>}
      <div style={{ height: Math.max(rows.length * 34, 80) }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={64}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--color-ivory-muted)", fontSize: 13, fontWeight: 700 }}
            />
            <Bar
              dataKey="plot"
              radius={[0, 6, 6, 0]}
              barSize={18}
              isAnimationActive
              shape={(props: BarShapeProps) => (
                <Rectangle {...props} fill={(props.payload as { color: string }).color} />
              )}
            >
              <LabelList
                dataKey="display"
                position="right"
                style={{ fill: "var(--color-ivory)", fontSize: 13, fontWeight: 800, fontFamily: "var(--font-display)" }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-right text-2xs text-ivory-faint">{t("matches", { count: result.matchCount })}</p>
    </Card>
  );
}

export function HeadToHeadCard({ result }: { result: HeadToHeadResult }) {
  const t = useTranslations("chat.h2h");
  const aShare = result.played ? result.aWins / result.played : 0.5;
  return (
    <Card className="my-2 overflow-hidden">
      <div className="felt flex items-center justify-between gap-2 px-4 py-4">
        <Fighter player={result.a} wins={result.aWins} />
        <span className="font-display text-2xl font-bold text-lamp">VS</span>
        <Fighter player={result.b} wins={result.bWins} align="right" />
      </div>
      <div className="px-4 pt-3">
        <div className="flex h-2 overflow-hidden rounded-full bg-surface-3" aria-hidden>
          <span style={{ width: `${aShare * 100}%`, background: result.a.ballColor }} />
          <span className="flex-1" style={{ background: result.b.ballColor }} />
        </div>
        <p className="mt-1.5 text-center text-xs text-ivory-muted">{t("meetings", { count: result.played })}</p>
      </div>
      <div className="divide-y divide-line px-3">
        {result.recent.map((m) => (
          <MatchRow key={m.id} match={m} compact />
        ))}
      </div>
    </Card>
  );
}

function Fighter({ player, wins, align }: { player: HeadToHeadResult["a"]; wins: number; align?: "right" }) {
  return (
    <div className={align === "right" ? "flex flex-col items-end gap-1" : "flex flex-col items-start gap-1"}>
      <PlayerAvatar player={player} size="lg" />
      <p className="font-bold">{player.name}</p>
      <p className="digits text-score font-bold text-lamp digits-glow">{wins}</p>
    </div>
  );
}

export function WheelCard({ result }: { result: WheelSetup }) {
  const t = useTranslations("wheel");
  const chat = useChat();
  const weights = Object.fromEntries(result.participants.map((p) => [p.player.id, p.weight]));
  return (
    <Card className="my-2 p-3">
      <WheelPanel
        compact
        mode={result.mode}
        players={result.participants.map((p) => p.player)}
        weights={weights}
        pairingActions={(pairing) => (
          <Button
            variant="felt"
            size="sm"
            onClick={() =>
              chat.open(
                t("createMatchPrompt", {
                  sideA: pairing.sideA.map((p) => p.name).join(" & "),
                  sideB: pairing.sideB.map((p) => p.name).join(" & "),
                }),
                "prefill",
              )
            }
          >
            {t("createMatch")}
          </Button>
        )}
      />
    </Card>
  );
}

export function PosterCard({ result }: { result: PosterResult }) {
  const t = useTranslations("chat.poster");
  const tc = useTranslations("common");
  const [loaded, setLoaded] = useState(false);
  return (
    <Card className="my-2 overflow-hidden">
      <div className="relative aspect-[4/5] w-full bg-surface-2">
        {!loaded && <Skeleton className="absolute inset-0 rounded-none" />}
        <Image
          src={result.url}
          alt={result.title}
          fill
          unoptimized
          className="object-cover"
          onLoad={() => setLoaded(true)}
        />
        {!loaded && <p className="absolute inset-x-0 bottom-4 text-center text-sm text-ivory-muted">{t("loading")}</p>}
      </div>
      <div className="flex gap-2 p-3">
        <Button asChild variant="subtle" size="sm" className="flex-1">
          <a href={result.url} download={`an-bill-${result.kind}.png`}>
            <Download className="size-4" aria-hidden />
            {tc("download")}
          </a>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a href={result.url} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" aria-hidden />
            {t("open")}
          </a>
        </Button>
      </div>
    </Card>
  );
}
