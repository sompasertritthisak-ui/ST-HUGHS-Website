"use client";

import { useCallback, useMemo, useRef, useState, type FormEvent } from "react";
import type { z } from "zod";
import { captureUtm, getSessionId } from "@/lib/analytics-client";
import { toFieldErrors, type FieldErrors } from "@/lib/schemas/enquiry";
import { t } from "@/lib/i18n";

/**
 * Headless state for the public lead forms. Framework-agnostic on purpose:
 * plain `fetch` to the JSON API so the same form can be embedded anywhere
 * (pages, drawers, partner iframes) without server actions.
 */

export type LeadValues = Record<string, string | boolean>;
export type LeadStatus = "idle" | "submitting" | "success" | "error";

export type LeadFormOptions = {
  schema: z.ZodType;
  endpoint: string;
  idPrefix: string;
  /** Field order used for the error summary and first-invalid focus. */
  fieldOrder: readonly string[];
  initial: LeadValues;
  source: string;
};

export type LeadSubmitResult = { ok: true; id?: string } | { ok: false; errors?: FieldErrors };

export function useLeadForm(options: LeadFormOptions) {
  const { schema, endpoint, idPrefix, fieldOrder, initial, source } = options;
  const [values, setValues] = useState<LeadValues>(initial);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<LeadStatus>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [resultId, setResultId] = useState<string | null>(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const fieldId = useCallback((name: string) => `${idPrefix}-${name}`, [idPrefix]);

  const buildPayload = useCallback(
    (v: LeadValues) => {
      const utm = typeof window !== "undefined" ? captureUtm() : {};
      return { ...v, ...utm, sessionId: typeof window !== "undefined" ? getSessionId() : undefined, source };
    },
    [source],
  );

  const validate = useCallback(
    (v: LeadValues): FieldErrors => {
      const result = schema.safeParse(buildPayload(v));
      return result.success ? {} : toFieldErrors(result.error);
    },
    [schema, buildPayload],
  );

  const validateField = useCallback(
    (name: string, v: LeadValues) => {
      const all = validate(v);
      setErrors((prev) => {
        const next = { ...prev };
        if (all[name]) next[name] = all[name];
        else delete next[name];
        return next;
      });
    },
    [validate],
  );

  const setValue = useCallback(
    (name: string, value: string | boolean) => {
      const next = { ...valuesRef.current, [name]: value };
      valuesRef.current = next;
      setValues(next);
      if (touched[name]) validateField(name, next);
    },
    [touched, validateField],
  );

  const onBlur = useCallback(
    (name: string) => {
      setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
      validateField(name, valuesRef.current);
    },
    [validateField],
  );

  const focusField = useCallback(
    (name: string) => {
      if (typeof document === "undefined") return;
      const el = document.getElementById(fieldId(name));
      if (el && "focus" in el) {
        (el as HTMLElement).focus();
        el.scrollIntoView?.({ block: "center", behavior: "smooth" });
      }
    },
    [fieldId],
  );

  const focusFirstInvalid = useCallback(
    (errs: FieldErrors) => {
      const first = fieldOrder.find((f) => errs[f]) ?? Object.keys(errs).find((k) => k !== "_form");
      if (first) focusField(first);
    },
    [fieldOrder, focusField],
  );

  const submit = useCallback(
    async (event?: FormEvent<HTMLFormElement>): Promise<LeadSubmitResult> => {
      event?.preventDefault();
      if (status === "submitting") return { ok: false };
      setFormError(null);

      const current = valuesRef.current;
      const clientErrors = validate(current);
      if (Object.keys(clientErrors).length > 0) {
        setErrors(clientErrors);
        setTouched(Object.fromEntries(fieldOrder.map((f) => [f, true])));
        setShowSummary(true);
        setStatus("error");
        focusFirstInvalid(clientErrors);
        return { ok: false, errors: clientErrors };
      }

      setStatus("submitting");
      setShowSummary(false);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify(buildPayload(current)),
        });

        if (res.status === 429) {
          setFormError(t("forms.error.rateLimited"));
          setStatus("error");
          return { ok: false };
        }
        if (res.status === 422 || res.status === 400) {
          const body = (await res.json().catch(() => ({}))) as { errors?: FieldErrors };
          const serverErrors = body.errors ?? { _form: [t("forms.error.server")] };
          setErrors(serverErrors);
          setShowSummary(true);
          setStatus("error");
          focusFirstInvalid(serverErrors);
          return { ok: false, errors: serverErrors };
        }
        if (!res.ok) {
          setFormError(t("forms.error.server"));
          setStatus("error");
          return { ok: false };
        }
        const body = (await res.json().catch(() => ({}))) as { id?: string };
        setResultId(body.id ?? null);
        setStatus("success");
        return { ok: true, id: body.id };
      } catch {
        setFormError(t("forms.error.network"));
        setStatus("error");
        return { ok: false };
      }
    },
    [status, validate, fieldOrder, focusFirstInvalid, endpoint, buildPayload],
  );

  const reset = useCallback(() => {
    valuesRef.current = initial;
    setValues(initial);
    setErrors({});
    setTouched({});
    setStatus("idle");
    setFormError(null);
    setShowSummary(false);
    setResultId(null);
  }, [initial]);

  /** Wire a text-like control (input, select, textarea). */
  const fieldProps = useCallback(
    (name: string) => {
      const id = fieldId(name);
      const hasError = Boolean(errors[name]?.length);
      return {
        id,
        name,
        value: typeof values[name] === "string" ? (values[name] as string) : "",
        onChange: (e: { target: { value: string } }) => setValue(name, e.target.value),
        onBlur: () => onBlur(name),
        "aria-invalid": hasError || undefined,
        "aria-describedby": hasError ? `${id}-error` : undefined,
      };
    },
    [fieldId, errors, values, setValue, onBlur],
  );

  /** Wire a checkbox. */
  const checkboxProps = useCallback(
    (name: string) => {
      const id = fieldId(name);
      return {
        id,
        name,
        checked: values[name] === true,
        onChange: (e: { target: { checked: boolean } }) => setValue(name, e.target.checked),
        onBlur: () => onBlur(name),
      };
    },
    [fieldId, values, setValue, onBlur],
  );

  const firstError = useCallback((name: string) => errors[name]?.[0] ?? null, [errors]);

  const fieldErrorList = useMemo(
    () =>
      fieldOrder
        .filter((f) => errors[f]?.length)
        .map((f) => ({ name: f, message: errors[f][0] }))
        .concat(errors._form ? [{ name: "_form", message: errors._form[0] }] : []),
    [errors, fieldOrder],
  );

  return {
    values,
    errors,
    status,
    formError,
    showSummary,
    resultId,
    fieldId,
    fieldProps,
    checkboxProps,
    firstError,
    fieldErrorList,
    setValue,
    onBlur,
    submit,
    reset,
    focusField,
    isSubmitting: status === "submitting",
    isSuccess: status === "success",
  };
}

export type LeadForm = ReturnType<typeof useLeadForm>;
