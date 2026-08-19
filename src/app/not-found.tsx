import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
          <span className="text-2xl font-semibold text-muted-foreground">
            404
          </span>
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button render={<Link href="/dashboard" />}>Go to Dashboard</Button>
          <Button variant="outline" render={<Link href="/" />}>
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
