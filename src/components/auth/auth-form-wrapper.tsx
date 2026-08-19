"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AuthFormWrapperProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function AuthFormWrapper({
  children,
  title,
  description,
  className,
}: AuthFormWrapperProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div
        className={cn(
          "w-full max-w-sm space-y-6",
          className
        )}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="text-lg font-semibold">S</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              Synplix
            </span>
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
