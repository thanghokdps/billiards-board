import { CalendarClock, LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";

import { FailureAlert } from "./failure-alert";
import type { Failure } from "../hooks/use-submit";
import { fromLocalInput, toLocalInput } from "../lib/schedule-time";

interface ScheduleBlockProps {
  /** The planned time as an ISO instant, or none. Null until hydrated: the browser's zone differs from the server's. */
  at: string | null;
  /** The match already exists on the server: the button saves instead of creating. */
  saved: boolean;
  busy: boolean;
  failure: Failure | null;
  disabled: boolean;
  onAt: (at: string | null) => void;
  onSchedule: () => void;
}

/** Step 2, once every seat is filled: plan the match now and enter the result when it is played. */
export function ScheduleBlock({ at, saved, busy, failure, disabled, onAt, onSchedule }: ScheduleBlockProps) {
  const t = useTranslations("submit.schedule");
  return (
    <section aria-labelledby="schedule-title" className="space-y-3 rounded-lg border border-line bg-surface-2 p-3">
      <div className="flex items-start gap-2.5">
        <CalendarClock className="mt-0.5 size-5 shrink-0 text-lamp" aria-hidden />
        <div>
          <h3 id="schedule-title" className="font-display text-lg leading-tight font-bold">
            {t("title")}
          </h3>
          <p className="text-xs text-ivory-muted">{t("hint")}</p>
        </div>
      </div>
      <div>
        <Label htmlFor="schedule-at">{t("at")}</Label>
        <Input
          id="schedule-at"
          type="datetime-local"
          value={toLocalInput(at)}
          disabled={disabled}
          onChange={(event) => onAt(fromLocalInput(event.target.value))}
        />
        <p className="mt-1 text-xs text-ivory-muted">{t("atHint")}</p>
      </div>
      {failure?.via === "schedule" && <FailureAlert failure={failure} />}
      <Button variant="felt" size="lg" className="w-full" disabled={disabled} aria-busy={busy} onClick={onSchedule}>
        {busy ? (
          <LoaderCircle className="size-5 animate-spin" aria-hidden />
        ) : (
          <CalendarClock className="size-5" aria-hidden />
        )}
        {t(busy ? "saving" : saved ? "save" : "submit")}
      </Button>
    </section>
  );
}
