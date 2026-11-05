"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState, useTransition, type CSSProperties, type SyntheticEvent } from "react";

import { Ball } from "@/components/ui/ball";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";
import { prefersReducedMotion } from "@/lib/motion";

import { LoginError, login } from "../api";

/** Minutes to show for a `retry-after` in seconds; never "0 minutes". */
const minutesFor = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));

/** Characters that roll the ball to the pocket's lip; it only drops in once the password is right. */
const FULL_ROLL_CHARS = 12;
const SHAKE = [0, -8, 8, -5, 5, 0].map((x) => ({ transform: `translateX(${x}px)` }));

export function AdminLogin() {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, startRefresh] = useTransition();
  const shell = useRef<HTMLDivElement>(null);

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      await login(password);
      // Stay in the loading state until the refreshed page swaps this card for the dashboard.
      startRefresh(() => router.refresh());
    } catch (failure) {
      setBusy(false);
      if (!prefersReducedMotion()) shell.current?.animate(SHAKE, { duration: 360 });
      if (failure instanceof LoginError && failure.code === "unauthenticated") setError(t("wrong"));
      else if (failure instanceof LoginError && failure.code === "rate_limited") {
        setError(
          failure.retryAfterSeconds
            ? t("rateLimited", { minutes: minutesFor(failure.retryAfterSeconds) })
            : t("rateLimitedUnknown"),
        );
      } else setError(t("failed"));
    }
  }

  const loading = busy || refreshing;
  return (
    <div ref={shell} className="mx-auto flex max-w-sm flex-col justify-center py-16">
      <Card>
        <CardBody className="space-y-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <div
              aria-hidden
              data-sunk={loading ? "" : undefined}
              className="login-rail felt w-full"
              style={
                { ["--travel" as string]: Math.min(password.length / FULL_ROLL_CHARS, 1).toFixed(3) } as CSSProperties
              }
            >
              <span className="login-pocket" />
              <span className="login-ball">
                <Ball className="block size-10" />
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold leading-tight">{t("title")}</h1>
            <p className="text-sm text-ivory-muted">{t("hint")}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="admin-password">{t("password")}</Label>
              <Input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? "admin-login-error" : undefined}
                disabled={loading}
                maxLength={200}
                required
              />
            </div>
            <p id="admin-login-error" role="alert" className="min-h-5 text-sm text-loss">
              {error}
            </p>
            <Button type="submit" size="lg" className="w-full" disabled={loading || !password} aria-busy={loading}>
              {loading && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
              {loading ? t("submitting") : t("submit")}
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
