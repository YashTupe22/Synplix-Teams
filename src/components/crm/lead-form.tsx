"use client";

import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LEAD_STATUS_CONFIG,
  LEAD_PRIORITY_CONFIG,
  type LeadWithRelations,
  type LeadSource,
  type LeadStatus,
  type LeadPriority,
} from "@/types/crm";
import type { Profile } from "@/types/database";

type ActionState = { error?: string; success?: boolean; id?: string };

interface LeadFormProps {
  lead?: LeadWithRelations;
  sources: LeadSource[];
  teamMembers: Pick<Profile, "id" | "full_name" | "email">[];
  companies: { id: string; name: string }[];
  contacts: { id: string; first_name: string; last_name: string | null; company_id: string | null }[];
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Update Lead" : "Create Lead"}
    </Button>
  );
}

export function LeadForm({ lead, sources, teamMembers, companies, contacts, action }: LeadFormProps) {
  const router = useRouter();
  const isEdit = !!lead;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={lead.id} />}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lead Information</CardTitle>
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
                defaultValue={lead?.title}
                required
                placeholder="e.g. Website redesign project"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                defaultValue={lead?.description ?? ""}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Brief description of the lead..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company & Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company & Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="company_id" className="mb-1.5 block text-sm font-medium">
                Company
              </label>
              <select
                id="company_id"
                name="company_id"
                defaultValue={lead?.company_id ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contact_id" className="mb-1.5 block text-sm font-medium">
                Contact
              </label>
              <select
                id="contact_id"
                name="contact_id"
                defaultValue={lead?.contact_id ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select contact</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name ?? ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Assignment & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="assigned_to" className="mb-1.5 block text-sm font-medium">
                Assigned To
              </label>
              <select
                id="assigned_to"
                name="assigned_to"
                defaultValue={lead?.assigned_to ?? ""}
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
            <div>
              <label htmlFor="source_id" className="mb-1.5 block text-sm font-medium">
                Source
              </label>
              <select
                id="source_id"
                name="source_id"
                defaultValue={lead?.source_id ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select source</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={lead?.status ?? "new"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(Object.keys(LEAD_STATUS_CONFIG) as LeadStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {LEAD_STATUS_CONFIG[s].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority" className="mb-1.5 block text-sm font-medium">
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue={lead?.priority ?? "medium"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(Object.keys(LEAD_PRIORITY_CONFIG) as LeadPriority[]).map((p) => (
                  <option key={p} value={p}>
                    {LEAD_PRIORITY_CONFIG[p].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Value & Follow-up */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Value & Follow-up</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="estimated_value" className="mb-1.5 block text-sm font-medium">
                Estimated Value
              </label>
              <Input
                id="estimated_value"
                name="estimated_value"
                type="number"
                min="0"
                step="1000"
                defaultValue={lead?.estimated_value ?? ""}
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
                defaultValue={lead?.currency ?? "INR"}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="INR">INR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div>
              <label htmlFor="next_follow_up_at" className="mb-1.5 block text-sm font-medium">
                Next Follow-up
              </label>
              <Input
                id="next_follow_up_at"
                name="next_follow_up_at"
                type="datetime-local"
                defaultValue={lead?.next_follow_up_at?.slice(0, 16) ?? ""}
              />
            </div>
          </div>
          {isEdit && lead?.status === "lost" && (
            <div>
              <label htmlFor="lost_reason" className="mb-1.5 block text-sm font-medium">
                Lost Reason
              </label>
              <textarea
                id="lost_reason"
                name="lost_reason"
                defaultValue={lead?.lost_reason ?? ""}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Why was this lead lost?"
              />
            </div>
          )}
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
