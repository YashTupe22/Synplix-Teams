import { requirePermission, Permission } from "@/lib/authorization-server";
import { getOpportunities } from "@/services/sales";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SALES_STAGE_CONFIG, OPEN_STAGES } from "@/types/sales";
import type { SalesStage, OpportunityWithRelations } from "@/types/sales";
import Link from "next/link";

export const metadata = {
  title: "Pipeline | Sales | Synplix Teams",
};

export default async function PipelinePage() {
  const profile = await requirePermission(Permission.SALES_VIEW);
  const data = await getOpportunities({ limit: 100 }, profile);

  const grouped = OPEN_STAGES.reduce(
    (acc, stage) => {
      acc[stage] = data.data.filter((opp) => opp.stage === stage);
      return acc;
    },
    {} as Record<SalesStage, OpportunityWithRelations[]>
  );

  const formatCurrency = (value: number, currency: string = "INR") =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Pipeline"
        description="Drag and drop opportunities across stages"
      />

      <div className="flex gap-4 overflow-x-auto pb-4">
        {OPEN_STAGES.map((stage) => {
          const config = SALES_STAGE_CONFIG[stage];
          const opps = grouped[stage] ?? [];
          const totalValue = opps.reduce((sum, o) => sum + (o.value || 0), 0);

          return (
            <div key={stage} className="min-w-[300px] flex-1">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${config.bgColor}`} />
                  <h3 className="text-sm font-medium">{config.label}</h3>
                </div>
                <span className="text-xs text-muted-foreground">
                  {opps.length} &middot; {formatCurrency(totalValue)}
                </span>
              </div>

              <div className="space-y-2">
                {opps.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex items-center justify-center p-4">
                      <p className="text-sm text-muted-foreground">
                        No opportunities
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  opps.map((opp) => (
                    <Link
                      key={opp.id}
                      href={`/sales/opportunities/${opp.id}`}
                      className="block"
                    >
                      <Card className="transition-colors hover:bg-muted/50">
                        <CardContent className="p-3">
                          <p className="truncate text-sm font-medium">
                            {opp.title}
                          </p>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">
                              {opp.lead?.title ?? "No lead"}
                            </p>
                            <p className="text-sm font-medium">
                              {formatCurrency(opp.value, opp.currency)}
                            </p>
                          </div>
                          {opp.expected_close_date && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Close:{" "}
                              {new Date(
                                opp.expected_close_date
                              ).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
