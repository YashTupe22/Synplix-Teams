"use server";

import { revalidatePath } from "next/cache";
import {
  createQuotation as createQuotationService,
  updateQuotation as updateQuotationService,
  updateQuotationStatus as updateQuotationStatusService,
  deleteQuotation as deleteQuotationService,
  createInvoice as createInvoiceService,
  updateInvoice as updateInvoiceService,
  updateInvoiceStatus as updateInvoiceStatusService,
  createInvoiceFromQuotation as createInvoiceFromQuotationService,
  recordPayment as recordPaymentService,
  createExpense as createExpenseService,
  updateExpense as updateExpenseService,
  cancelExpense as cancelExpenseService,
} from "@/services/finance";
import {
  QuotationInsert, QuotationUpdate,
  InvoiceInsert, InvoiceUpdate,
  PaymentInsert, PaymentMethod,
  ExpenseInsert, ExpenseUpdate, ExpenseCategory,
} from "@/types/finance";

type ActionState = {
  error?: string;
  success?: boolean;
  id?: string;
};

// ── Quotation Actions ──

export async function createQuotationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data: QuotationInsert = {
      client_id: formData.get("client_id") as string,
      project_id: (formData.get("project_id") as string) || null,
      quotation_date: (formData.get("quotation_date") as string) || new Date().toISOString().split("T")[0],
      valid_until: (formData.get("valid_until") as string) || null,
      discount_amount: parseFloat(formData.get("discount_amount") as string) || 0,
      notes: (formData.get("notes") as string) || null,
    };

    if (!data.client_id) return { error: "Client is required" };

    // Parse items from JSON
    const itemsJson = formData.get("items") as string;
    const items = itemsJson ? JSON.parse(itemsJson) : [];

    const result = await createQuotationService(data, items);

    revalidatePath("/finance");
    revalidatePath("/finance/quotations");

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create quotation" };
  }
}

export async function updateQuotationAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Quotation ID is required" };

    const updates: QuotationUpdate = {};
    if (formData.has("client_id")) updates.client_id = formData.get("client_id") as string;
    if (formData.has("project_id")) updates.project_id = (formData.get("project_id") as string) || null;
    if (formData.has("quotation_date")) updates.quotation_date = formData.get("quotation_date") as string;
    if (formData.has("valid_until")) updates.valid_until = (formData.get("valid_until") as string) || null;
    if (formData.has("discount_amount")) updates.discount_amount = parseFloat(formData.get("discount_amount") as string) || 0;
    if (formData.has("notes")) updates.notes = (formData.get("notes") as string) || null;

    const result = await updateQuotationService(id, updates);

    revalidatePath("/finance");
    revalidatePath("/finance/quotations");
    revalidatePath(`/finance/quotations/${id}`);

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update quotation" };
  }
}

export async function updateQuotationStatusAction(
  id: string,
  status: string
): Promise<ActionState> {
  try {
    const result = await updateQuotationStatusService(id, status);

    revalidatePath("/finance");
    revalidatePath("/finance/quotations");
    revalidatePath(`/finance/quotations/${id}`);

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update status" };
  }
}

export async function deleteQuotationAction(
  id: string
): Promise<ActionState> {
  try {
    await deleteQuotationService(id);

    revalidatePath("/finance");
    revalidatePath("/finance/quotations");

    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete quotation" };
  }
}

export async function createInvoiceFromQuotationAction(
  quotationId: string
): Promise<ActionState> {
  try {
    const result = await createInvoiceFromQuotationService(quotationId);

    revalidatePath("/finance");
    revalidatePath("/finance/quotations");
    revalidatePath(`/finance/quotations/${quotationId}`);
    revalidatePath("/finance/invoices");

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create invoice from quotation" };
  }
}

// ── Invoice Actions ──

export async function createInvoiceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data: InvoiceInsert = {
      client_id: formData.get("client_id") as string,
      project_id: (formData.get("project_id") as string) || null,
      quotation_id: (formData.get("quotation_id") as string) || null,
      invoice_date: (formData.get("invoice_date") as string) || new Date().toISOString().split("T")[0],
      due_date: (formData.get("due_date") as string) || null,
      discount_amount: parseFloat(formData.get("discount_amount") as string) || 0,
      notes: (formData.get("notes") as string) || null,
    };

    if (!data.client_id) return { error: "Client is required" };

    const itemsJson = formData.get("items") as string;
    const items = itemsJson ? JSON.parse(itemsJson) : [];

    const result = await createInvoiceService(data, items);

    revalidatePath("/finance");
    revalidatePath("/finance/invoices");

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create invoice" };
  }
}

export async function updateInvoiceAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Invoice ID is required" };

    const updates: InvoiceUpdate = {};
    if (formData.has("client_id")) updates.client_id = formData.get("client_id") as string;
    if (formData.has("project_id")) updates.project_id = (formData.get("project_id") as string) || null;
    if (formData.has("invoice_date")) updates.invoice_date = formData.get("invoice_date") as string;
    if (formData.has("due_date")) updates.due_date = (formData.get("due_date") as string) || null;
    if (formData.has("discount_amount")) updates.discount_amount = parseFloat(formData.get("discount_amount") as string) || 0;
    if (formData.has("notes")) updates.notes = (formData.get("notes") as string) || null;

    const result = await updateInvoiceService(id, updates);

    revalidatePath("/finance");
    revalidatePath("/finance/invoices");
    revalidatePath(`/finance/invoices/${id}`);

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update invoice" };
  }
}

export async function updateInvoiceStatusAction(
  id: string,
  status: string
): Promise<ActionState> {
  try {
    const result = await updateInvoiceStatusService(id, status);

    revalidatePath("/finance");
    revalidatePath("/finance/invoices");
    revalidatePath(`/finance/invoices/${id}`);

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update status" };
  }
}

// ── Payment Actions ──

export async function recordPaymentAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data: PaymentInsert = {
      invoice_id: formData.get("invoice_id") as string,
      amount: parseFloat(formData.get("amount") as string),
      payment_date: (formData.get("payment_date") as string) || new Date().toISOString().split("T")[0],
      payment_method: formData.get("payment_method") as PaymentMethod,
      reference_number: (formData.get("reference_number") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    if (!data.invoice_id) return { error: "Invoice is required" };
    if (!data.amount || data.amount <= 0) return { error: "Amount must be greater than 0" };
    if (!data.payment_method) return { error: "Payment method is required" };

    const result = await recordPaymentService(data);

    revalidatePath("/finance");
    revalidatePath("/finance/payments");
    revalidatePath(`/finance/invoices/${data.invoice_id}`);

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to record payment" };
  }
}

// ── Expense Actions ──

export async function createExpenseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const data: ExpenseInsert = {
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      amount: parseFloat(formData.get("amount") as string),
      expense_date: (formData.get("expense_date") as string) || new Date().toISOString().split("T")[0],
      category: formData.get("category") as ExpenseCategory,
      project_id: (formData.get("project_id") as string) || null,
      notes: (formData.get("notes") as string) || null,
    };

    if (!data.title || data.title.trim().length === 0) return { error: "Title is required" };
    if (!data.amount || data.amount <= 0) return { error: "Amount must be greater than 0" };
    if (!data.category) return { error: "Category is required" };

    const result = await createExpenseService(data);

    revalidatePath("/finance");
    revalidatePath("/finance/expenses");

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create expense" };
  }
}

export async function updateExpenseAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const id = formData.get("id") as string;
    if (!id) return { error: "Expense ID is required" };

    const updates: ExpenseUpdate = {};
    if (formData.has("title")) updates.title = formData.get("title") as string;
    if (formData.has("description")) updates.description = (formData.get("description") as string) || null;
    if (formData.has("amount")) updates.amount = parseFloat(formData.get("amount") as string);
    if (formData.has("expense_date")) updates.expense_date = formData.get("expense_date") as string;
    if (formData.has("category")) updates.category = formData.get("category") as ExpenseCategory;
    if (formData.has("project_id")) updates.project_id = (formData.get("project_id") as string) || null;
    if (formData.has("notes")) updates.notes = (formData.get("notes") as string) || null;

    const result = await updateExpenseService(id, updates);

    revalidatePath("/finance");
    revalidatePath("/finance/expenses");
    revalidatePath(`/finance/expenses/${id}`);

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update expense" };
  }
}

export async function cancelExpenseAction(
  id: string
): Promise<ActionState> {
  try {
    const result = await cancelExpenseService(id);

    revalidatePath("/finance");
    revalidatePath("/finance/expenses");
    revalidatePath(`/finance/expenses/${id}`);

    return { success: true, id: result.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to cancel expense" };
  }
}
