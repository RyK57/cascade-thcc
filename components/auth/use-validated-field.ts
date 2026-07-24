"use client";

import { useState } from "react";

/** The subset an `AuthField` consumes; spread it straight onto the field. */
export interface ValidatedFieldProps {
  value: string;
  error?: string;
  onValueChange: (next: string) => void;
  onBlur: () => void;
}

export interface ValidatedField {
  value: string;
  error?: string;
  touched: boolean;
  /** Validate now and report. Called by submit before the action fires. */
  check: () => boolean;
  /** Re-run only if the field has already been visited — for cross-field rules. */
  revalidate: () => void;
  props: ValidatedFieldProps;
}

/**
 * Controlled field state with blur-first validation.
 *
 * Controlled matters for more than validation: React resets an uncontrolled
 * form once its action settles, which is how a failed sign-in used to hand back
 * an empty form. Holding the value in state means a rejected attempt returns
 * everything the person already typed.
 */
export function useValidatedField(
  validate: (value: string) => string | undefined,
  initialValue = "",
): ValidatedField {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | undefined>(undefined);
  const [touched, setTouched] = useState(false);

  function onValueChange(next: string) {
    setValue(next);
    // Only correct in place once they have seen the message; nagging while a
    // field is still being typed into is noise, not prevention.
    if (touched) setError(validate(next));
  }

  function onBlur() {
    setTouched(true);
    // Tabbing past a field you never filled is not a mistake yet. Emptiness
    // becomes an error at submit; blur only judges what someone actually typed.
    if (value === "" && !error) return;
    setError(validate(value));
  }

  return {
    value,
    error,
    touched,
    check() {
      setTouched(true);
      const next = validate(value);
      setError(next);
      return next === undefined;
    },
    revalidate() {
      if (touched) setError(validate(value));
    },
    props: { value, error, onValueChange, onBlur },
  };
}
