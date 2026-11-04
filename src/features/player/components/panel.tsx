import type { ReactNode } from "react";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SectionTitle } from "@/features/leaderboard";

/** A titled card section with a proper h2. */
export function Panel({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <Card>
        <CardHeader>
          <SectionTitle id={id}>{title}</SectionTitle>
        </CardHeader>
        <CardBody>{children}</CardBody>
      </Card>
    </section>
  );
}
