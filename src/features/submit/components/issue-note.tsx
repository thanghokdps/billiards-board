import { useTranslations } from "next-intl";

import type { Step, StepIssue } from "../lib/issues";

/** What the server refused on this step, in words; the step's own controls are highlighted next to it. */
export function IssueNote({ step, issues }: { step: Step; issues: StepIssue[] }) {
  const t = useTranslations("submit.issues");
  const keys = [...new Set(issues.filter((i) => i.step === step).map((i) => i.key))];
  if (keys.length === 0) return null;
  return (
    <div role="alert" className="space-y-1 rounded-md border border-loss/50 bg-loss/10 px-3 py-2 text-sm text-loss">
      {keys.map((key) => (
        <p key={key}>{t(key)}</p>
      ))}
    </div>
  );
}
