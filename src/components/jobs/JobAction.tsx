"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { JobKind } from "@/lib/jobs/types";

type Scope = "admin" | "vendor";

export function useJobAction(kind: JobKind, id: string, scope: Scope = "admin") {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(body: Record<string, unknown>): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/${scope}/jobs/${kind}/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "That didn't work. Try again.");
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "That didn't work. Try again.");
      return false;
    } finally {
      setLoading(false);
    }
  }

  return { run, loading, error };
}

export function JobActionError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">
      {message}
    </p>
  );
}

type ButtonProps = {
  kind: JobKind;
  id: string;
  scope?: Scope;
  body: Record<string, unknown>;
  label: ReactNode;
  confirm?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
};

/** One-click action. Asks first when `confirm` is set. */
export function JobActionButton({
  kind,
  id,
  scope = "admin",
  body,
  label,
  confirm,
  variant = "primary",
  size = "sm",
  className = "",
}: ButtonProps) {
  const { run, loading, error } = useJobAction(kind, id, scope);
  return (
    <div className="space-y-2">
      <Button
        type="button"
        size={size}
        variant={variant}
        disabled={loading}
        className={className}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          void run(body);
        }}
      >
        {loading ? "Working…" : label}
      </Button>
      <JobActionError message={error} />
    </div>
  );
}

type PromptProps = {
  kind: JobKind;
  id: string;
  scope?: Scope;
  action: string;
  /** Body key the typed value is sent as. */
  field: string;
  label: string;
  placeholder?: string;
  submitLabel: string;
  help?: string;
  multiline?: boolean;
  required?: boolean;
  variant?: "primary" | "secondary" | "outline";
  extra?: Record<string, unknown>;
};

/** Action that needs one typed value (a reference, a reason, a QC note). */
export function JobActionPrompt({
  kind,
  id,
  scope = "admin",
  action,
  field,
  label,
  placeholder,
  submitLabel,
  help,
  multiline,
  required = true,
  variant = "primary",
  extra,
}: PromptProps) {
  const { run, loading, error } = useJobAction(kind, id, scope);
  const [value, setValue] = useState("");
  const inputClass =
    "mt-1 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3 py-2 text-[13px] text-kay-fg";
  return (
    <form
      className="space-y-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await run({ action, [field]: value.trim(), ...extra });
        if (ok) setValue("");
      }}
    >
      <label className="block text-[12px] font-medium text-kay-fg">
        {label}
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            rows={2}
            maxLength={500}
            className={inputClass}
          />
        ) : (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            maxLength={120}
            className={inputClass}
          />
        )}
      </label>
      {help && <p className="text-[11px] leading-relaxed text-kay-muted">{help}</p>}
      <Button
        type="submit"
        size="sm"
        variant={variant}
        disabled={loading || (required && !value.trim())}
      >
        {loading ? "Working…" : submitLabel}
      </Button>
      <JobActionError message={error} />
    </form>
  );
}
