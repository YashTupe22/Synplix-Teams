"use client";

import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Company } from "@/types/crm";

type ActionState = { error?: string; success?: boolean; id?: string };

interface CompanyFormProps {
  company?: Company;
  action: (prevState: ActionState | null, formData: FormData) => Promise<ActionState>;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Update Company" : "Create Company"}
    </Button>
  );
}

export function CompanyForm({ company, action }: CompanyFormProps) {
  const router = useRouter();
  const isEdit = !!company;
  const [state, formAction] = useFormState(action, null);

  const fields: Array<{ id: string; label: string; required?: boolean; colSpan?: number; type?: string; placeholder?: string }> = [
    { id: "name", label: "Company Name", required: true, colSpan: 2 },
    { id: "website", label: "Website", placeholder: "https://..." },
    { id: "industry", label: "Industry", placeholder: "e.g. Technology" },
    { id: "email", label: "Email", type: "email" },
    { id: "phone", label: "Phone" },
    { id: "address", label: "Address", colSpan: 2 },
    { id: "city", label: "City" },
    { id: "state", label: "State" },
    { id: "country", label: "Country" },
    { id: "postal_code", label: "Postal Code" },
  ];

  return (
    <form action={formAction} className="space-y-6">
      {isEdit && <input type="hidden" name="id" value={company.id} />}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((f) => (
              <div key={f.id} className={f.colSpan === 2 ? "sm:col-span-2" : ""}>
                <label htmlFor={f.id} className="mb-1.5 block text-sm font-medium">
                  {f.label} {f.required && <span className="text-destructive">*</span>}
                </label>
                <Input
                  id={f.id}
                  name={f.id}
                  type={f.type ?? "text"}
                  defaultValue={company ? (company as unknown as Record<string, unknown>)[f.id] as string ?? "" : ""}
                  required={f.required}
                  placeholder={f.placeholder ?? ""}
                />
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="notes" className="mb-1.5 block text-sm font-medium">Notes</label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={company?.notes ?? ""}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
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
