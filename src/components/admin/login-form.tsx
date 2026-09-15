"use client";

import { useActionState } from "react";
import { Field, Input } from "@/components/ui/field";
import { loginAction } from "@/lib/admin/auth-actions";
import { idle } from "@/lib/admin/types";
import { ActionMessage, SubmitButton } from "./primitives";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, idle);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field label="Email" htmlFor="email" required>
        <Input id="email" name="email" type="email" autoComplete="username" required maxLength={200} className="h-11 text-[0.9375rem]" aria-invalid={!state.ok && Boolean(state.message)} />
      </Field>
      <Field label="Password" htmlFor="password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required minLength={8} maxLength={200} className="h-11 text-[0.9375rem]" />
      </Field>
      <ActionMessage state={state} />
      <SubmitButton variant="primary" className="mt-1 h-11 w-full">
        Sign in
      </SubmitButton>
    </form>
  );
}
