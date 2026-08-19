"use client";

import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SALES_STAGE_CONFIG,
  type SalesOpportunity,
  type SalesStage,
} from "@/types/sales";
import type { Profile } from "@/types/database";

type ActionState = { error?: string; success?: boolean; id?: string };

interface OpportunityFormProps {
  opportunity?: SalesOpportunity;
  leads: { id: string; title: string }[];
  teamMembers: Pick<Profile, "id" | "full_name" | "email">[];
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Update Opportunity" : "Create Opportunity"}
    </Button>
  );
}

export function OpportunityForm({ opportunity, leads, teamMembers, action }: OpportunityFormProps) {
  const router = useRouter();
  const isEdit = !!opportunity;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={opportunity.id} />}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opportunity Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                name="title"
                defaultValue={opportunity?.title}
                required
                placeholder="e.g. Enterprise license deal"
              />
            </div>
            <div>
              <label htmlFor="lead_id" className="mb-1.5 block text-sm font-medium">
                Lead <span className="text-destructive">*</span>
              </label>
              <select
                id="lead_id"
                name="lead_id"
                defaultValue={opportunity?.lead_id ?? ""}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select lead</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="owner_id" className="mb-1.5 block text-sm font-medium">
                Owner
              </label>
              <select
                id="owner_id"
                name="owner_id"
                defaultValue={opportunity?.owner_id ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name ?? m.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={opportunity?.description ?? ""}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Brief description of the opportunity..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Value & Stage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Value & Stage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="value" className="mb-1.5 block text-sm font-medium">
                Value
              </label>
              <Input
                id="value"
                name="value"
                type="number"
                min="0"
                step="1000"
                defaultValue={opportunity?.value ?? ""}
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="currency" className="mb-1.5 block text-sm font-medium">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                defaultValue={opportunity?.currency ?? "INR"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label htmlFor="probability" className="mb-1.5 block text-sm font-medium">
                Probability (%)
              </label>
              <Input
                id="probability"
                name="probability"
                type="number"
                min="0"
                max="100"
                defaultValue={opportunity?.probability ?? 10}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="stage" className="mb-1.5 block text-sm font-medium">
                Stage <span className="text-destructive">*</span>
              </label>
              <select
                id="stage"
                name="stage"
                defaultValue={opportunity?.stage ?? "qualification"}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(Object.keys(SALES_STAGE_CONFIG) as SalesStage[]).map((s) => (
                  <option key={s} value={s}>
                    {SALES_STAGE_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="expected_close_date" className="mb-1.5 block text-sm font-medium">
                Expected Close Date
              </label>
              <Input
                id="expected_close_date"
                name="expected_close_date"
                type="date"
                defaultValue={opportunity?.expected_close_date?.slice(0, 10) ?? ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lost Reason */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lost Reason</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label htmlFor="lost_reason" className="mb-1.5 block text-sm font-medium">
              Reason for loss
            </label>
            <textarea
              id="lost_reason"
              name="lost_reason"
              defaultValue={opportunity?.lost_reason ?? ""}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Why was this opportunity lost?"
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  );
}
