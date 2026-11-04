"use client";

import { ImagePlus, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type SubmitEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input, Label } from "@/components/ui/field";
import { adminCall } from "@/features/matches";

import { useAdminRun } from "../hooks/use-admin-run";
import { checkImage, isHttpsUrl, MEDIA_ACCEPT } from "../lib/media";

type Kind = "photo" | "clip";

/** Adds one highlight to a match: a photo (uploaded first, then linked by its media id) or an https clip link. */
export function HighlightForm({ matchId }: { matchId: string }) {
  const t = useTranslations("history");
  const { pending, run } = useAdminRun();
  const [kind, setKind] = useState<Kind>("photo");
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [problem, setProblem] = useState<"type" | "size" | "noFile" | "url" | null>(null);
  // Changing the key remounts the file input, the only way to clear a native file picker.
  const [fileKey, setFileKey] = useState(0);

  function handleFile(picked: File | null) {
    setFile(picked);
    setProblem(picked ? checkImage(picked) : null);
  }

  function reset() {
    setFile(null);
    setUrl("");
    setCaption("");
    setProblem(null);
    setFileKey((k) => k + 1);
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = caption.trim();
    const captionBody = trimmed ? { caption: trimmed } : {};

    const target = `/api/admin/matches/${matchId}/highlights`;
    let action: () => Promise<void>;
    if (kind === "photo") {
      if (!file) return setProblem("noFile");
      const issue = checkImage(file);
      if (issue) return setProblem(issue);
      const photo = file;
      action = async () => {
        const form = new FormData();
        form.append("file", photo);
        const media = await adminCall<{ id: string }>("/api/admin/media", { method: "POST", body: form });
        await adminCall(target, { method: "POST", body: JSON.stringify({ mediaId: media.id, ...captionBody }) });
      };
    } else {
      const link = url.trim();
      if (!isHttpsUrl(link)) return setProblem("url");
      action = async () => {
        await adminCall(target, { method: "POST", body: JSON.stringify({ url: link, ...captionBody }) });
      };
    }

    const ok = await run(action);
    if (!ok) return;
    reset();
    toast.success(t("admin.highlightAdded"));
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3" noValidate>
      <div role="group" aria-label={t("admin.kind")} className="flex gap-2">
        <Chip selected={kind === "photo"} onClick={() => setKind("photo")}>
          <ImagePlus className="size-4" aria-hidden />
          {t("admin.photo")}
        </Chip>
        <Chip selected={kind === "clip"} onClick={() => setKind("clip")}>
          <Link2 className="size-4" aria-hidden />
          {t("admin.clip")}
        </Chip>
      </div>

      {kind === "photo" ? (
        <div>
          <Label htmlFor={`file-${matchId}`}>{t("admin.file")}</Label>
          <Input
            key={fileKey}
            id={`file-${matchId}`}
            type="file"
            accept={MEDIA_ACCEPT}
            aria-describedby={`file-hint-${matchId}`}
            aria-invalid={problem === "type" || problem === "size" || problem === "noFile"}
            className="h-auto py-2 text-sm"
            onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
          />
          <p id={`file-hint-${matchId}`} className="mt-1 text-xs text-ivory-faint">
            {t("admin.fileHint")}
          </p>
        </div>
      ) : (
        <div>
          <Label htmlFor={`url-${matchId}`}>{t("admin.url")}</Label>
          <Input
            id={`url-${matchId}`}
            type="url"
            inputMode="url"
            placeholder="https://"
            value={url}
            aria-invalid={problem === "url"}
            onChange={(event) => {
              setUrl(event.target.value);
              setProblem(null);
            }}
          />
        </div>
      )}

      <div>
        <Label htmlFor={`caption-${matchId}`}>{t("admin.caption")}</Label>
        <Input
          id={`caption-${matchId}`}
          maxLength={140}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
        />
      </div>

      {problem && (
        <p role="alert" className="text-sm font-semibold text-loss">
          {t(`errors.${problem}`)}
        </p>
      )}

      <Button
        type="submit"
        variant="felt"
        disabled={pending || (kind === "photo" && problem !== null && problem !== "noFile")}
      >
        {kind === "photo" ? (pending ? t("admin.uploading") : t("admin.upload")) : t("admin.addLink")}
      </Button>
    </form>
  );
}
