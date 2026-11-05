import { Download } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { HoloFrame } from "@/components/ui/holo-frame";
import { PosterImage } from "@/features/fame";

interface RivalryPosterProps {
  src: string;
  a: string;
  b: string;
}

export function RivalryPoster({ src, a, b }: RivalryPosterProps) {
  const t = useTranslations("rivalry");
  const common = useTranslations("common");
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("poster")}</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="mx-auto max-w-sm">
          <HoloFrame rounded="rounded-md">
            <PosterImage
              src={src}
              alt={t("posterAlt", { a, b })}
              errorLabel={t("posterError")}
              sizes="(min-width: 1024px) 320px, 100vw"
              eager
            />
          </HoloFrame>
        </div>
        <Button asChild className="w-full">
          <a href={src} download="rivalry.png">
            <Download className="size-4" aria-hidden />
            {common("download")}
          </a>
        </Button>
      </CardBody>
    </Card>
  );
}
