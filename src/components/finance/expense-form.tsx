"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createExpenseAction, updateExpenseAction } from "@/app/(dashboard)/finance/actions";
import { Expense, EXPENSE_CATEGORY_CONFIG, ExpenseCategory } from "@/types/finance";

interface Project {
  id: string;
  name: string;
  project_code: string;
}

interface ExpenseFormProps {
  expense?: Expense;
  projects: Project[];
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : isEdit ? "Update Expense" : "Create Expense"}
    </Button>
  );
}

export function ExpenseForm({ expense, projects }: ExpenseFormProps) {
  const router = useRouter();
  const action = expense ? updateExpenseAction : createExpenseAction;

  const [state, formAction] = useFormState(action, {
    error: undefined,
    success: undefined,
    id: undefined,
  });

  const isEdit = !!expense;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? "Edit Expense" : "New Expense"}</CardTitle>
      </CardHeader>
      <CardContent>
        {state.error && (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
            Expense {isEdit ? "updated" : "created"} successfully!
          </div>
        )}

        <form action={formAction} className="space-y-4">
          {isEdit && <input type="hidden" name="id" value={expense.id} />}

          <div>
            <label htmlFor="expense-title" className="block text-sm font-medium mb-1">
              Title *
            </label>
            <input
              id="expense-title"
              name="title"
              defaultValue={expense?.title || ""}
              required
              maxLength={500}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Enter expense title"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="expense-amount" className="block text-sm font-medium mb-1">
                Amount *
              </label>
              <input
                id="expense-amount"
                type="number"
                min="0.01"
                step="0.01"
                name="amount"
                defaultValue={expense?.amount || ""}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="expense-category" className="block text-sm font-medium mb-1">
                Category *
              </label>
              <select
                id="expense-category"
                name="category"
                defaultValue={expense?.category || ""}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {(Object.entries(EXPENSE_CATEGORY_CONFIG) as [ExpenseCategory, { label: string }][]).map(
                  ([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label htmlFor="expense-date" className="block text-sm font-medium mb-1">
                Date *
              </label>
              <input
                id="expense-date"
                type="date"
                name="expense_date"
                defaultValue={expense?.expense_date || new Date().toISOString().split("T")[0]}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="expense-project" className="block text-sm font-medium mb-1">
                Project
              </label>
              <select
                id="expense-project"
                name="project_id"
                defaultValue={expense?.project_id || ""}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.project_code} - {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="expense-description" className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              id="expense-description"
              name="description"
              rows={3}
              defaultValue={expense?.description || ""}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              placeholder="Describe the expense..."
            />
          </div>

          <div>
            <label htmlFor="expense-notes" className="block text-sm font-medium mb-1">
              Notes
            </label>
            <textarea
              id="expense-notes"
              name="notes"
              rows={2}
              defaultValue={expense?.notes || ""}
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
