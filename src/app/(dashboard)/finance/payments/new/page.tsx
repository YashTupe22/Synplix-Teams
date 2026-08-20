import { Metadata } from "next";
import { requirePermission, Permission } from "@/lib/authorization-server";
import { getInvoiceById } from "@/services/finance";
import { PageHeader } from "@/components/page-header";
import { PaymentForm } from "@/components/finance/payment-form";

export const metadata: Metadata = {
  title: "Record Payment | Synplix Teams",
};

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  await requirePermission(Permission.FINANCE_MANAGE);
  const params = await searchParams;

  let invoice = null;
  if (params.invoice_id) {
    invoice = await getInvoiceById(params.invoice_id);
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Record Payment"
        description={invoice ? `For invoice ${invoice.invoice_number}` : "Record a payment against an invoice"}
      />
      <PaymentForm
        invoice={invoice || undefined}
        defaultInvoiceId={params.invoice_id}
      />
    </div>
  );
}
