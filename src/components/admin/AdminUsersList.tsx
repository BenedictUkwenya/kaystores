"use client";

import { useState } from "react";
import type { AdminUser } from "@/types/dashboard";
import { getInitials, formatMemberSince } from "@/components/account/account-utils";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { AdminUserActions } from "@/components/admin/AdminUserActions";

type Props = {
  users: AdminUser[];
  currentAdminId: string;
};

function roleLabel(role: AdminUser["role"]) {
  if (role === "admin") return "Administrator";
  if (role === "vendor") return "Vendor partner";
  return "Customer";
}

export function AdminUsersList({ users, currentAdminId }: Props) {
  const [query, setQuery] = useState("");

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.fullName?.toLowerCase().includes(q) ?? false)
    );
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    vendors: users.filter((u) => u.role === "vendor").length,
    customers: users.filter((u) => u.role === "customer").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total members", value: stats.total, accent: true },
          { label: "Admins", value: stats.admins },
          { label: "Vendors", value: stats.vendors },
          { label: "Customers", value: stats.customers },
        ].map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border px-4 py-4 ${
              stat.accent
                ? "border-kay-gold/30 bg-gradient-to-br from-kay-gold-light/50 to-kay-surface-elevated"
                : "border-kay-border-light bg-kay-surface-elevated"
            } shadow-[var(--kay-card-shadow)]`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
              {stat.label}
            </p>
            <p className="mt-1 font-serif text-[28px] leading-none text-kay-fg">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="relative">
        <label htmlFor="user-search" className="sr-only">
          Search users
        </label>
        <input
          id="user-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email…"
          className="h-11 w-full rounded-full border border-kay-border-light bg-kay-surface-elevated pl-11 pr-4 text-[13px] text-kay-fg shadow-[var(--kay-card-shadow)] outline-none placeholder:text-kay-subtle focus:border-kay-gold/50"
        />
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-kay-subtle"
          aria-hidden
        >
          ⌕
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-kay-border bg-kay-surface-elevated/60 px-6 py-16 text-center">
          <p className="font-serif text-[22px] text-kay-fg">No matches</p>
          <p className="mt-2 text-[13px] text-kay-muted">
            Try a different name or email address.
          </p>
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((user) => {
            const displayName =
              user.fullName?.trim() || user.email.split("@")[0];
            const isSelf = user.id === currentAdminId;

            return (
              <li key={user.id}>
                <article className="overflow-hidden rounded-2xl border border-kay-border-light bg-kay-surface-elevated shadow-[var(--kay-card-shadow)] transition-shadow hover:shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                  <div className="flex gap-4 p-5 sm:gap-5 sm:p-6">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-kay-gold/35 bg-gradient-to-br from-kay-gold-light/70 to-kay-surface font-serif text-[17px] text-kay-fg sm:h-14 sm:w-14 sm:text-[19px]">
                      {getInitials(displayName)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-serif text-[20px] leading-tight text-kay-fg sm:text-[22px]">
                              {displayName}
                            </h3>
                            {isSelf && (
                              <span className="rounded-full bg-kay-surface px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-kay-muted">
                                You
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 truncate text-[13px] text-kay-muted">
                            {user.email}
                          </p>
                          <p className="mt-2 text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
                            {roleLabel(user.role)}
                            <span className="mx-2 text-kay-border">·</span>
                            Joined {formatMemberSince(user.createdAt)}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <StatusBadge status={user.role} />
                          <StatusBadge status={user.accountStatus} />
                          {user.vendorStatus && (
                            <StatusBadge
                              status={user.vendorStatus}
                              label={`Vendor ${user.vendorStatus}`}
                            />
                          )}
                        </div>
                      </div>

                      {user.businessName && (
                        <p className="mt-3 text-[12px] text-kay-muted">
                          <span className="text-kay-subtle">Business · </span>
                          {user.businessName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-kay-border-light bg-gradient-to-r from-kay-surface/80 via-kay-surface-elevated to-kay-gold-light/15 px-5 py-4 sm:px-6">
                    <AdminUserActions
                      user={user}
                      currentAdminId={currentAdminId}
                    />
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
