"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithMagicLink, type LoginState } from "@/lib/auth/actions";

const INITIAL_STATE: LoginState = { status: "idle", message: "" };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(
    signInWithMagicLink,
    INITIAL_STATE,
  );

  if (state.status === "sent") {
    return (
      <div
        className="rounded-md border border-border bg-muted/50 p-4 text-sm text-foreground"
        role="status"
        aria-live="polite"
      >
        {state.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">כתובת מייל</Label>
        <Input
          id="email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.email ?? ""}
          placeholder="you@example.com"
          aria-invalid={state.status === "error"}
          aria-describedby={state.status === "error" ? "email-error" : undefined}
        />
        {state.status === "error" ? (
          <p
            id="email-error"
            role="alert"
            className="text-sm text-destructive"
          >
            {state.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "שולח קישור…" : "שלחו לי קישור התחברות"}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        אין צורך בסיסמה. נשלח לכם קישור חד-פעמי למייל.
      </p>
    </form>
  );
}
