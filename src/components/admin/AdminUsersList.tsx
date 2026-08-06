"use client";

import { useMemo, useState } from "react";
import type { AdminUser, PendingRoleInvite } from "@/types/dashboard";
import { formatMemberSince } from "@/components/account/account-utils";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { DataTable } from "@/components/dashboard/DataTable";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { AdminPendingInviteActions } from "@/components/admin/AdminPendingInviteActions";

type RoleFilter = "all" | "admin" | "vendor" | "customer" | "invited";

type Props = {
  users: AdminUser[];
  pendingInvites: PendingRoleInvite[];
  currentAdminId: string;
};

export function AdminUsersList({
  users,
  pendingInvites,
  currentAdminId,
}: Props) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const counts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      vendor: users.filter((u) => u.role === "vendor").length,
      customer: users.filter((u) => u.role === "customer").length,
      invited: pendingInvites.length,
    }),
    [users, pendingInvites],
  );

  const filteredUsers = useMemo(() => {
    if (roleFilter === "invited") return [];
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        (u.fullName?.toLowerCase().includes(q) ?? false) ||
        (u.businessName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [users, query, roleFilter]);

  const filteredInvites = useMemo(() => {
    if (roleFilter !== "invited") return [];
    const q = query.trim().toLowerCase();
    return pendingInvites.filter((inv) => {
      if (!q) return true;
      return (
        inv.email.toLowerCase().includes(q) ||
        (inv.businessName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [pendingInvites, query, roleFilter]);

  const filters: { id: RoleFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "admin", label: "Admins" },
    { id: "vendor", label: "Vendors" },
    { id: "customer", label: "Customers" },
    { id: "invited", label: "Invited" },
  ];

  const showingInvites = roleFilter === "invited";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((tab) => {
            const active = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors ${
                  active
                    ? "bg-kay-fg text-kay-bg"
                    : "border border-kay-border text-kay-muted hover:border-kay-fg hover:text-kay-fg"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 opacity-70">({counts[tab.id]})</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <label htmlFor="user-search" className="sr-only">
            Search users
          </label>
          <input
            id="user-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              showingInvites
                ? "Search invited email…"
                : "Search name, email, business…"
            }
            className="h-10 w-full rounded-full border border-kay-border-light bg-kay-surface-elevated pl-10 pr-4 text-[13px] text-kay-fg outline-none placeholder:text-kay-subtle focus:border-kay-fg/40"
          />
          <span
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-kay-subtle"
            aria-hidden
          >
            ⌕
          </span>
        </div>
      </div>

      <p className="text-[12px] text-kay-subtle">
        {showingInvites
          ? `Showing ${filteredInvites.length} of ${pendingInvites.length} pending invites`
          : `Showing ${filteredUsers.length} of ${users.length} members`}
      </p>

      {showingInvites ? (
        <DataTable<PendingRoleInvite>
          rows={filteredInvites}
          keyFn={(inv) => inv.id}
          emptyMessage={
            query
              ? "No pending invites match this search."
              : "No open invitations. Send one below when you need a new vendor or admin."
          }
          columns={[
            {
              key: "invitee",
              header: "Invitee",
              render: (inv) => (
                <div className="min-w-0">
                  <p className="font-medium text-kay-fg">{inv.email}</p>
                  {inv.businessName && (
                    <p className="mt-0.5 truncate text-[11px] text-kay-subtle">
                      {inv.businessName}
                    </p>
                  )}
                </div>
              ),
            },
            {
              key: "role",
              header: "Role",
              render: (inv) => <StatusBadge status={inv.role} />,
            },
            {
              key: "status",
              header: "Status",
              render: () => (
                <StatusBadge status="pending" label="Awaiting signup" />
              ),
            },
            {
              key: "mode",
              header: "Invite type",
              hideOnMobile: true,
              render: (inv) =>
                inv.role === "vendor" ? (
                  <span className="text-[12px] text-kay-muted">
                    {inv.inviteMode === "instant"
                      ? "Instant access"
                      : "Profile first"}
                  </span>
                ) : (
                  <span className="text-kay-subtle">—</span>
                ),
            },
            {
              key: "sent",
              header: "Sent",
              hideOnMobile: true,
              render: (inv) => (
                <span className="text-kay-muted">
                  {formatMemberSince(inv.invitedAt)}
                </span>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              render: (inv) => <AdminPendingInviteActions invite={inv} />,
            },
          ]}
        />
      ) : (
        <DataTable<AdminUser>
          rows={filteredUsers}
          keyFn={(u) => u.id}
          emptyMessage={
            query || roleFilter !== "all"
              ? "No members match this filter."
              : "No members yet."
          }
          columns={[
            {
              key: "member",
              header: "Member",
              render: (u) => {
                const name = u.fullName?.trim() || u.email.split("@")[0];
                const isSelf = u.id === currentAdminId;
                return (
                  <div className="min-w-0">
                    <p className="font-medium text-kay-fg">
                      {name}
                      {isSelf && (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-kay-subtle">
                          You
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[12px] text-kay-muted">
                      {u.email}
                    </p>
                    {u.businessName && (
                      <p className="mt-0.5 truncate text-[11px] text-kay-subtle">
                        {u.businessName}
                      </p>
                    )}
                  </div>
                );
              },
            },
            {
              key: "role",
              header: "Role",
              render: (u) => <StatusBadge status={u.role} />,
            },
            {
              key: "status",
              header: "Status",
              render: (u) => <StatusBadge status={u.accountStatus} />,
            },
            {
              key: "vendor",
              header: "Vendor",
              hideOnMobile: true,
              render: (u) =>
                u.vendorStatus ? (
                  <StatusBadge
                    status={u.vendorStatus}
                    label={u.vendorStatus}
                  />
                ) : (
                  <span className="text-kay-subtle">—</span>
                ),
            },
            {
              key: "joined",
              header: "Joined",
              hideOnMobile: true,
              render: (u) => (
                <span className="text-kay-muted">
                  {formatMemberSince(u.createdAt)}
                </span>
              ),
            },
            {
              key: "actions",
              header: "Actions",
              render: (u) => (
                <AdminUserActions
                  user={u}
                  currentAdminId={currentAdminId}
                  compact
                />
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
