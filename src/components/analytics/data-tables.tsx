import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/analytics-utils";
import type { TopClient } from "@/types/analytics";
import Link from "next/link";

interface TopClientsTableProps {
  title: string;
  clients: TopClient[];
  valueKey: "revenue" | "outstanding" | "projectCount";
  valueLabel: string;
}

export function TopClientsTable({ title, clients, valueKey, valueLabel }: TopClientsTableProps) {
  if (!clients.length) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            No client data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="space-y-2">
          {clients.map((client, i) => (
            <Link
              key={client.clientId}
              href={`/clients/${client.clientId}`}
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <div className="font-medium truncate">{client.companyName || client.clientCode}</div>
                  <div className="text-xs text-muted-foreground">{client.clientCode}</div>
                </div>
              </div>
              <div className="text-right shrink-0 ml-3">
                {valueKey === "projectCount" ? (
                  <span className="font-medium">{client.projectCount}</span>
                ) : (
                  <span className="font-medium">{formatINR(client[valueKey])}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
