type ToggleProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
};

export function Toggle({
  label,
  description,
  checked,
  onChange,
  id,
}: ToggleProps) {
  const toggleId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-kay-border-light bg-kay-surface/50 px-4 py-3.5 transition-colors hover:border-kay-border">
      <div className="min-w-0">
        <label htmlFor={toggleId} className="text-[13px] font-medium text-kay-fg">
          {label}
        </label>
        {description && (
          <p className="mt-1 text-[12px] leading-relaxed text-kay-muted">
            {description}
          </p>
        )}
      </div>
      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-kay-fg" : "bg-kay-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-kay-bg shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
