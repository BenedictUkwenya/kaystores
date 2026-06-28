"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { WithdrawalRequest } from "@/types/dashboard";

type Props = { withdrawal: WithdrawalRequest };

export function AdminWithdrawalActions({ withdrawal }: Props) {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function update(status: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/withdrawals/${withdrawal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          paymentReference: reference,
          adminNote: note,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Update failed");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Input
        label="Payment reference"
        value={reference}
        onChange={(e) => setReference(e.target.value)}
      />
      <Input label="Admin note" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" size="sm" disabled={loading} onClick={() => update("approved")}>
          Approve
        </Button>
        <Button type="button" size="sm" disabled={loading} onClick={() => update("paid")}>
          Mark paid
        </Button>
        <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={() => update("rejected")}>
          Reject
        </Button>
      </div>
    </div>
  );
}
