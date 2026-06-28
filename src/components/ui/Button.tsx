type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary:
    "cursor-pointer bg-kay-accent text-kay-accent-fg shadow-[0_2px_8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)] hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
  secondary:
    "cursor-pointer bg-kay-surface text-kay-fg border border-kay-border hover:-translate-y-0.5 hover:border-kay-fg hover:bg-kay-surface-elevated hover:shadow-sm active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
  outline:
    "cursor-pointer border-2 border-kay-fg text-kay-fg hover:-translate-y-0.5 hover:bg-kay-fg hover:text-kay-accent-fg hover:shadow-md active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "cursor-pointer text-kay-fg hover:bg-kay-surface active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50",
};

const sizes = {
  sm: "h-9 px-4 text-[12px]",
  md: "h-11 px-6 text-[13px]",
  lg: "h-12 px-8 text-[14px]",
};

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kay-gold focus-visible:ring-offset-2 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
