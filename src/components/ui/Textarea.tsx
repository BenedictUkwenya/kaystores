type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  maxLength?: number;
  value: string;
  variant?: "default" | "checkout";
};

export function Textarea({
  label,
  hint,
  maxLength,
  value,
  variant = "default",
  id,
  className = "",
  ...props
}: TextareaProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const labelClass =
    variant === "checkout"
      ? "text-[12px] font-medium text-kay-muted"
      : "text-[11px] uppercase tracking-[0.12em] text-kay-subtle";

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className={labelClass}>
          {label}
        </label>
        {maxLength != null && (
          <span className="text-[11px] text-kay-subtle">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        id={inputId}
        value={value}
        maxLength={maxLength}
        className={`min-h-[100px] w-full resize-y rounded-lg border border-kay-border bg-kay-input-bg px-3.5 py-3 text-[14px] leading-relaxed text-kay-fg outline-none transition-colors placeholder:text-kay-subtle focus:border-kay-fg ${className}`}
        {...props}
      />
      {hint && <p className="mt-1.5 text-[12px] text-kay-subtle">{hint}</p>}
    </div>
  );
}
