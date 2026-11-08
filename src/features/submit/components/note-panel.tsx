import { useTranslations } from "next-intl";

import { Input, Label } from "@/components/ui/field";

import { IssueNote } from "./issue-note";
import type { StepIssue } from "../lib/issues";

const NOTE_MAX = 280;
const NAME_MAX = 40;

interface NotePanelProps {
  note: string;
  submitter: string;
  issues: StepIssue[];
  disabled: boolean;
  onNote: (note: string) => void;
  onSubmitter: (name: string) => void;
}

/** Step 5: a note chalked on a slate, and who is sending it. Both are optional. */
export function NotePanel({ note, submitter, issues, disabled, onNote, onSubmitter }: NotePanelProps) {
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
      <div>
        <Label htmlFor="submit-submitter">{t("submitter")}</Label>
        <Input
          id="submit-submitter"
          value={submitter}
          maxLength={NAME_MAX}
          disabled={disabled}
          autoComplete="nickname"
          placeholder={t("submitterPlaceholder")}
          onChange={(event) => onSubmitter(event.target.value)}
        />
        <p className="mt-1 text-xs text-ivory-muted">{t("submitterHint")}</p>
      </div>
    </div>
  );
}
