import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/field";

import { IssueNote } from "./issue-note";
import type { StepIssue } from "../lib/issues";

const NOTE_MAX = 280;

interface NotePanelProps {
  note: string;
  issues: StepIssue[];
  disabled: boolean;
  onNote: (note: string) => void;
}

/** Step 5: a note chalked on a slate. Optional; the server already knows who is sending it. */
export function NotePanel({ note, issues, disabled, onNote }: NotePanelProps) {
  const t = useTranslations("submit.note");
  return (
    <div className="space-y-4">
      <IssueNote step="note" issues={issues} />
      <div className="chalk-slate rounded-lg border-2 border-dashed border-chalk/60 px-3 py-2">
        <Label htmlFor="submit-note" className="text-chalk">
          {t("label")}
        </Label>
        <textarea
          id="submit-note"
          value={note}
          maxLength={NOTE_MAX}
          disabled={disabled}
          rows={4}
          placeholder={t("placeholder")}
          onChange={(event) => onNote(event.target.value)}
          className="w-full resize-none rounded-sm border-b border-dashed border-chalk/50 bg-transparent px-1 text-lg text-chalk placeholder:text-ivory-faint focus:border-lamp focus:outline-none disabled:opacity-50"
        />
        <p className="text-right text-xs text-ivory-faint">
          {note.length}/{NOTE_MAX}
        </p>
      </div>
    </div>
  );
}
