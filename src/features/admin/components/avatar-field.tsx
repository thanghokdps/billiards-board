import { LoaderCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type ChangeEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { PlayerAvatar } from "@/components/ui/player-avatar";

import { adminApi, adminErrorKey } from "../api";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
/** Mirrors MEDIA_MAX_BYTES in the media repository, which is server-only and cannot be imported here. */
const MAX_BYTES = 1_500_000;

interface AvatarFieldProps {
  id: string;
  value: string | null;
  preview: { name: string; ballColor: string; ballNumber: number };
  onChange: (url: string | null) => void;
}

/** Avatar preview plus an image upload (jpeg / png / webp, 1.5 MB), checked here before the server checks again. */
export function AvatarField({ id, value, preview, onChange }: AvatarFieldProps) {
  const t = useTranslations("admin.form");
  const errors = useTranslations("admin.errors");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) return setError(t("avatarBadType"));
    if (file.size > MAX_BYTES) return setError(t("avatarTooBig"));
    setError(null);
    setUploading(true);
    try {
      onChange(await adminApi.uploadAvatar(file));
    } catch (failure) {
      setError(errors(adminErrorKey(failure)));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-start gap-4">
      <PlayerAvatar player={{ ...preview, avatarUrl: value }} size="xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Input
          id={id}
          type="file"
          accept={ACCEPTED.join(",")}
          onChange={handleFile}
          disabled={uploading}
          className="h-auto py-2 text-sm file:mr-3 file:rounded-sm file:border-0 file:bg-surface-3 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-ivory"
          aria-describedby={`${id}-note`}
        />
        <p
          id={`${id}-note`}
          role={error ? "alert" : undefined}
          className={error ? "text-xs text-loss" : "text-xs text-ivory-faint"}
        >
          {error ?? t("avatarHint")}
        </p>
        <div className="flex items-center gap-2">
          {uploading && (
            <span role="status" className="flex items-center gap-1.5 text-xs text-ivory-muted">
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              {t("avatarUploading")}
            </span>
          )}
          {value && !uploading && (
            <Button variant="subtle" size="sm" onClick={() => onChange(null)}>
              {t("avatarRemove")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
