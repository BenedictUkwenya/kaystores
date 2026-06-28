"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type Props = { orderId: string; itemId: string };

export function AdminQcPassButton({ orderId, itemId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function passQc() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qcPassItemId: itemId }),
      });
      if (!res.ok) throw new Error("QC update failed");
      router.refresh();
    } catch {
      alert("QC update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
      <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={passQc} className="w-full sm:w-auto">
      QC pass
    </Button>
  );
}
