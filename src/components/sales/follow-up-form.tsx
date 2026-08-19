"use client";

import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FOLLOW_UP_TYPE_CONFIG,
  FOLLOW_UP_STATUS_CONFIG,
  type FollowUpType,
  type FollowUpStatus,
  type SalesFollowUp,
} from "@/types/sales";
import type { Profile } from "@/types/database";

type ActionState = { error?: string; success?: boolean; id?: string };

interface FollowUpFormProps {
  followUp?: SalesFollowUp;
  leads: { id: string; title: string }[];
  teamMembers: Pick<Profile, "id" | "full_name" | "email">[];
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Update Follow-up" : "Create Follow-up"}
    </Button>
  );
}

export function FollowUpForm({ followUp, leads, teamMembers, action }: FollowUpFormProps) {
  const router = useRouter();
  const isEdit = !!followUp;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={followUp.id} />}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Follow-up Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="lead_id" className="mb-1.5 block text-sm font-medium">
                Lead <span className="text-destructive">*</span>
              </label>
              <select
                id="lead_id"
                name="lead_id"
                defaultValue={followUp?.lead_id ?? ""}
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
              <label htmlFor="assigned_to" className="mb-1.5 block text-sm font-medium">
                Assigned To <span className="text-destructive">*</span>
              </label>
              <select
                id="assigned_to"
                name="assigned_to"
                defaultValue={followUp?.assigned_to ?? ""}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select team member</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name ?? m.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="type" className="mb-1.5 block text-sm font-medium">
                Type <span className="text-destructive">*</span>
              </label>
              <select
                id="type"
                name="type"
                defaultValue={followUp?.type ?? "call"}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(Object.keys(FOLLOW_UP_TYPE_CONFIG) as FollowUpType[]).map((t) => (
                  <option key={t} value={t}>
                    {FOLLOW_UP_TYPE_CONFIG[t].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="scheduled_at" className="mb-1.5 block text-sm font-medium">
                Scheduled At <span className="text-destructive">*</span>
              </label>
              <Input
                id="scheduled_at"
                name="scheduled_at"
                type="datetime-local"
                defaultValue={followUp?.scheduled_at?.slice(0, 16) ?? ""}
                required
              />
            </div>
            {isEdit && (
              <div>
                <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={followUp?.status ?? "pending"}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {(Object.keys(FOLLOW_UP_STATUS_CONFIG) as FollowUpStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {FOLLOW_UP_STATUS_CONFIG[s].label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              name="title"
              defaultValue={followUp?.title}
              required
              placeholder="e.g. Follow-up call regarding proposal"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              defaultValue={followUp?.description ?? ""}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Optional description..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  );
}
