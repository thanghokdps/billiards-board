"use client";

import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition, type SyntheticEvent } from "react";

import { Ball } from "@/components/ui/ball";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/field";
import { useRouter } from "@/i18n/navigation";

import { LoginError, login } from "../api";

/** Minutes to show for a `retry-after` in seconds; never "0 minutes". */
const minutesFor = (seconds: number) => Math.max(1, Math.ceil(seconds / 60));

export function AdminLogin() {
  const t = useTranslations("admin.login");
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, startRefresh] = useTransition();

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
    <div className="mx-auto flex max-w-sm flex-col justify-center py-16">
      <Card>
        <CardBody className="space-y-5">
          <div className="flex flex-col items-center gap-2 text-center">
            <Ball className="size-14" />
            <h1 className="font-display text-2xl font-bold uppercase tracking-wide">{t("title")}</h1>
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
