import type { ReactNode } from "react";

export function PanelHeading({ title, aside }: { title: string; aside?: ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4 2xl:mb-8">
      <h2 className="font-display text-4xl font-extrabold text-lamp 2xl:text-7xl">{title}</h2>
      {aside && <p className="font-display text-xl font-semibold text-ivory-muted 2xl:text-3xl">{aside}</p>}
    </div>
  );
}
