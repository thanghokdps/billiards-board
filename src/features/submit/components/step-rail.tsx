import { useTranslations } from "next-intl";

import { Ball } from "@/components/ui/ball";
import { cn } from "@/lib/cn";

import { STEPS, type Step } from "../lib/issues";

interface StepRailProps {
  current: number;
  /** The furthest step the draft allows; later balls are racked and cannot be tapped. */
  reach: number;
  flagged: Step[];
  disabled: boolean;
  onGo: (index: number) => void;
}

/** Progress as a routed groove: the cue ball sits at the current step, and every step is a ball you can go back to. */
export function StepRail({ current, reach, flagged, disabled, onGo }: StepRailProps) {
  const t = useTranslations("submit.steps");
  return (
    <nav aria-label={t("label")}>
      <div
        aria-hidden
        className="ball-groove mx-4 mt-0 mb-2"
        style={{ ["--to" as string]: (current / (STEPS.length - 1)) * 100 }}
      >
        <span className="ball-groove-trail bg-lamp transition-[width] duration-500" />
        <span className="ball-groove-ball transition-[left] duration-500">
          <Ball number="" color="var(--color-ivory)" className="size-full" />
        </span>
      </div>
      <ol className="grid grid-cols-6 gap-1">
        {STEPS.map((step, index) => (
          <li key={step} className="min-w-0">
            <button
              type="button"
              disabled={disabled || index > reach}
              aria-current={index === current ? "step" : undefined}
              onClick={() => onGo(index)}
              className={cn(
                "relative flex min-h-11 w-full cursor-pointer flex-col items-center gap-0.5 rounded-md py-1 text-2xs font-semibold transition-colors disabled:cursor-default",
                index === current ? "text-lamp" : index <= reach ? "text-ivory" : "text-ivory-faint",
              )}
            >
              <Ball
                number={index + 1}
                color={
                  index === current
                    ? "var(--color-lamp)"
                    : index < reach
                      ? "var(--color-felt-bright)"
                      : "var(--color-surface-3)"
                }
                className="size-6"
              />
              <span className="w-full truncate text-center">{t(step)}</span>
              {flagged.includes(step) && (
                <span
                  aria-hidden
                  className="absolute top-0.5 right-1/4 size-2.5 rounded-full bg-loss ring-2 ring-night"
                />
              )}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
