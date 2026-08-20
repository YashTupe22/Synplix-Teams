"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { recordPaymentAction } from "@/app/(dashboard)/finance/actions";
import { PAYMENT_METHOD_CONFIG, PaymentMethod, Invoice } from "@/types/finance";

interface PaymentFormProps {
  invoice?: Invoice;
  defaultInvoiceId?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Recording..." : "Record Payment"}
    </Button>
  );
}

export function PaymentForm({ invoice, defaultInvoiceId }: PaymentFormProps) {
  const router = useRouter();

  const [state, formAction] = useFormState(recordPaymentAction, {
    error: undefined,
    success: undefined,
    id: undefined,
  });

  const balanceDue = invoice ? invoice.total_amount - invoice.amount_paid : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Payment</CardTitle>
      </CardHeader>
      <CardContent>
        {state.error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            Payment recorded successfully!
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="invoice_id" value={defaultInvoiceId || invoice?.id || ""} />

          {invoice && (
            <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice</span>
                <span className="font-medium">{invoice.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount</span>
                <span>₹{invoice.total_amount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already Paid</span>
                <span>₹{invoice.amount_paid.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-medium border-t pt-2">
                <span>Balance Due</span>
                <span className="text-yellow-600">₹{balanceDue.toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="payment-amount" className="block text-sm font-medium mb-1">
                Amount *
              </label>
              <input
                id="payment-amount"
                type="number"
                min="0.01"
                step="0.01"
                name="amount"
                max={balanceDue || undefined}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="0.00"
              />
              {balanceDue > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Max: ₹{balanceDue.toLocaleString("en-IN")}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="payment-method" className="block text-sm font-medium mb-1">
                Payment Method *
              </label>
              <select
                id="payment-method"
                name="payment_method"
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select method</option>
                {(Object.entries(PAYMENT_METHOD_CONFIG) as [PaymentMethod, { label: string }][]).map(
                  ([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="payment-date" className="block text-sm font-medium mb-1">
                Payment Date *
              </label>
              <input
                id="payment-date"
                type="date"
                name="payment_date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="payment-reference" className="block text-sm font-medium mb-1">
                Reference Number
              </label>
              <input
                id="payment-reference"
                type="text"
                name="reference_number"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="Transaction ID, cheque number, etc."
              />
            </div>
          </div>

          <div>
            <label htmlFor="payment-notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              id="payment-notes"
              name="notes"
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <SubmitButton />
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
