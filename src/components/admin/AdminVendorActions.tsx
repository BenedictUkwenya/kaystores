"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Vendor } from "@/types/dashboard";

type Props = { vendor: Vendor };

export function AdminVendorActions({ vendor }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [trusted, setTrusted] = useState(vendor.canListAfterDark);
  const [tableTrusted, setTableTrusted] = useState(vendor.canListTable);

  async function act(action: string, extra?: Record<string, unknown>) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Action failed");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
      {vendor.status === "pending" && (
        <>
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={trusted}
              onChange={(e) => setTrusted(e.target.checked)}
            />
            Trusted (After Dark)
          </label>
          <label className="flex items-center gap-2 text-[13px]">
            <input
              type="checkbox"
              checked={tableTrusted}
              onChange={(e) => setTableTrusted(e.target.checked)}
            />
            Kay Kitchen
          </label>
          <Button
            type="button"
            size="sm"
            disabled={loading}
            onClick={() =>
              act("approve", {
                canListAfterDark: trusted,
                canListTable: tableTrusted,
              })
            }
          >
            Approve
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={() => act("reject")}
          >
            Reject
          </Button>
        </>
      )}
      {vendor.status === "approved" && (
        <>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={() =>
              act("toggle_trusted", {
                canListAfterDark: !vendor.canListAfterDark,
              })
            }
          >
            {vendor.canListAfterDark ? "Revoke After Dark" : "Grant After Dark"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={() =>
              act("toggle_table", { canListTable: !vendor.canListTable })
            }
          >
            {vendor.canListTable ? "Revoke Kay Kitchen" : "Grant Kay Kitchen"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={loading}
            onClick={() => act("suspend")}
          >
            Suspend
          </Button>
        </>
      )}
    </div>
  );
}
