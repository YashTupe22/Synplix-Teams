// ============================================================
// Finance Types
// ============================================================

// ── Enums ──

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired" | "cancelled";
export type InvoiceStatus = "draft" | "sent" | "partially_paid" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "bank_transfer" | "upi" | "cash" | "card" | "cheque" | "other";
export type ExpenseCategory = "software" | "marketing" | "travel" | "office" | "equipment" | "contractor" | "operations" | "other";
export type ExpenseStatus = "recorded" | "cancelled";

// ── Quotation ──

export interface Quotation {
  id: string;
  quotation_number: string;
  client_id: string;
  project_id: string | null;
  created_by: string;
  status: QuotationStatus;
  quotation_date: string;
  valid_until: string | null;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuotationInsert {
  id?: string;
  client_id: string;
  project_id?: string | null;
  created_by?: string;
  status?: QuotationStatus;
  quotation_date?: string;
  valid_until?: string | null;
  subtotal?: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount?: number;
  notes?: string | null;
}

export interface QuotationUpdate {
  client_id?: string;
  project_id?: string | null;
  status?: QuotationStatus;
  quotation_date?: string;
  valid_until?: string | null;
  subtotal?: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount?: number;
  notes?: string | null;
}

export interface QuotationWithRelations extends Quotation {
  client?: { id: string; client_code: string; company?: { name: string } | null };
  project?: { id: string; name: string; project_code: string } | null;
  creator?: { id: string; full_name: string | null; email: string };
  items?: QuotationItem[];
}

// ── Quotation Item ──

export interface QuotationItem {
  id: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
  created_at: string;
}

export interface QuotationItemInsert {
  id?: string;
  quotation_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_rate?: number;
  line_total?: number;
}

export interface QuotationItemUpdate {
  description?: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
  tax_rate?: number;
  line_total?: number;
}

// ── Invoice ──

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  project_id: string | null;
  quotation_id: string | null;
  created_by: string;
  invoice_date: string;
  due_date: string | null;
  status: InvoiceStatus;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceInsert {
  id?: string;
  client_id: string;
  project_id?: string | null;
  quotation_id?: string | null;
  created_by?: string;
  invoice_date?: string;
  due_date?: string | null;
  status?: InvoiceStatus;
  subtotal?: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount?: number;
  amount_paid?: number;
  balance_due?: number;
  notes?: string | null;
}

export interface InvoiceUpdate {
  client_id?: string;
  project_id?: string | null;
  quotation_id?: string | null;
  invoice_date?: string;
  due_date?: string | null;
  status?: InvoiceStatus;
  subtotal?: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount?: number;
  amount_paid?: number;
  balance_due?: number;
  notes?: string | null;
}

export interface InvoiceWithRelations extends Invoice {
  client?: { id: string; client_code: string; company?: { name: string } | null };
  project?: { id: string; name: string; project_code: string } | null;
  quotation?: { id: string; quotation_number: string } | null;
  creator?: { id: string; full_name: string | null; email: string };
  items?: InvoiceItem[];
  payments?: PaymentWithRelations[];
}

// ── Invoice Item ──

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  tax_rate: number;
  line_total: number;
  created_at: string;
}

export interface InvoiceItemInsert {
  id?: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount?: number;
  tax_rate?: number;
  line_total?: number;
}

export interface InvoiceItemUpdate {
  description?: string;
  quantity?: number;
  unit_price?: number;
  discount_amount?: number;
  tax_rate?: number;
  line_total?: number;
}

// ── Payment ──

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference_number: string | null;
  notes: string | null;
  recorded_by: string;
  created_at: string;
}

export interface PaymentInsert {
  id?: string;
  invoice_id: string;
  amount: number;
  payment_date?: string;
  payment_method: PaymentMethod;
  reference_number?: string | null;
  notes?: string | null;
  recorded_by?: string;
}

export interface PaymentWithRelations extends Payment {
  invoice?: { id: string; invoice_number: string; total_amount: number };
  recorder?: { id: string; full_name: string | null; email: string };
}

// ── Expense ──

export interface Expense {
  id: string;
  title: string;
  description: string | null;
  amount: number;
  expense_date: string;
  category: ExpenseCategory;
  project_id: string | null;
  created_by: string;
  status: ExpenseStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExpenseInsert {
  id?: string;
  title: string;
  description?: string | null;
  amount: number;
  expense_date?: string;
  category: ExpenseCategory;
  project_id?: string | null;
  created_by?: string;
  status?: ExpenseStatus;
  notes?: string | null;
}

export interface ExpenseUpdate {
  title?: string;
  description?: string | null;
  amount?: number;
  expense_date?: string;
  category?: ExpenseCategory;
  project_id?: string | null;
  status?: ExpenseStatus;
  notes?: string | null;
}

export interface ExpenseWithRelations extends Expense {
  project?: { id: string; name: string; project_code: string } | null;
  creator?: { id: string; full_name: string | null; email: string };
}

// ── Config Constants ──

export const QUOTATION_STATUS_CONFIG: Record<QuotationStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "text-gray-600", bgColor: "bg-gray-100" },
  sent: { label: "Sent", color: "text-blue-600", bgColor: "bg-blue-100" },
  accepted: { label: "Accepted", color: "text-green-600", bgColor: "bg-green-100" },
  rejected: { label: "Rejected", color: "text-red-600", bgColor: "bg-red-100" },
  expired: { label: "Expired", color: "text-orange-600", bgColor: "bg-orange-100" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", bgColor: "bg-muted" },
};

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: "Draft", color: "text-gray-600", bgColor: "bg-gray-100" },
  sent: { label: "Sent", color: "text-blue-600", bgColor: "bg-blue-100" },
  partially_paid: { label: "Partially Paid", color: "text-yellow-600", bgColor: "bg-yellow-100" },
  paid: { label: "Paid", color: "text-green-600", bgColor: "bg-green-100" },
  overdue: { label: "Overdue", color: "text-red-600", bgColor: "bg-red-100" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", bgColor: "bg-muted" },
};

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string }> = {
  bank_transfer: { label: "Bank Transfer" },
  upi: { label: "UPI" },
  cash: { label: "Cash" },
  card: { label: "Card" },
  cheque: { label: "Cheque" },
  other: { label: "Other" },
};

export const EXPENSE_CATEGORY_CONFIG: Record<ExpenseCategory, { label: string }> = {
  software: { label: "Software" },
  marketing: { label: "Marketing" },
  travel: { label: "Travel" },
  office: { label: "Office" },
  equipment: { label: "Equipment" },
  contractor: { label: "Contractor" },
  operations: { label: "Operations" },
  other: { label: "Other" },
};

export const EXPENSE_STATUS_CONFIG: Record<ExpenseStatus, { label: string; color: string; bgColor: string }> = {
  recorded: { label: "Recorded", color: "text-green-600", bgColor: "bg-green-100" },
  cancelled: { label: "Cancelled", color: "text-muted-foreground", bgColor: "bg-muted" },
};

// ── Filters ──

export interface QuotationFilters {
  search?: string;
  status?: QuotationStatus[];
  client_id?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  limit?: number;
}

export interface InvoiceFilters {
  search?: string;
  status?: InvoiceStatus[];
  client_id?: string;
  project_id?: string;
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  limit?: number;
}

export interface PaymentFilters {
  invoice_id?: string;
  client_id?: string;
  payment_method?: PaymentMethod[];
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseFilters {
  search?: string;
  status?: ExpenseStatus[];
  category?: ExpenseCategory[];
  project_id?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  limit?: number;
}

// ── Metrics ──

export interface FinanceMetrics {
  revenueThisMonth: number;
  outstanding: number;
  overdue: number;
  paymentsReceived: number;
  expensesThisMonth: number;
  netCashMovement: number;
  quotationValue: number;
  acceptedQuotations: number;
  invoiceValue: number;
  paidInvoiceValue: number;
}

// ── Line Item Calculation ──

export function calculateLineTotal(quantity: number, unitPrice: number, discountAmount: number, taxRate: number): number {
  const subtotal = quantity * unitPrice;
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * (taxRate / 100);
  return afterDiscount + tax;
}

export function calculateQuotationTotals(items: { quantity: number; unit_price: number; discount_amount: number; tax_rate: number }[], discountAmount: number): { subtotal: number; tax_amount: number; total_amount: number } {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const itemTax = items.reduce((sum, item) => {
    const lineSubtotal = item.quantity * item.unit_price - item.discount_amount;
    return sum + lineSubtotal * (item.tax_rate / 100);
  }, 0);
  const total = subtotal - discountAmount + itemTax;
  return { subtotal, tax_amount: itemTax, total_amount: total };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
