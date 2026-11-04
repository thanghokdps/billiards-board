import { Bot, ScrollText, Tv } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { useChat } from "@/features/shell";
import { Link } from "@/i18n/navigation";

export function QuickLinks() {
  const t = useTranslations("admin.links");
  const chat = useChat();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardBody className="grid gap-2">
        {chat.available && (
          <Button variant="subtle" className="justify-start" onClick={() => chat.open()}>
            <Bot className="size-4" aria-hidden />
            {t("assistant")}
          </Button>
        )}
        <Button asChild variant="subtle" className="justify-start">
          <Link href="/audit">
            <ScrollText className="size-4" aria-hidden />
            {t("audit")}
          </Link>
        </Button>
        <Button asChild variant="subtle" className="justify-start">
          <Link href="/tv">
            <Tv className="size-4" aria-hidden />
            {t("tv")}
          </Link>
        </Button>
      </CardBody>
    </Card>
  );
}
