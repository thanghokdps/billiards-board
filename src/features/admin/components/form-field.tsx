import type { ReactNode } from "react";

import { Label } from "@/components/ui/field";

interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

/** Label, control, hint and an announced error; the control gets `aria-describedby` from `describedBy`. */
export function FormField({ id, label, hint, error, children }: FormFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && (
        <p id={`${id}-note`} className="mt-1 text-xs text-ivory-faint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-note`} role="alert" className="mt-1 text-xs text-loss">
          {error}
        </p>
      )}
    </div>
  );
}

/** `aria-*` props wiring a control to its FormField note. */
export function describedBy(id: string, hasNote: boolean, error?: string) {
  return { "aria-describedby": hasNote ? `${id}-note` : undefined, "aria-invalid": error ? true : undefined } as const;
}
