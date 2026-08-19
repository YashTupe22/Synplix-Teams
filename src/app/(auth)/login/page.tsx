"use client";

import { useActionState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthFormWrapper } from "@/components/auth/auth-form-wrapper";
import { LoginForm } from "@/components/auth/login-form";
import { login } from "./actions";

function sanitizeRedirect(path: string): string {
  if (!path.startsWith("/") || path.includes("://") || path.startsWith("//")) {
    return "/dashboard";
  }
  return path;
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(login, null);

  const redirectTo = sanitizeRedirect(searchParams.get("redirect_to") || "/dashboard");

  if (state?.success) {
    router.push(redirectTo);
    router.refresh();
    return null;
  }

  return (
    <AuthFormWrapper
      title="Welcome back"
      description="Sign in to your Synplix account"
    >
      <LoginForm
        formAction={formAction}
        error={state?.error}
        isPending={isPending}
      />
    </AuthFormWrapper>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
