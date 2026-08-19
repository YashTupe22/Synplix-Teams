"use client";

import { useFormState } from "react-dom";
import { updateOpportunityStageAction } from "@/app/(dashboard)/sales/actions";
import { SALES_STAGE_CONFIG, OPEN_STAGES, type SalesStage } from "@/types/sales";

interface StageChangerProps {
  opportunityId: string;
  currentStage: SalesStage;
}

export function StageChanger({ opportunityId, currentStage }: StageChangerProps) {
  const [state, formAction] = useFormState(updateOpportunityStageAction, null);

  return (
    <div>
      {state?.error && (
        <div className="mb-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">{state.error}</div>
      )}
      <div className="flex flex-wrap gap-2">
        {OPEN_STAGES.map((stage) => {
          const config = SALES_STAGE_CONFIG[stage];
          const isCurrent = stage === currentStage;
          return (
            <form key={stage} action={formAction}>
              <input type="hidden" name="id" value={opportunityId} />
              <input type="hidden" name="stage" value={stage} />
              <button
                type="submit"
                disabled={isCurrent}
                className={`inline-flex items-center rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  isCurrent
                    ? "cursor-default border-transparent bg-primary text-primary-foreground opacity-50"
                    : "border-border hover:bg-muted"
                }`}
              >
                {config.label}
              </button>
            </form>
          );
        })}
      </div>
    </div>
  );
}
