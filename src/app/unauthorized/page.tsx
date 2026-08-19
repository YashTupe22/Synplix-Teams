import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <ShieldOff className="size-8 text-destructive" />
        </div>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          Access denied
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don&apos;t have permission to access this page. If you believe
          this is a mistake, please contact your administrator.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button render={<Link href="/dashboard" />}>Go to Dashboard</Button>
        </div>
      </div>
    </div>
  );
}
