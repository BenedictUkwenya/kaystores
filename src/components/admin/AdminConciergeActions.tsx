"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

type Props = {
  id: string;
  status: string;
  adminNotes?: string | null;
};

export function AdminConciergeActions({ id, status, adminNotes }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(adminNotes ?? "");
  const [loading, setLoading] = useState(false);

  async function update(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/concierge", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus, adminNotes: notes }),
      });
      if (!res.ok) throw new Error("Update failed");
      router.refresh();
    } catch {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Textarea label="Internal notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" size="sm" disabled={loading || status === "in_progress"} onClick={() => update("in_progress")}>
          In progress
        </Button>
        <Button type="button" size="sm" disabled={loading || status === "completed"} onClick={() => update("completed")}>
          Complete
        </Button>
      </div>
    </div>
  );
}
