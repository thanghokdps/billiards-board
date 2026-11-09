const pad = (n: number) => String(n).padStart(2, "0");

/** What a `datetime-local` input holds ("2026-11-09T12:30") for an ISO instant, in the browser's own zone. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return "";
  return `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}T${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/** The ISO instant a `datetime-local` value means in the browser's zone, or null when it is empty. */
export function fromLocalInput(value: string): string | null {
  const at = new Date(value);
  return value && !Number.isNaN(at.getTime()) ? at.toISOString() : null;
}
