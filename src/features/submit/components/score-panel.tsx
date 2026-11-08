import { useTranslations } from "next-intl";

import type { PlayerRef } from "@/server/matches/schema";

import { BillChips } from "./bill-chips";
import { IssueNote } from "./issue-note";
import { ScoreDial } from "./score-dial";
import { scoreProblem, type Draft, type ScoreTarget } from "../lib/draft";
import type { StepIssue } from "../lib/issues";

interface ScorePanelProps {
  draft: Draft;
  seated: (PlayerRef | null)[];
  sides: { sideA: PlayerRef[]; sideB: PlayerRef[] };
  issues: StepIssue[];
  disabled: boolean;
  onStep: (target: ScoreTarget, delta: 1 | -1) => void;
  onAddBill: (amount: number) => void;
  onSetBill: (bill: number | null) => void;
}

/** Step 4: scores on brass plates (optional) and the bill as a tower of chips. */
export function ScorePanel({ draft, seated, sides, issues, disabled, onStep, onAddBill, onSetBill }: ScorePanelProps) {
  const t = useTranslations("submit.score");
  const threeWay = draft.format === "1v1v1";
  const misordered = scoreProblem(draft);
  const flagged = issues.some((i) => i.step === "score" && i.key === "scoreOrder");

  return (
    <div className="space-y-5">
      <section aria-labelledby="submit-score-title" className="space-y-3">
        <h3 id="submit-score-title" className="font-display text-lg font-bold">
          {t("title")}
        </h3>
        <p className="text-xs text-ivory-muted">{t("hint")}</p>
        <div className={threeWay ? "grid grid-cols-3 gap-2" : "grid grid-cols-2 gap-3"}>
          {threeWay
            ? seated.map((p, seat) =>
                p ? (
                  <ScoreDial
                    key={p.id}
                    players={[p]}
                    value={draft.scores[seat] ?? null}
                    disabled={disabled}
                    onStep={(delta) => onStep(seat, delta)}
                  />
                ) : null,
              )
            : (["a", "b"] as const).map((side) => (
                <ScoreDial
                  key={side}
                  players={side === "a" ? sides.sideA : sides.sideB}
                  value={side === "a" ? draft.scoreA : draft.scoreB}
                  disabled={disabled}
                  onStep={(delta) => onStep(side, delta)}
                />
              ))}
        </div>
        {(misordered || flagged) && (
          <p role="alert" className="text-sm text-loss">
            {t(threeWay ? "orderLoser" : "orderWinner")}
          </p>
        )}
        <IssueNote step="score" issues={issues.filter((i) => i.key !== "scoreOrder")} />
      </section>
      <section aria-labelledby="submit-bill-title" className="space-y-3">
        <h3 id="submit-bill-title" className="font-display text-lg font-bold">
          {t("billTitle")}
        </h3>
        <BillChips bill={draft.bill} disabled={disabled} onAdd={onAddBill} onSet={onSetBill} />
      </section>
    </div>
  );
}
