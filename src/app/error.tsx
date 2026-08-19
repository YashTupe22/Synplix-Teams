"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log error for monitoring (only in development)
    if (process.env.NODE_ENV === "development") {
      console.error("Global error:", error);
    }
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <span className="text-2xl" role="img" aria-label="Error">
            !
          </span>
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          An unexpected error occurred. Please try again or contact support if
          the problem persists.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={reset} variant="default">
            Try again
          </Button>
          <Button onClick={() => router.push("/dashboard")} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
