"use client";

import { useTranslations } from "next-intl";

import { Sheet } from "@/components/ui/sheet";
import { submissionsApi } from "@/features/submissions";
import { SubmitScene } from "@/features/submit";
import { useRouter } from "@/i18n/navigation";
import type { PlayerRef } from "@/server/matches/schema";
import type { SubmissionView } from "@/server/submissions/schema";

interface PendingEditProps {
  submission: SubmissionView;
  roster: PlayerRef[];
  onClose: () => void;
}

/** The admin's Edit: the same table scene as /submit, prefilled; saving approves with the edits. */
export function PendingEdit({ submission, roster, onClose }: PendingEditProps) {
  const t = useTranslations("admin.pending");
  const router = useRouter();

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()} title={t("editTitle")} side="responsive">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-6">
        <SubmitScene
          roster={roster}
          mode="edit"
          initial={submission.input}
          onSubmit={async (edited) => {
            await submissionsApi.approve(submission.id, { edited, via: "ui" });
          }}
          onDone={() => {
            onClose();
            router.refresh();
          }}
        />
      </div>
    </Sheet>
  );
}
