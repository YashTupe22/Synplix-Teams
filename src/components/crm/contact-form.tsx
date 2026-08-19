"use client";

import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Contact, Company } from "@/types/crm";

type ActionState = { error?: string; success?: boolean; id?: string };

interface ContactFormProps {
  contact?: Contact;
  companies: Pick<Company, "id" | "name">[];
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Update Contact" : "Create Contact"}
    </Button>
  );
}

export function ContactForm({ contact, companies, action }: ContactFormProps) {
  const router = useRouter();
  const isEdit = !!contact;
  const [state, formAction] = useFormState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={contact.id} />}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className="mb-1.5 block text-sm font-medium">
                First Name <span className="text-destructive">*</span>
              </label>
              <Input id="first_name" name="first_name" defaultValue={contact?.first_name} required />
            </div>
            <div>
              <label htmlFor="last_name" className="mb-1.5 block text-sm font-medium">Last Name</label>
              <Input id="last_name" name="last_name" defaultValue={contact?.last_name ?? ""} />
            </div>
            <div>
              <label htmlFor="company_id" className="mb-1.5 block text-sm font-medium">Company</label>
              <select id="company_id" name="company_id" defaultValue={contact?.company_id ?? ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <option value="">Select company</option>
                {companies.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label htmlFor="job_title" className="mb-1.5 block text-sm font-medium">Job Title</label>
              <Input id="job_title" name="job_title" defaultValue={contact?.job_title ?? ""} />
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
              <Input id="email" name="email" type="email" defaultValue={contact?.email ?? ""} />
            </div>
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-medium">Phone</label>
              <Input id="phone" name="phone" defaultValue={contact?.phone ?? ""} />
            </div>
            <div>
              <label htmlFor="alternate_phone" className="mb-1.5 block text-sm font-medium">Alternate Phone</label>
              <Input id="alternate_phone" name="alternate_phone" defaultValue={contact?.alternate_phone ?? ""} />
            </div>
            <div>
              <label htmlFor="linkedin_url" className="mb-1.5 block text-sm font-medium">LinkedIn URL</label>
              <Input id="linkedin_url" name="linkedin_url" defaultValue={contact?.linkedin_url ?? ""} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">Notes</label>
            <textarea id="notes" name="notes" defaultValue={contact?.notes ?? ""} rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          </div>
        </CardContent>
      </Card>
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  );
}
