"use client";

import * as React from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { updateNotificationPreferencesAction } from "@/app/(dashboard)/notifications/actions";
import { PREFERENCE_CATEGORIES, type NotificationPreferences } from "@/types/notifications";

interface NotificationPreferencesFormProps {
  preferences: NotificationPreferences;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save Preferences"}
    </Button>
  );
}

export function NotificationPreferencesForm({
  preferences,
}: NotificationPreferencesFormProps) {
  const [state, formAction] = useFormState(updateNotificationPreferencesAction, {
    error: undefined,
    success: undefined,
  });

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Choose which notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {state.success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Preferences saved successfully.
            </div>
          )}
          {state.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              {state.error}
            </div>
          )}

          {PREFERENCE_CATEGORIES.map((category) => (
            <div
              key={category.key}
              className="flex items-center justify-between rounded-lg border border-border p-4"
            >
              <div className="space-y-0.5">
                <label
                  htmlFor={category.key}
                  className="text-sm font-medium text-foreground"
                >
                  {category.label}
                </label>
                <p className="text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>
              <input
                type="checkbox"
                id={category.key}
                name={category.key}
                defaultChecked={preferences[category.key] !== false}
                className="size-5 rounded border-border text-primary focus:ring-primary"
              />
            </div>
          ))}

          <div className="flex justify-end pt-2">
            <SubmitButton />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
