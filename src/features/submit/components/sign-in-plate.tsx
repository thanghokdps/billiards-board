import { LockKeyhole } from "lucide-react";
import { useTranslations } from "next-intl";

import { Ball } from "@/components/ui/ball";
import { GoogleSignIn } from "@/features/auth";

import { SubmitPlaque } from "./submit-plaque";

/** What /submit shows a visitor who is not signed in: the same brass plate, with a sign-in in place of the form. */
export function SignInPlate({ googleEnabled }: { googleEnabled: boolean }) {
  const t = useTranslations("submit.signIn");
  return (
    <SubmitPlaque
      flipped={false}
      back={null}
      front={
        <div className="flex flex-col items-center gap-3 px-2 py-6 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-night shadow-inner ring-2 ring-lamp/60">
            {googleEnabled ? (
              <Ball className="size-10" />
            ) : (
              <LockKeyhole className="size-8 text-ivory-muted" aria-hidden />
            )}
          </span>
          <h2 className="font-display text-2xl leading-tight font-bold text-balance">{t("title")}</h2>
          <p className="max-w-xs text-sm text-ivory-muted">{t(googleEnabled ? "body" : "unavailable")}</p>
          {googleEnabled && <GoogleSignIn className="w-full max-w-xs" />}
        </div>
      }
    />
  );
}
