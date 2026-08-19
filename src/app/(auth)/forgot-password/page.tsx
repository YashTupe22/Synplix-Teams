"use client";

import { useActionState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import { forgotPassword } from "./actions";

export default function ForgotPasswordPage() {
  const [state, formAction, isPending] = useActionState(forgotPassword, null);

  if (state?.success) {
    return (
      <AuthFormWrapper
        title="Check your email"
        description="We sent a password reset link to your email address."
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="size-6 text-emerald-600" />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              If an account exists with that email, you&apos;ll receive a
              password reset link shortly.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Check your spam folder if you don&apos;t see the email.
            </p>
          </div>
          <a
            href="/login"
            className="text-sm font-medium text-primary hover:underline"
          >
            Back to sign in
          </a>
        </div>
      </AuthFormWrapper>
    );
  }

  return (
    <AuthFormWrapper
      title="Reset your password"
      description="Enter your email and we&apos;ll send you a reset link"
    >
      <form action={formAction} className="space-y-4">
        {state?.error && (
          <div
            className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive"
            role="alert"
          >
            {state.error}
          </div>
        )}

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="text-sm font-medium text-foreground"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isPending}
            placeholder="you@company.com"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Send reset link"
          )}
        </button>

        <div className="text-center">
          <a
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to sign in
          </a>
        </div>
      </form>
    </AuthFormWrapper>
  );
}
