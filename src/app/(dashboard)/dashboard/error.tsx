"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error("Dashboard error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center text-center py-8">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            Unable to load dashboard
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Something went wrong while loading your dashboard data. Please try
            again.
          </p>
          <div className="mt-6 flex gap-3">
            <Button onClick={reset} variant="default" size="sm">
              <RefreshCw className="mr-1.5 size-3.5" />
              Try again
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              size="sm"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
