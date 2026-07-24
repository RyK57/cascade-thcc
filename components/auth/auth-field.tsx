"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface AuthFieldProps {
  id: string;
  name: string;
  label: string;
  type?: "text" | "email" | "password";
  value: string;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  /** Standing guidance, shown before anything goes wrong. */
  hint?: ReactNode;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  /** Rendered on the label row — e.g. a "Forgot password?" link. */
  labelAction?: ReactNode;
  /** Rendered under the input, e.g. a strength meter. Its id is described-by. */
  detail?: ReactNode;
  detailId?: string;
  inputClassName?: string;
  children?: ReactNode;
}

/**
 * One field, one label, one message slot. Everything a control needs to be
 * announced correctly is wired here so no form can forget it: `htmlFor`,
 * `aria-invalid`, `aria-describedby`, and an error that is a live region.
 */
export function AuthField({
  id,
  name,
  label,
  type = "text",
  value,
  onValueChange,
  onBlur,
  error,
  hint,
  autoComplete,
  placeholder,
  required,
  autoFocus,
  disabled,
  labelAction,
  detail,
  detailId,
  inputClassName,
  children,
}: AuthFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null, detail ? detailId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {labelAction}
      </div>

      {/* flex, not block: an inline-block input leaves a descender gap that would
          offset any absolutely positioned control from the field it belongs to. */}
      <div className="relative flex">
        <Input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          required={required}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn("rounded-none", inputClassName)}
        />
        {children}
      </div>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-[0.8125rem] leading-snug text-destructive"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[0.8125rem] leading-snug text-muted-foreground">
          {hint}
        </p>
      ) : null}

      {detail}
    </div>
  );
}
