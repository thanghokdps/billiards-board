import { useTranslations } from "next-intl";

import { cn } from "@/lib/cn";

import { Badge } from "./badge";

interface GuestBadgeProps {
  /** A viewer's temporary guest: lives in their browser only, so it gets the chalk-dashed "tạm" tag. */
  temp?: boolean;
  className?: string;
}

/** Marks a guest next to a name; dashed like the chalk slate they are added from. */
export function GuestBadge({ temp, className }: GuestBadgeProps) {
  const t = useTranslations("common");
  return (
    <Badge className={cn("border border-dashed", temp ? "border-chalk text-chalk" : "border-line-strong", className)}>
      {t(temp ? "guestTemp" : "guest")}
    </Badge>
  );
}
