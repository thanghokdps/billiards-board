import { CircleCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface SentCardProps {
  title: string;
  onAgain: () => void;
}

/** The back of the card: the match is with the admin now. */
export function SentCard({ title, onAgain }: SentCardProps) {
  const t = useTranslations("submit.sent");
  return (
    <div role="status" className="flex flex-col items-center gap-3 px-2 py-6 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-night shadow-inner ring-2 ring-lamp/60">
        <CircleCheck className="size-9 text-lamp" aria-hidden />
      </span>
      <p className="digits plaque-digits text-3xl font-bold text-lamp">{t("title")}</p>
      <p className="font-display text-xl font-bold text-balance">{title}</p>
      <p className="max-w-xs text-sm text-ivory-muted">{t("body")}</p>
      <Button variant="outline" size="lg" onClick={onAgain}>
        {t("again")}
      </Button>
    </div>
  );
}
