type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  variant?: "default" | "checkout";
};

export function Input({
  label,
  hint,
  error,
  id,
  variant = "default",
  className = "",
  ...props
}: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  const labelClass =
    variant === "checkout"
      ? "mb-1.5 block text-[12px] font-medium text-kay-muted"
      : "mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-kay-subtle";

  return (
    <div className="w-full">
      <label htmlFor={inputId} className={labelClass}>
        {label}
      </label>
      <input
        id={inputId}
        className={`h-11 w-full rounded-lg border bg-kay-input-bg px-3.5 text-[14px] text-kay-fg outline-none transition-colors placeholder:text-kay-subtle focus:border-kay-fg ${
          error ? "border-red-500" : "border-kay-border"
        } ${className}`}
        {...props}
      />
      {hint && !error && (
        <p className="mt-1.5 text-[12px] text-kay-subtle">{hint}</p>
      )}
      {error && <p className="mt-1.5 text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
