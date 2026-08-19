"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CALL_OUTCOME_CONFIG, type CallOutcome } from "@/types/sales";

type ActionState = { error?: string; success?: boolean; id?: string };

interface CallLogFormProps {
  leadId?: string;
  leads: { id: string; title: string }[];
  contacts: { id: string; first_name: string; last_name: string | null }[];
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Log Call"}
    </Button>
  );
}

export function CallLogForm({ leadId, leads, contacts, action }: CallLogFormProps) {
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {leadId && <input type="hidden" name="lead_id" value={leadId} />}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Call Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {!leadId && (
              <div>
                <label htmlFor="lead_id" className="mb-1.5 block text-sm font-medium">
                  Lead <span className="text-destructive">*</span>
                </label>
                <select
                  id="lead_id"
                  name="lead_id"
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
            )}
            <div>
              <label htmlFor="contact_id" className="mb-1.5 block text-sm font-medium">
                Contact
              </label>
              <select
                id="contact_id"
                name="contact_id"
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
            <div>
              <label htmlFor="started_at" className="mb-1.5 block text-sm font-medium">
                Date & Time <span className="text-destructive">*</span>
              </label>
              <Input
                id="started_at"
                name="started_at"
                type="datetime-local"
                required
                defaultValue={new Date().toISOString().slice(0, 16)}
              />
            </div>
            <div>
              <label htmlFor="duration_seconds" className="mb-1.5 block text-sm font-medium">
                Duration (seconds)
              </label>
              <Input
                id="duration_seconds"
                name="duration_seconds"
                type="number"
                min="0"
                placeholder="0"
              />
            </div>
            <div>
              <label htmlFor="outcome" className="mb-1.5 block text-sm font-medium">
                Outcome <span className="text-destructive">*</span>
              </label>
              <select
                id="outcome"
                name="outcome"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(Object.keys(CALL_OUTCOME_CONFIG) as CallOutcome[]).map((o) => (
                  <option key={o} value={o}>
                    {CALL_OUTCOME_CONFIG[o].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Call notes..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <SubmitButton />
      </div>
    </form>
  );
}
