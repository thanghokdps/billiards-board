"use client";

import { Copy, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSyncExternalStore } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { haptic } from "@/lib/feedback";

const noopSubscribe = () => () => {};
const canShareNow = () => typeof navigator.share === "function";

/** Web Share API where the browser has it, otherwise copies the story link. */
export function ShareButton({ title, text }: { title: string; text: string }) {
  const t = useTranslations("wrapped.story.share");
  const canShare = useSyncExternalStore(noopSubscribe, canShareNow, () => false);

  async function handleShare() {
    const url = window.location.href;
    if (canShare) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      haptic();
      toast.success(t("copied"));
    } catch {
      toast.error(t("failed"));
    }
  }

  return (
    <Button onClick={handleShare} className="pointer-events-auto">
      {canShare ? <Share2 className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {canShare ? t("button") : t("copyLink")}
    </Button>
  );
}
