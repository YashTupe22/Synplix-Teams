"use client";

import {
  TrendingUp,
  Building2,
  FolderKanban,
  CheckSquare,
  FileText,
  ArrowRight,
  Phone,
  DollarSign,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { QuickAction } from "@/types/dashboard";

const iconMap = {
  TrendingUp,
  Building2,
  FolderKanban,
  CheckSquare,
  FileText,
  Phone,
  DollarSign,
};

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const router = useRouter();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => {
            const Icon = iconMap[action.icon as keyof typeof iconMap] ?? CheckSquare;
            return (
              <Tooltip key={action.id}>
                <TooltipTrigger
                  render={
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start gap-2 text-sm font-normal",
                        !action.enabled && "cursor-not-allowed opacity-60"
                      )}
                      disabled={!action.enabled}
                      aria-disabled={!action.enabled}
                      aria-label={`${action.label} - ${action.description}`}
                      onClick={() => {
                        if (action.enabled && action.href) {
                          router.push(action.href);
                        }
                      }}
                    />
                  }
                >
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1 text-left">{action.label}</span>
                  <ArrowRight className="size-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={4}>
                  <p>{action.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
