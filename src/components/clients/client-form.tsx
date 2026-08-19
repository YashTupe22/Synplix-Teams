"use client";

import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientStatus } from "@/types/clients";

type ActionState = { error?: string; success?: boolean; id?: string };

interface ClientFormProps {
  client?: {
    id: string;
    primary_contact_id: string | null;
    account_manager_id: string | null;
    notes: string | null;
    status: ClientStatus;
  };
  companies: { id: string; name: string }[];
  contacts: { id: string; first_name: string; last_name: string | null; company_id: string | null }[];
  teamMembers: { id: string; full_name: string | null; email: string }[];
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Client"}
    </Button>
  );
}

export function ClientForm({ client, companies, contacts, teamMembers, action }: ClientFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(action, null);

  const filteredContacts = client
    ? contacts
    : contacts;

  return (
    <form action={formAction} className="space-y-6">
      {client && <input type="hidden" name="id" value={client.id} />}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {!client && (
              <div>
                <label htmlFor="company_id" className="mb-1.5 block text-sm font-medium">
                  Company <span className="text-destructive">*</span>
                </label>
                <select
                  id="company_id"
                  name="company_id"
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Select company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {client && (
              <input type="hidden" name="company_id" value={client.id} />
            )}
            <div>
              <label htmlFor="primary_contact_id" className="mb-1.5 block text-sm font-medium">
                Primary Contact
              </label>
              <select
                id="primary_contact_id"
                name="primary_contact_id"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select contact</option>
                {filteredContacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name ?? ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="account_manager_id" className="mb-1.5 block text-sm font-medium">
                Account Manager
              </label>
              <select
                id="account_manager_id"
                name="account_manager_id"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select manager</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name ?? m.email}
                  </option>
                ))}
              </select>
            </div>
            {client && (
              <div>
                <label htmlFor="status" className="mb-1.5 block text-sm font-medium">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={client.status}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="on_hold">On Hold</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={client?.notes ?? ""}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Client notes..."
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
