import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/authorization-server";
import { Permission } from "@/lib/authorization";
import { notifyQuotationStatusChanged, notifyInvoiceCreated, notifyPaymentReceived } from "@/services/notification-integrations";
import type { PaginatedResult } from "@/types/clients";
import {
  QuotationInsert, QuotationUpdate, QuotationWithRelations,
  QuotationItemInsert, QuotationItem,
  InvoiceInsert, InvoiceUpdate, InvoiceWithRelations,
  InvoiceItemInsert, InvoiceItem,
  PaymentInsert, PaymentWithRelations,
  ExpenseInsert, ExpenseUpdate, ExpenseWithRelations,
  QuotationFilters, InvoiceFilters, PaymentFilters, ExpenseFilters,
  FinanceMetrics,
  calculateLineTotal, calculateQuotationTotals,
} from "@/types/finance";

// ============================================================
// QUOTATIONS
// ============================================================

export async function getQuotations(filters: QuotationFilters = {}): Promise<PaginatedResult<QuotationWithRelations>> {
  await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("quotations")
    .select(
      `
      *,
      client:clients!quotations_client_id_fkey(id, client_code, company:companies(name)),
      project:projects!quotations_project_id_fkey(id, name, project_code),
      creator:profiles!quotations_created_by_fkey(id, full_name, email)
    `,
      { count: "exact" }
    );

  if (filters.search) {
    query = query.ilike("quotation_number", `%${filters.search}%`);
  }
  if (filters.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }
  if (filters.client_id) {
    query = query.eq("client_id", filters.client_id);
  }
  if (filters.date_from) {
    query = query.gte("quotation_date", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("quotation_date", filters.date_to);
  }
  if (filters.min_amount !== undefined) {
    query = query.gte("total_amount", filters.min_amount);
  }
  if (filters.max_amount !== undefined) {
    query = query.lte("total_amount", filters.max_amount);
  }

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count || 0;
  return {
    data: (data as QuotationWithRelations[]) || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getQuotationById(id: string): Promise<QuotationWithRelations | null> {
  await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotations")
    .select(
      `
      *,
      client:clients!quotations_client_id_fkey(id, client_code, company:companies(name)),
      project:projects!quotations_project_id_fkey(id, name, project_code),
      creator:profiles!quotations_created_by_fkey(id, full_name, email),
      items:quotation_items(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as QuotationWithRelations;
}

export async function createQuotation(quotation: QuotationInsert, items: QuotationItemInsert[]): Promise<QuotationWithRelations> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  // Calculate totals from items
  const calculated = calculateQuotationTotals(items.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price, discount_amount: item.discount_amount || 0, tax_rate: item.tax_rate || 0 })), quotation.discount_amount || 0);

  const { data, error } = await supabase
    .from("quotations")
    .insert({
      ...quotation,
      created_by: profile.id,
      subtotal: calculated.subtotal,
      tax_amount: calculated.tax_amount,
      total_amount: calculated.total_amount,
    })
    .select()
    .single();

  if (error) throw error;

  // Insert items
  if (items.length > 0) {
    const itemInserts = items.map((item) => ({
      ...item,
      quotation_id: data.id,
      line_total: calculateLineTotal(item.quantity, item.unit_price, item.discount_amount || 0, item.tax_rate || 0),
    }));

    const { error: itemsError } = await supabase
      .from("quotation_items")
      .insert(itemInserts);

    if (itemsError) throw itemsError;
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "quotation_created",
    target_id: data.id,
    metadata: {
      quotation_number: data.quotation_number,
      client_id: data.client_id,
      total_amount: data.total_amount,
    },
  });

  return data as QuotationWithRelations;
}

export async function updateQuotation(id: string, quotation: QuotationUpdate): Promise<QuotationWithRelations> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  // Strip financial totals from update — they are calculated from items
  const { subtotal, tax_amount, total_amount, ...safeUpdates } = quotation;

  const { data, error } = await supabase
    .from("quotations")
    .update(safeUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "quotation_updated",
    target_id: data.id,
    metadata: { quotation_number: data.quotation_number },
  });

  return data as QuotationWithRelations;
}

export async function updateQuotationStatus(id: string, status: string): Promise<QuotationWithRelations> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  // Validate status is a valid enum value
  const validStatuses = ["draft", "sent", "accepted", "rejected", "expired", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid quotation status: ${status}`);
  }

  const { data, error } = await supabase
    .from("quotations")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: `quotation_${status}`,
    target_id: data.id,
    metadata: { quotation_number: data.quotation_number, new_status: status },
  });

  // Send notification for accepted/rejected quotations
  if (status === "accepted" || status === "rejected") {
    await notifyQuotationStatusChanged(
      profile.id,
      data.id,
      data.quotation_number,
      data.client_id,
      status as "accepted" | "rejected"
    ).catch(() => {});
  }

  return data as QuotationWithRelations;
}

export async function deleteQuotation(id: string): Promise<void> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const { error } = await supabase.from("quotations").delete().eq("id", id);
  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "quotation_deleted",
    target_id: id,
  });
}

// ============================================================
// QUOTATION ITEMS
// ============================================================

export async function getQuotationItems(quotationId: string): Promise<QuotationItem[]> {
  await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("quotation_items")
    .select("*")
    .eq("quotation_id", quotationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as QuotationItem[]) || [];
}

export async function addQuotationItem(item: QuotationItemInsert): Promise<QuotationItem> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const lineTotal = calculateLineTotal(item.quantity, item.unit_price, item.discount_amount || 0, item.tax_rate || 0);

  const { data, error } = await supabase
    .from("quotation_items")
    .insert({ ...item, line_total: lineTotal })
    .select()
    .single();

  if (error) throw error;

  // Recalculate quotation totals
  await recalculateQuotationTotals(item.quotation_id, supabase);

  return data as QuotationItem;
}

export async function updateQuotationItem(id: string, quotationId: string, item: Partial<QuotationItemInsert>): Promise<QuotationItem> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const lineTotal = calculateLineTotal(
    item.quantity || 1,
    item.unit_price || 0,
    item.discount_amount || 0,
    item.tax_rate || 0
  );

  const { data, error } = await supabase
    .from("quotation_items")
    .update({ ...item, line_total: lineTotal })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await recalculateQuotationTotals(quotationId, supabase);

  return data as QuotationItem;
}

export async function deleteQuotationItem(id: string, quotationId: string): Promise<void> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const { error } = await supabase.from("quotation_items").delete().eq("id", id);
  if (error) throw error;

  await recalculateQuotationTotals(quotationId, supabase);
}

async function recalculateQuotationTotals(quotationId: string, supabase: ReturnType<typeof createClient> extends Promise<infer R> ? R : never) {
  const { data: items } = await supabase
    .from("quotation_items")
    .select("quantity, unit_price, discount_amount, tax_rate")
    .eq("quotation_id", quotationId);

  const { data: quotation } = await supabase
    .from("quotations")
    .select("discount_amount")
    .eq("id", quotationId)
    .single();

  if (!quotation) return;

  const totals = calculateQuotationTotals(items || [], quotation.discount_amount || 0);

  await supabase
    .from("quotations")
    .update({
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      total_amount: totals.total_amount,
    })
    .eq("id", quotationId);
}

// ============================================================
// INVOICES
// ============================================================

export async function getInvoices(filters: InvoiceFilters = {}): Promise<PaginatedResult<InvoiceWithRelations>> {
  await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("invoices")
    .select(
      `
      *,
      client:clients!invoices_client_id_fkey(id, client_code, company:companies(name)),
      project:projects!invoices_project_id_fkey(id, name, project_code),
      quotation:quotations!invoices_quotation_id_fkey(id, quotation_number),
      creator:profiles!invoices_created_by_fkey(id, full_name, email)
    `,
      { count: "exact" }
    );

  if (filters.search) {
    query = query.ilike("invoice_number", `%${filters.search}%`);
  }
  if (filters.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }
  if (filters.client_id) {
    query = query.eq("client_id", filters.client_id);
  }
  if (filters.project_id) {
    query = query.eq("project_id", filters.project_id);
  }
  if (filters.date_from) {
    query = query.gte("invoice_date", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("invoice_date", filters.date_to);
  }
  if (filters.due_date_from) {
    query = query.gte("due_date", filters.due_date_from);
  }
  if (filters.due_date_to) {
    query = query.lte("due_date", filters.due_date_to);
  }
  if (filters.min_amount !== undefined) {
    query = query.gte("total_amount", filters.min_amount);
  }
  if (filters.max_amount !== undefined) {
    query = query.lte("total_amount", filters.max_amount);
  }

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count || 0;
  return {
    data: (data as InvoiceWithRelations[]) || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getInvoiceById(id: string): Promise<InvoiceWithRelations | null> {
  await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoices")
    .select(
      `
      *,
      client:clients!invoices_client_id_fkey(id, client_code, company:companies(name)),
      project:projects!invoices_project_id_fkey(id, name, project_code),
      quotation:quotations!invoices_quotation_id_fkey(id, quotation_number),
      creator:profiles!invoices_created_by_fkey(id, full_name, email),
      items:invoice_items(*),
      payments:payments(*, recorder:profiles!payments_recorded_by_fkey(id, full_name, email))
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as InvoiceWithRelations;
}

export async function createInvoice(invoice: InvoiceInsert, items: InvoiceItemInsert[]): Promise<InvoiceWithRelations> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  // Calculate totals from items
  const calculated = calculateQuotationTotals(items.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price, discount_amount: item.discount_amount || 0, tax_rate: item.tax_rate || 0 })), invoice.discount_amount || 0);

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      ...invoice,
      created_by: profile.id,
      subtotal: calculated.subtotal,
      tax_amount: calculated.tax_amount,
      total_amount: calculated.total_amount,
      balance_due: calculated.total_amount - (invoice.amount_paid || 0),
    })
    .select()
    .single();

  if (error) throw error;

  // Insert items
  if (items.length > 0) {
    const itemInserts = items.map((item) => ({
      ...item,
      invoice_id: data.id,
      line_total: calculateLineTotal(item.quantity, item.unit_price, item.discount_amount || 0, item.tax_rate || 0),
    }));

    const { error: itemsError } = await supabase
      .from("invoice_items")
      .insert(itemInserts);

    if (itemsError) throw itemsError;
  }

  // Audit log
  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "invoice_created",
    target_id: data.id,
    metadata: {
      invoice_number: data.invoice_number,
      client_id: data.client_id,
      total_amount: data.total_amount,
    },
  });

  // Send notification
  await notifyInvoiceCreated(
    profile.id,
    data.id,
    data.invoice_number,
    data.client_id
  ).catch(() => {});

  return data as InvoiceWithRelations;
}

export async function updateInvoice(id: string, invoice: InvoiceUpdate): Promise<InvoiceWithRelations> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  // Strip financial totals from update — they are calculated from items
  const { subtotal, tax_amount, total_amount, amount_paid, balance_due, ...safeUpdates } = invoice;

  const { data, error } = await supabase
    .from("invoices")
    .update(safeUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "invoice_updated",
    target_id: data.id,
    metadata: { invoice_number: data.invoice_number },
  });

  return data as InvoiceWithRelations;
}

export async function updateInvoiceStatus(id: string, status: string): Promise<InvoiceWithRelations> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  // Validate status is a valid enum value
  const validStatuses = ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid invoice status: ${status}`);
  }

  const { data, error } = await supabase
    .from("invoices")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: `invoice_${status}`,
    target_id: data.id,
    metadata: { invoice_number: data.invoice_number, new_status: status },
  });

  return data as InvoiceWithRelations;
}

export async function createInvoiceFromQuotation(quotationId: string): Promise<InvoiceWithRelations> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  // Get quotation with items
  const { data: quotation, error: qError } = await supabase
    .from("quotations")
    .select("*, items:quotation_items(*)")
    .eq("id", quotationId)
    .single();

  if (qError || !quotation) throw new Error("Quotation not found");

  // Create invoice from quotation
  const invoice = await createInvoice(
    {
      client_id: quotation.client_id,
      project_id: quotation.project_id,
      quotation_id: quotation.id,
      invoice_date: new Date().toISOString().split("T")[0],
      due_date: quotation.valid_until,
      notes: quotation.notes,
      subtotal: quotation.subtotal,
      discount_amount: quotation.discount_amount,
      tax_amount: quotation.tax_amount,
      total_amount: quotation.total_amount,
    },
    (quotation.items || []).map((item: QuotationItem) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      discount_amount: item.discount_amount,
      tax_rate: item.tax_rate,
      line_total: item.line_total,
    }))
  );

  return invoice;
}

// ============================================================
// INVOICE ITEMS
// ============================================================

export async function getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
  await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invoice_items")
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as InvoiceItem[]) || [];
}

export async function addInvoiceItem(item: InvoiceItemInsert): Promise<InvoiceItem> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const lineTotal = calculateLineTotal(item.quantity, item.unit_price, item.discount_amount || 0, item.tax_rate || 0);

  const { data, error } = await supabase
    .from("invoice_items")
    .insert({ ...item, line_total: lineTotal })
    .select()
    .single();

  if (error) throw error;

  await recalculateInvoiceTotals(item.invoice_id, supabase);

  return data as InvoiceItem;
}

export async function updateInvoiceItem(id: string, invoiceId: string, item: Partial<InvoiceItemInsert>): Promise<InvoiceItem> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const lineTotal = calculateLineTotal(
    item.quantity || 1,
    item.unit_price || 0,
    item.discount_amount || 0,
    item.tax_rate || 0
  );

  const { data, error } = await supabase
    .from("invoice_items")
    .update({ ...item, line_total: lineTotal })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await recalculateInvoiceTotals(invoiceId, supabase);

  return data as InvoiceItem;
}

export async function deleteInvoiceItem(id: string, invoiceId: string): Promise<void> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const { error } = await supabase.from("invoice_items").delete().eq("id", id);
  if (error) throw error;

  await recalculateInvoiceTotals(invoiceId, supabase);
}

async function recalculateInvoiceTotals(invoiceId: string, supabase: ReturnType<typeof createClient> extends Promise<infer R> ? R : never) {
  const { data: items } = await supabase
    .from("invoice_items")
    .select("quantity, unit_price, discount_amount, tax_rate")
    .eq("invoice_id", invoiceId);

  const { data: invoice } = await supabase
    .from("invoices")
    .select("discount_amount, amount_paid")
    .eq("id", invoiceId)
    .single();

  if (!invoice) return;

  const totals = calculateQuotationTotals(items || [], invoice.discount_amount || 0);

  await supabase
    .from("invoices")
    .update({
      subtotal: totals.subtotal,
      tax_amount: totals.tax_amount,
      total_amount: totals.total_amount,
      balance_due: totals.total_amount - (invoice.amount_paid || 0),
    })
    .eq("id", invoiceId);
}

// ============================================================
// PAYMENTS
// ============================================================

export async function getPayments(filters: PaymentFilters = {}): Promise<PaginatedResult<PaymentWithRelations>> {
  await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("payments")
    .select(
      `
      *,
      invoice:invoices!payments_invoice_id_fkey(id, invoice_number, total_amount),
      recorder:profiles!payments_recorded_by_fkey(id, full_name, email)
    `,
      { count: "exact" }
    );

  if (filters.invoice_id) {
    query = query.eq("invoice_id", filters.invoice_id);
  }
  if (filters.payment_method && filters.payment_method.length > 0) {
    query = query.in("payment_method", filters.payment_method);
  }
  if (filters.date_from) {
    query = query.gte("payment_date", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("payment_date", filters.date_to);
  }

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count || 0;
  return {
    data: (data as PaymentWithRelations[]) || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPaymentById(id: string): Promise<PaymentWithRelations | null> {
  await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payments")
    .select(
      `
      *,
      invoice:invoices!payments_invoice_id_fkey(id, invoice_number, total_amount),
      recorder:profiles!payments_recorded_by_fkey(id, full_name, email)
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as PaymentWithRelations;
}

export async function recordPayment(payment: PaymentInsert): Promise<PaymentWithRelations> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("payments")
    .insert({
      ...payment,
      recorded_by: profile.id,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "payment_recorded",
    target_id: data.id,
    metadata: {
      invoice_id: data.invoice_id,
      amount: data.amount,
      payment_method: data.payment_method,
    },
  });

  // Send notification
  const { data: invoice } = await supabase
    .from("invoices")
    .select("invoice_number, client_id")
    .eq("id", data.invoice_id)
    .single();

  if (invoice) {
    await notifyPaymentReceived(
      profile.id,
      data.invoice_id,
      invoice.invoice_number,
      invoice.client_id
    ).catch(() => {});
  }

  return data as PaymentWithRelations;
}

// ============================================================
// EXPENSES
// ============================================================

export async function getExpenses(filters: ExpenseFilters = {}): Promise<PaginatedResult<ExpenseWithRelations>> {
  await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from("expenses")
    .select(
      `
      *,
      project:projects!expenses_project_id_fkey(id, name, project_code),
      creator:profiles!expenses_created_by_fkey(id, full_name, email)
    `,
      { count: "exact" }
    );

  if (filters.search) {
    query = query.ilike("title", `%${filters.search}%`);
  }
  if (filters.status && filters.status.length > 0) {
    query = query.in("status", filters.status);
  }
  if (filters.category && filters.category.length > 0) {
    query = query.in("category", filters.category);
  }
  if (filters.project_id) {
    query = query.eq("project_id", filters.project_id);
  }
  if (filters.date_from) {
    query = query.gte("expense_date", filters.date_from);
  }
  if (filters.date_to) {
    query = query.lte("expense_date", filters.date_to);
  }
  if (filters.min_amount !== undefined) {
    query = query.gte("amount", filters.min_amount);
  }
  if (filters.max_amount !== undefined) {
    query = query.lte("amount", filters.max_amount);
  }

  query = query.order("created_at", { ascending: false });
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count || 0;
  return {
    data: (data as ExpenseWithRelations[]) || [],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getExpenseById(id: string): Promise<ExpenseWithRelations | null> {
  await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      *,
      project:projects!expenses_project_id_fkey(id, name, project_code),
      creator:profiles!expenses_created_by_fkey(id, full_name, email)
    `
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ExpenseWithRelations;
}

export async function createExpense(expense: ExpenseInsert): Promise<ExpenseWithRelations> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      ...expense,
      created_by: profile.id,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "expense_created",
    target_id: data.id,
    metadata: {
      title: data.title,
      amount: data.amount,
      category: data.category,
    },
  });

  return data as ExpenseWithRelations;
}

export async function updateExpense(id: string, expense: ExpenseUpdate): Promise<ExpenseWithRelations> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .update(expense)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "expense_updated",
    target_id: data.id,
    metadata: { title: data.title },
  });

  return data as ExpenseWithRelations;
}

export async function cancelExpense(id: string): Promise<ExpenseWithRelations> {
  const profile = await requirePermission(Permission.FINANCE_MANAGE);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .update({ status: "cancelled" })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    actor_id: profile.id,
    actor_email: profile.email,
    action: "expense_cancelled",
    target_id: data.id,
    metadata: { title: data.title },
  });

  return data as ExpenseWithRelations;
}

// ============================================================
// FINANCE METRICS
// ============================================================

export async function getFinanceMetrics(): Promise<FinanceMetrics> {
  const profile = await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
  const today = now.toISOString().split("T")[0];

  const [invoicesRes, paymentsRes, expensesRes, quotationsRes] = await Promise.all([
    // All non-cancelled invoices for outstanding/overdue
    supabase
      .from("invoices")
      .select("total_amount, amount_paid, balance_due, status, due_date")
      .neq("status", "cancelled")
      .limit(5000),

    // Payments this month
    supabase
      .from("payments")
      .select("amount")
      .gte("payment_date", monthStart)
      .lte("payment_date", monthEnd)
      .limit(5000),

    // Expenses this month
    supabase
      .from("expenses")
      .select("amount")
      .eq("status", "recorded")
      .gte("expense_date", monthStart)
      .lte("expense_date", monthEnd)
      .limit(5000),

    // Quotations
    supabase
      .from("quotations")
      .select("total_amount, status")
      .neq("status", "cancelled")
      .neq("status", "rejected")
      .limit(5000),
  ]);

  const invoices = invoicesRes.data || [];
  const payments = paymentsRes.data || [];
  const expenses = expensesRes.data || [];
  const quotations = quotationsRes.data || [];

  // Revenue = sum of paid invoice amounts this month
  const revenueThisMonth = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Outstanding = sum of balance_due for non-cancelled, non-paid invoices
  const outstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + (Number(i.balance_due) || 0), 0);

  // Overdue = sum of balance_due where due_date < today
  const overdue = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled" && i.due_date && i.due_date < today)
    .reduce((sum, i) => sum + (Number(i.balance_due) || 0), 0);

  const paymentsReceived = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const expensesThisMonth = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const netCashMovement = paymentsReceived - expensesThisMonth;

  const quotationValue = quotations.reduce((sum, q) => sum + (Number(q.total_amount) || 0), 0);
  const acceptedQuotations = quotations.filter((q) => q.status === "accepted").length;
  const invoiceValue = invoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const paidInvoiceValue = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);

  return {
    revenueThisMonth,
    outstanding,
    overdue,
    paymentsReceived,
    expensesThisMonth,
    netCashMovement,
    quotationValue,
    acceptedQuotations,
    invoiceValue,
    paidInvoiceValue,
  };
}

// ============================================================
// CLIENT BILLING
// ============================================================

export async function getClientBilling(clientId: string) {
  const profile = await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const [quotationsRes, invoicesRes] = await Promise.all([
    supabase
      .from("quotations")
      .select("id, quotation_number, status, total_amount, quotation_date")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("invoices")
      .select("id, invoice_number, status, total_amount, amount_paid, balance_due, invoice_date, due_date")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const quotations = quotationsRes.data || [];
  const invoices = invoicesRes.data || [];

  const totalInvoiced = invoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (Number(i.amount_paid) || 0), 0);
  const outstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + (Number(i.balance_due) || 0), 0);
  const today = new Date().toISOString().split("T")[0];
  const overdue = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled" && i.due_date && i.due_date < today)
    .reduce((sum, i) => sum + (Number(i.balance_due) || 0), 0);

  return {
    quotations,
    invoices,
    totalInvoiced,
    totalPaid,
    outstanding,
    overdue,
  };
}

// ============================================================
// PROJECT BILLING
// ============================================================

export async function getProjectBilling(projectId: string) {
  const profile = await requirePermission(Permission.FINANCE_VIEW);
  const supabase = await createClient();

  const [quotationsRes, invoicesRes] = await Promise.all([
    supabase
      .from("quotations")
      .select("id, quotation_number, status, total_amount, quotation_date")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(100),

    supabase
      .from("invoices")
      .select("id, invoice_number, status, total_amount, amount_paid, balance_due, invoice_date, due_date")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  const quotations = quotationsRes.data || [];
  const invoices = invoicesRes.data || [];

  const totalBilled = invoices.reduce((sum, i) => sum + (Number(i.total_amount) || 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (Number(i.amount_paid) || 0), 0);
  const outstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "cancelled")
    .reduce((sum, i) => sum + (Number(i.balance_due) || 0), 0);

  return {
    quotations,
    invoices,
    totalBilled,
    totalPaid,
    outstanding,
  };
}
