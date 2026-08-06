"use client";

import { useState } from "react";
import type { PendingRoleInvite } from "@/types/dashboard";

type Props = {
  invite: PendingRoleInvite;
};

export function AdminPendingInviteActions({ invite }: Props) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(invite.inviteUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy link");
    }
  }

  async function sendReminder() {
    setLoading(true);
    setSent(false);
    try {
      const res = await fetch(`/api/admin/users/invites/${invite.id}/remind`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reminder failed");
      setSent(true);
      window.setTimeout(() => setSent(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Reminder failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={sendReminder}
        className="inline-flex h-8 items-center rounded-full border border-kay-fg/20 bg-kay-fg px-3.5 text-[11px] font-medium text-kay-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {sent ? "Sent" : loading ? "Sending…" : "Send reminder"}
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-8 items-center rounded-full border border-kay-border px-3.5 text-[11px] font-medium text-kay-muted transition-colors hover:border-kay-fg hover:text-kay-fg"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
