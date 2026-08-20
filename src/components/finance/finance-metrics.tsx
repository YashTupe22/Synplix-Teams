import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Clock, AlertTriangle, Receipt, Wallet } from "lucide-react";
import { formatCurrency, FinanceMetrics } from "@/types/finance";

interface FinanceMetricsProps {
  metrics: FinanceMetrics;
}

export function FinanceMetricsCards({ metrics }: FinanceMetricsProps) {
  const cards = [
    {
      title: "Revenue This Month",
      value: metrics.revenueThisMonth,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Outstanding",
      value: metrics.outstanding,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Overdue",
      value: metrics.overdue,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Payments Received",
      value: metrics.paymentsReceived,
      icon: Wallet,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Expenses This Month",
      value: metrics.expensesThisMonth,
      icon: Receipt,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Net Cash Movement",
      value: metrics.netCashMovement,
      icon: TrendingUp,
      color: metrics.netCashMovement >= 0 ? "text-green-600" : "text-red-600",
      bgColor: metrics.netCashMovement >= 0 ? "bg-green-50" : "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`rounded-lg p-2 ${card.bgColor}`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.color}`}>
              {formatCurrency(card.value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function FinanceSummaryCards({ metrics }: FinanceMetricsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Quotation Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.quotationValue)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {metrics.acceptedQuotations} accepted
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Invoice Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.invoiceValue)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Paid Invoice Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.paidInvoiceValue)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Outstanding
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{formatCurrency(metrics.outstanding)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
