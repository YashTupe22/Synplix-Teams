"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Analytics error:", error);
  }, [error]);

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="mb-4 size-10 text-destructive" />
          <p className="text-sm font-medium text-foreground">Something went wrong</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {error.message || "Failed to load analytics data"}
          </p>
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" onClick={reset}>
              Try Again
            </Button>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
