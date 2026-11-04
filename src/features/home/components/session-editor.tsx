"use client";

import { Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { useId, useState, type SyntheticEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input, Label } from "@/components/ui/field";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Sheet } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";
import type { PlayerRef } from "@/server/matches/schema";

import { homeApi } from "../api";

interface SessionEditorProps {
  date: string;
  roster: PlayerRef[];
  attendeeIds: number[];
  venue: string | null;
  tableLabel: string | null;
}

/** Admin only: the trigger button plus the sheet that edits attendees, venue and table. */
export function SessionEditor(props: SessionEditorProps) {
  const t = useTranslations("home.session");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="size-4" aria-hidden />
        {t("edit")}
      </Button>
      <Sheet open={open} onOpenChange={setOpen} title={t("editTitle")} side="responsive">
        <EditForm {...props} onDone={() => setOpen(false)} />
      </Sheet>
    </>
  );
}

/** Mounted only while the sheet is open, so each open starts from the saved session. */
function EditForm({
  date,
  roster,
  attendeeIds,
  venue,
  tableLabel,
  onDone,
}: SessionEditorProps & { onDone: () => void }) {
  const t = useTranslations("home.session");
  const tc = useTranslations("common");
  const router = useRouter();
  const ids = useId();
  const [attendees, setAttendees] = useState(attendeeIds);
  const [venueText, setVenueText] = useState(venue ?? "");
  const [tableText, setTableText] = useState(tableLabel ?? "");
  const [saving, setSaving] = useState(false);

  const toggle = (id: number) => setAttendees((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  async function handleSubmit(event: SyntheticEvent) {
    event.preventDefault();
    setSaving(true);
    try {
      await homeApi.updateSession(date, {
        attendees,
        venue: venueText.trim() || null,
        tableLabel: tableText.trim() || null,
      });
      toast.success(t("saved"));
      onDone();
      router.refresh();
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ivory-muted">{t("attendeesLabel")}</legend>
          <div className="flex flex-wrap gap-2">
            {roster.map((p) => (
              <Chip key={p.id} selected={attendees.includes(p.id)} onClick={() => toggle(p.id)}>
                <PlayerAvatar player={p} size="xs" />
                {p.name}
              </Chip>
            ))}
          </div>
        </fieldset>
        <div>
          <Label htmlFor={`${ids}-venue`}>{t("venue")}</Label>
          <Input
            id={`${ids}-venue`}
            maxLength={60}
            value={venueText}
            onChange={(e) => setVenueText(e.target.value)}
            placeholder={t("venuePlaceholder")}
          />
        </div>
        <div>
          <Label htmlFor={`${ids}-table`}>{t("tableLabel")}</Label>
          <Input
            id={`${ids}-table`}
            maxLength={30}
            value={tableText}
            onChange={(e) => setTableText(e.target.value)}
            placeholder={t("tablePlaceholder")}
          />
        </div>
      </div>
      <div className="flex gap-2 border-t border-line p-4">
        <Button variant="outline" onClick={onDone} className="flex-1">
          {tc("cancel")}
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {tc("save")}
        </Button>
      </div>
    </form>
  );
}
