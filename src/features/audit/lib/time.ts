import { APP_TIMEZONE } from "@/lib/domain";

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000],
  ["month", 2_592_000],
  ["week", 604_800],
  ["day", 86_400],
  ["hour", 3600],
  ["minute", 60],
];

const intlLocale = (locale: string) => (locale === "en" ? "en-GB" : "vi-VN");

/** "3 hours ago" against `now` given by the server, so server and browser render the same text. */
export function formatRelative(at: string, now: string, locale: string): string {
  const seconds = Math.round((new Date(at).getTime() - new Date(now).getTime()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(intlLocale(locale), { numeric: "auto" });
  const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s) ?? (["second", 1] as const);
  return formatter.format(Math.trunc(seconds / size), unit);
}

export function formatAbsolute(at: string, locale: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: APP_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(at));
}
