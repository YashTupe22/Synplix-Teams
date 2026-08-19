"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import Link from "next/link";

type ActionState = { error?: string; success?: boolean; id?: string };

interface ConvertToClientProps {
  opportunityId: string;
  contactId?: string | null;
  accountId?: string | null;
  teamMembers: { id: string; full_name: string | null; email: string }[];
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Converting..." : "Convert to Client"}
    </Button>
  );
}

export function ConvertToClient({
  opportunityId,
  contactId,
  accountId,
  teamMembers,
  action,
}: ConvertToClientProps) {
  const [state, formAction] = useFormState(action, null);

  if (state?.success && state.id) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Building2 className="size-4 text-green-600" />
            <span className="text-sm font-medium">Client Created</span>
            <Badge variant="outline" className="text-xs text-green-600">Success</Badge>
          </div>
          <Link
            href={`/clients/${state.id}`}
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            View Client →
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Convert to Client</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="opportunity_id" value={opportunityId} />
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="primary_contact_id" className="mb-1.5 block text-sm font-medium">
                Primary Contact
              </label>
              <select
                id="primary_contact_id"
                name="primary_contact_id"
                defaultValue={contactId ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Use lead contact</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name ?? m.email}
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
                defaultValue={accountId ?? ""}
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
          </div>
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Conversion notes..."
            />
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
