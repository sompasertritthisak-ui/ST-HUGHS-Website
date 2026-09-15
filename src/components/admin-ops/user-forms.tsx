"use client";

import { useActionState } from "react";
import { Checkbox, Field, Input, Select } from "@/components/ui/field";
import { ROLES, ROLE_LABELS, type Role } from "@/lib/enums";
import { createUser, deactivateUser, deleteUser, resetUserPassword, updateUser } from "@/lib/admin-ops/users-actions";
import { initialActionState, type ActionState } from "@/lib/admin-ops/types";
import { FormStatus, SubmitButton } from "./form-status";

const compact = "h-10 text-sm";

function roleOptions(actorRole: string, current?: string) {
  // Non-super-admins never see SUPER_ADMIN as a grantable option (server enforces too).
  return ROLES.filter((r) => r !== "SUPER_ADMIN" || actorRole === "SUPER_ADMIN" || r === current);
}

function OneTimePassword({ state }: { state: ActionState }) {
  const pw = state.data?.temporaryPassword;
  if (!state.ok || !pw) return null;
  return (
    <div className="rounded-[var(--radius-sm)] border border-warning/60 bg-warning/10 p-3 text-sm text-fg" role="region" aria-label="Temporary password">
      <p className="font-medium">Temporary password (shown once)</p>
      <code className="mt-1 block select-all rounded-[var(--radius-sm)] bg-bg-raised px-2 py-1.5 font-mono text-base tracking-wider">{pw}</code>
      <p className="mt-1 text-xs text-fg-muted">Ask the user to sign in and change it immediately. It is not stored anywhere in plain text.</p>
    </div>
  );
}

export function CreateUserForm({ actorRole }: { actorRole: string }) {
  const [state, action] = useActionState(createUser, initialActionState);
  const err = state.errors ?? {};
  return (
    <form action={action} className="grid max-w-xl gap-4">
      <Field label="Full name" htmlFor="name" required error={err.name}>
        <Input id="name" name="name" className={compact} required maxLength={120} autoComplete="off" aria-invalid={Boolean(err.name)} />
      </Field>
      <Field label="Email" htmlFor="email" required hint="Stored lowercased; used to sign in." error={err.email}>
        <Input id="email" name="email" type="email" className={compact} required maxLength={200} autoComplete="off" aria-invalid={Boolean(err.email)} />
      </Field>
      <Field label="Role" htmlFor="role" required error={err.role}>
        <Select id="role" name="role" defaultValue="VIEWER" className={compact}>
          {roleOptions(actorRole).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Temporary password" htmlFor="password" hint="Optional. Leave blank to generate one (12+ characters, shown once)." error={err.password}>
        <Input id="password" name="password" type="text" className={`${compact} font-mono`} minLength={12} maxLength={200} autoComplete="new-password" aria-invalid={Boolean(err.password)} />
      </Field>
      <div>
        <SubmitButton pendingLabel="Creating…">Create user</SubmitButton>
      </div>
      <FormStatus state={state} />
      <OneTimePassword state={state} />
      {state.ok && state.data?.userId ? (
        <a href={`/admin/users/${state.data.userId}`} className="text-sm text-fg underline underline-offset-2">
          Open {state.data.email}
        </a>
      ) : null}
    </form>
  );
}

export function EditUserForm({ user, actorRole, isSelf }: { user: { id: string; name: string; role: string; isActive: boolean }; actorRole: string; isSelf: boolean }) {
  const [state, action] = useActionState(updateUser, initialActionState);
  const err = state.errors ?? {};
  const lockedRole = isSelf || (user.role === "SUPER_ADMIN" && actorRole !== "SUPER_ADMIN");
  return (
    <form action={action} className="grid max-w-xl gap-4">
      <input type="hidden" name="id" value={user.id} />
      <Field label="Full name" htmlFor="name" required error={err.name}>
        <Input id="name" name="name" defaultValue={user.name} className={compact} required maxLength={120} aria-invalid={Boolean(err.name)} />
      </Field>
      <Field label="Role" htmlFor="role" required hint={isSelf ? "You cannot change your own role." : lockedRole ? "Only a super admin can change another super admin." : undefined} error={err.role}>
        <Select id="role" name="role" defaultValue={user.role} className={compact} disabled={lockedRole}>
          {roleOptions(actorRole, user.role).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r as Role]}
            </option>
          ))}
        </Select>
        {lockedRole ? <input type="hidden" name="role" value={user.role} /> : null}
      </Field>
      <label className="flex items-center gap-2 text-sm text-fg">
        <Checkbox name="isActive" defaultChecked={user.isActive} disabled={isSelf} />
        Active {isSelf ? <span className="text-xs text-fg-muted">(you cannot deactivate yourself)</span> : null}
        {isSelf ? <input type="hidden" name="isActive" value="on" /> : null}
      </label>
      <div>
        <SubmitButton>Save changes</SubmitButton>
      </div>
      <FormStatus state={state} />
    </form>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [state, action] = useActionState(resetUserPassword, initialActionState);
  return (
    <form
      action={action}
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        if (!window.confirm("Reset this user's password? Their current password will stop working immediately.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={userId} />
      <div>
        <SubmitButton variant="secondary" pendingLabel="Resetting…">
          Reset password
        </SubmitButton>
      </div>
      <FormStatus state={state} />
      <OneTimePassword state={state} />
    </form>
  );
}

export function DeactivateUserForm({ userId, isActive, isSelf }: { userId: string; isActive: boolean; isSelf: boolean }) {
  const [state, action] = useActionState(deactivateUser, initialActionState);
  if (!isActive || isSelf) return null;
  return (
    <form
      action={action}
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        if (!window.confirm("Deactivate this user? They will no longer be able to sign in.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={userId} />
      <div>
        <SubmitButton variant="danger" pendingLabel="Deactivating…">
          Deactivate account
        </SubmitButton>
      </div>
      <FormStatus state={state} />
    </form>
  );
}

export function DeleteUserForm({ userId, historyCount, isSelf }: { userId: string; historyCount: number; isSelf: boolean }) {
  const [state, action] = useActionState(deleteUser, initialActionState);
  if (isSelf) return null;
  return (
    <form
      action={action}
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        if (!window.confirm("Permanently delete this account? This cannot be undone.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={userId} />
      <p className="text-xs text-fg-muted">
        {historyCount > 0 ? `This account has ${historyCount} audit, revision or content record${historyCount === 1 ? "" : "s"} and cannot be deleted — deactivate it instead.` : "No history is attached to this account, so it can be removed permanently."}
      </p>
      {historyCount === 0 ? (
        <div>
          <SubmitButton variant="danger" pendingLabel="Deleting…">
            Delete permanently
          </SubmitButton>
        </div>
      ) : null}
      <FormStatus state={state} />
    </form>
  );
}
