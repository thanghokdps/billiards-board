import { useTranslations } from "next-intl";

import { FormStrip } from "@/components/ui/form-strip";
import type { Result } from "@/lib/stats";

/**
 * FormStrip prints the first letter of each label, and in Vietnamese "Thắng" and "Thua" both start with T.
 * So the pills use the short letters (hidden from assistive tech) and a screen-reader line spells the results out.
 */
export function FormLine({ form }: { form: Result[] }) {
  const t = useTranslations("common");
  if (form.length === 0) return <span className="text-sm text-ivory-faint">—</span>;
  return (
    <>
      <div aria-hidden>
        <FormStrip form={form} labels={{ W: t("winShort"), L: t("lossShort") }} />
      </div>
      <span className="sr-only">{form.map((r) => (r === "W" ? t("win") : t("loss"))).join(", ")}</span>
    </>
  );
}
