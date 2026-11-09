import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface StepNavProps {
  index: number;
  last: number;
  /** The next step is not allowed yet: seats unfilled, no winner. */
  stuck: boolean;
  disabled: boolean;
  onGo: (index: number) => void;
}

export function StepNav({ index, last, stuck, disabled, onGo }: StepNavProps) {
  const t = useTranslations("submit.steps");
  return (
    <div className="flex items-center justify-between gap-3">
      {index > 0 ? (
        <Button variant="ghost" disabled={disabled} onClick={() => onGo(index - 1)}>
          <ArrowLeft className="size-4" aria-hidden />
          {t("back")}
        </Button>
      ) : (
        <span />
      )}
      {index < last && (
        <Button disabled={disabled || stuck} onClick={() => onGo(index + 1)}>
          {t("next")}
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      )}
    </div>
  );
}
