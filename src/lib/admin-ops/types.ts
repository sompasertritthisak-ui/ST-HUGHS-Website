/**
 * Shared result type for every admin-ops server action. Used with
 * React's `useActionState` on the client. Plain data only — no functions,
 * no class instances — so it serialises across the server/client boundary.
 */
export type ActionState = {
  ok: boolean;
  /** Human-readable outcome shown in an `aria-live` region. */
  message?: string;
  /** Field-level errors keyed by input name. */
  errors?: Record<string, string>;
  /** Optional payload (e.g. a one-time password to display once). */
  data?: Record<string, string>;
  /** Monotonic stamp so identical messages still re-announce. */
  at?: number;
};

export const initialActionState: ActionState = { ok: false };

export function fail(message: string, errors?: Record<string, string>): ActionState {
  return { ok: false, message, errors, at: Date.now() };
}

export function succeed(message: string, data?: Record<string, string>): ActionState {
  return { ok: true, message, data, at: Date.now() };
}
