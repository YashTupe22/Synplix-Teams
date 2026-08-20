"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createInvoiceAction, updateInvoiceAction } from "@/app/(dashboard)/finance/actions";
import { LineItemsEditor } from "./line-items-editor";
import { Invoice, InvoiceItem } from "@/types/finance";

interface Client {
  id: string;
  client_code: string;
  company?: { name: string } | null;
}

interface Project {
  id: string;
  name: string;
  project_code: string;
}

interface InvoiceFormProps {
  invoice?: Invoice & { items?: InvoiceItem[] };
  clients: Client[];
  projects: Project[];
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultQuotationId?: string;
}

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Update Invoice" : "Create Invoice"}
    </Button>
  );
}

export function InvoiceForm({
  invoice,
  clients,
  projects,
  defaultClientId,
  defaultProjectId,
  defaultQuotationId,
}: InvoiceFormProps) {
  const router = useRouter();
  const action = invoice ? updateInvoiceAction : createInvoiceAction;

  const [state, formAction] = useFormState(action, {
    error: undefined,
    success: undefined,
    id: undefined,
  });

  const isEdit = !!invoice;

  const [selectedClientId, setSelectedClientId] = useState(defaultClientId || invoice?.client_id || "");
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId || invoice?.project_id || "");
  const [items, setItems] = useState<LineItem[]>(
    invoice?.items?.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: item.discount_amount,
      tax_rate: item.tax_rate,
      line_total: item.line_total,
    })) || []
  );
  const [discountAmount, setDiscountAmount] = useState(invoice?.discount_amount || 0);

  const filteredProjects = projects.filter((p) => !selectedClientId || true);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const itemTax = items.reduce((sum, item) => {
    const lineSubtotal = item.quantity * item.unit_price - item.discount_amount;
    return sum + lineSubtotal * (item.tax_rate / 100);
  }, 0);
  const total = subtotal - discountAmount + itemTax;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("items", JSON.stringify(items));
    formData.set("client_id", selectedClientId);
    if (selectedProjectId) formData.set("project_id", selectedProjectId);
    if (defaultQuotationId) formData.set("quotation_id", defaultQuotationId);
    formAction(formData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Invoice" : "New Invoice"}</CardTitle>
      </CardHeader>
      <CardContent>
        {state.error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            Invoice {isEdit ? "updated" : "created"} successfully!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={invoice.id} />}
          {defaultQuotationId && <input type="hidden" name="quotation_id" value={defaultQuotationId} />}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="invoice-client" className="block text-sm font-medium mb-1">
                Client *
              </label>
              <select
                id="invoice-client"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
                disabled={isEdit}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.client_code} - {c.company?.name || "No company"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="invoice-project" className="block text-sm font-medium mb-1">
                Project
              </label>
              <select
                id="invoice-project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                disabled={isEdit}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">No project</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_code} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="invoice-date" className="block text-sm font-medium mb-1">
                Invoice Date *
              </label>
              <input
                id="invoice-date"
                type="date"
                name="invoice_date"
                defaultValue={invoice?.invoice_date || new Date().toISOString().split("T")[0]}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="invoice-due-date" className="block text-sm font-medium mb-1">
                Due Date
              </label>
              <input
                id="invoice-due-date"
                type="date"
                name="due_date"
                defaultValue={invoice?.due_date || ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="invoice-discount" className="block text-sm font-medium mb-1">
                Discount Amount
              </label>
              <input
                id="invoice-discount"
                type="number"
                min="0"
                step="0.01"
                name="discount_amount"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Line Items</label>
            <LineItemsEditor items={items} onChange={setItems} />
          </div>

          <div className="flex justify-end border-t pt-3">
            <div className="w-64 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-₹{discountAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>₹{itemTax.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Total</span>
                <span>₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="invoice-notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              id="invoice-notes"
              name="notes"
              rows={3}
              defaultValue={invoice?.notes || ""}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <SubmitButton isEdit={isEdit} />
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
