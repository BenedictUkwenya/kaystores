"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminUser } from "@/types/dashboard";

type Props = {
  user: AdminUser;
  currentAdminId: string;
  compact?: boolean;
};

function ActionChip({
  children,
  onClick,
  disabled,
  variant = "default",
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "primary";
}) {
  const styles = {
    default:
      "border-kay-border bg-kay-surface-elevated text-kay-fg hover:border-kay-fg/40 hover:bg-kay-surface",
    danger:
      "border-red-200/80 bg-red-50/50 text-red-800 hover:border-red-300 hover:bg-red-50",
    primary:
      "border-kay-fg/20 bg-kay-fg text-kay-accent-fg hover:opacity-90",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-8 items-center rounded-full border px-3.5 text-[11px] font-medium tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export function AdminUserActions({
  user,
  currentAdminId,
  compact = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [businessName, setBusinessName] = useState(user.businessName ?? "");
  const panelRef = useRef<HTMLDivElement>(null);
  const isSelf = user.id === currentAdminId;

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function act(action: string, extra?: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Action failed");
      setOpen(false);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  if (isSelf) {
    return <span className="text-[12px] text-kay-subtle">—</span>;
  }

  const menu = (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
          Account access
        </p>
        <div className="flex flex-wrap gap-2">
          {user.accountStatus === "active" ? (
            <>
              <ActionChip disabled={loading} onClick={() => act("suspend")}>
                Suspend
              </ActionChip>
              <ActionChip
                disabled={loading}
                variant="danger"
                onClick={() => act("block")}
              >
                Block
              </ActionChip>
            </>
          ) : (
            <ActionChip
              disabled={loading}
              variant="primary"
              onClick={() => act("activate")}
            >
              Reactivate
            </ActionChip>
          )}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
          Role
        </p>
        <div className="flex flex-wrap gap-2">
          {user.role !== "admin" && (
            <ActionChip
              disabled={loading}
              variant="primary"
              onClick={() => act("make_admin")}
            >
              Grant admin
            </ActionChip>
          )}
          {user.role !== "vendor" && (
            <ActionChip
              disabled={loading}
              onClick={() => act("make_vendor", { businessName })}
            >
              Grant vendor
            </ActionChip>
          )}
          {user.role !== "customer" && (
            <ActionChip disabled={loading} onClick={() => act("make_customer")}>
              Set as customer
            </ActionChip>
          )}
        </div>
        {user.role !== "vendor" && (
          <div className="mt-3">
            <label
              htmlFor={`vendor-name-${user.id}`}
              className="mb-1.5 block text-[11px] text-kay-subtle"
            >
              Business name (for vendor role)
            </label>
            <input
              id={`vendor-name-${user.id}`}
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Maison Lagos"
              className="h-9 w-full rounded-lg border border-kay-border-light bg-kay-input-bg px-3 text-[13px] text-kay-fg outline-none focus:border-kay-fg/40"
            />
          </div>
        )}
      </div>
    </div>
  );

  if (!compact) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={open}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-gold">
            Manage member
          </span>
          <span className="text-[12px] text-kay-muted">
            {open ? "Hide" : "Show options"}
          </span>
        </button>
        {open && <div className="mt-4">{menu}</div>}
      </div>
    );
  }

  return (
    <div className="relative flex justify-end" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="inline-flex h-8 items-center rounded-full border border-kay-border px-3 text-[11px] font-medium text-kay-muted transition-colors hover:border-kay-fg hover:text-kay-fg"
      >
        Manage
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-[min(100vw-2rem,280px)] rounded-xl border border-kay-border-light bg-kay-surface-elevated p-4 shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
          {menu}
        </div>
      )}
    </div>
  );
}
