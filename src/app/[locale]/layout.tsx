import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Big_Shoulders } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Suspense, type ReactNode } from "react";
import { Toaster } from "sonner";

import { AppShell, MatchArt, toMatchStrokes } from "@/features/shell";
import { routing } from "@/i18n/routing";
import { googleConfigured } from "@/server/auth/google";
import { readPlayer } from "@/server/auth/player-session";
import { isAdmin } from "@/server/auth/session";
import { findMatches } from "@/server/matches/repository";

const shoulders = Big_Shoulders({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-shoulders",
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0b1410",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    title: { default: `${t("appName")} — ${t("slogan")}`, template: `%s · ${t("appName")}` },
    description: t("slogan"),
    applicationName: t("appName"),
    icons: { icon: "/icon.svg" },
    appleWebApp: { capable: true, title: t("appName"), statusBarStyle: "black-translucent" },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const ART_MATCHES = 16;

/** Decoration under Suspense, so it never delays the page, and a failed read must not take the page down with it. */
async function RecentMatchArt() {
  const matches = await findMatches({ limit: ART_MATCHES, order: "desc" }).catch(() => []);
  return <MatchArt strokes={toMatchStrokes(matches)} />;
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const [admin, member] = await Promise.all([isAdmin(), readPlayer()]);

  return (
    <html lang={locale} className={`${shoulders.variable} ${beVietnam.variable}`}>
      <body>
        <NextIntlClientProvider>
          <AppShell
            admin={admin}
            member={member?.player ?? null}
            googleEnabled={googleConfigured()}
            art={
              <Suspense>
                <RecentMatchArt />
              </Suspense>
            }
          >
            {children}
          </AppShell>
          <Toaster
            theme="dark"
            position="top-center"
            toastOptions={{ classNames: { toast: "!bg-surface-2 !border-line-strong !text-ivory !rounded-md" } }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
