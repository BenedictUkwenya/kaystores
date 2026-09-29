"use client";

import { useId } from "react";
import { NIGERIAN_STATES, matchNigerianState } from "@/lib/geo/nigeria";

type Props = {
  label?: string;
  value: string;
  onChange: (state: string) => void;
  required?: boolean;
  hint?: string;
};

export function StateSelect({ label = "State", value, onChange, required, hint }: Props) {
  const id = useId();
  const matched = value ? matchNigerianState(value) : null;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-medium text-kay-muted">
        {label}
      </label>
      <select
        id={id}
        value={matched ?? ""}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="h-11 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3 text-[14px] text-kay-fg outline-none transition-colors focus:border-kay-fg"
      >
        <option value="" disabled>
          {value && !matched ? `${value} — pick a state` : "Select state"}
        </option>
        {NIGERIAN_STATES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-[11px] text-kay-subtle">{hint}</p>}
    </div>
  );
}
