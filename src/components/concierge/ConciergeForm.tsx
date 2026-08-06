"use client";

import { useRef, useState, type ComponentType } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import {
  formatIntegerInput,
  parseIntegerInput,
} from "@/lib/data/home";
import {
  IconArrowRight,
  IconInfo,
  IconUpload,
  IconUser,
  IconPackage,
} from "@/components/ui/Icons";

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <h2 className="flex items-center gap-2.5 font-serif text-[18px] text-kay-fg">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-kay-gold-light text-kay-gold">
        <Icon className="h-4 w-4" />
      </span>
      {title}
    </h2>
  );
}

export function ConciergeForm({
  defaultContact,
}: {
  defaultContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    id: string;
    referenceNumber: string;
  } | null>(null);

  const [form, setForm] = useState({
    productName: "",
    brand: "",
    budget: "",
    description: "",
    contactName: defaultContact?.name ?? "",
    contactEmail: defaultContact?.email ?? "",
    contactPhone: defaultContact?.phone ?? "",
  });

  function handleFiles(selected: FileList | null) {
    if (!selected) return;
    const next: File[] = [];
    for (const file of Array.from(selected)) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`${file.name} exceeds 10MB.`);
        return;
      }
      next.push(file);
    }
    setFiles((prev) => [...prev, ...next].slice(0, MAX_FILES));
    setError("");
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.productName.trim()) {
      setError("Please enter a product name.");
      return;
    }

    const budget = parseIntegerInput(form.budget);
    if (budget < 1) {
      setError("Please enter a valid target budget.");
      return;
    }

    setSubmitting(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        body.append(key, key === "budget" ? String(budget) : value);
      });
      files.forEach((file) => body.append("attachments", file));

      const res = await fetch("/api/concierge", {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not submit request.");
      }

      const data = await res.json();
      setSuccess({ id: data.id, referenceNumber: data.referenceNumber });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="concierge-card rounded-xl p-8 text-center shadow-[0_2px_20px_rgba(0,0,0,0.06)] sm:p-10">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-kay-gold-light text-kay-gold">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="mt-5 font-serif text-[28px] text-kay-fg">
          Request received
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-kay-muted">
          Our concierge team will review your sourcing request and contact you
          within 24–48 hours.
        </p>
        <p className="mt-4 text-[13px] text-kay-subtle">
          Reference:{" "}
          <span className="font-medium text-kay-fg">
            {success.referenceNumber}
          </span>
        </p>
        <a
          href={`/concierge/status/${success.id}`}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full border border-kay-border px-6 text-[13px] font-medium text-kay-fg transition-colors hover:border-kay-fg hover:bg-kay-surface"
        >
          Track your request
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="concierge-card overflow-hidden rounded-xl shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
        <section className="p-5 sm:p-6">
          <SectionTitle icon={IconPackage} title="Product specifications" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              variant="checkout"
              label="Product name"
              value={form.productName}
              onChange={(e) =>
                setForm({ ...form, productName: e.target.value })
              }
              placeholder="e.g. Leica M11-P Digital Rangefinder"
              className="sm:col-span-2"
              required
            />
            <Input
              variant="checkout"
              label="Brand / designer"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
              placeholder="e.g. Leica"
            />
            <Input
              variant="checkout"
              label="Target budget (₦)"
              type="text"
              inputMode="numeric"
              value={form.budget}
              onChange={(e) =>
                setForm({ ...form, budget: formatIntegerInput(e.target.value) })
              }
              placeholder="500,000"
              required
            />
            <div className="sm:col-span-2">
              <Textarea
                variant="checkout"
                label="Detailed description & specs"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Colour, year, size, condition, or any specifics that help us source the right item…"
                rows={4}
              />
            </div>
          </div>
        </section>

        <div className="border-t border-kay-border-light" />

        <section className="p-5 sm:p-6">
          <SectionTitle icon={IconUser} title="Your contact details" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Input
              variant="checkout"
              label="Full name"
              value={form.contactName}
              onChange={(e) =>
                setForm({ ...form, contactName: e.target.value })
              }
              required
            />
            <Input
              variant="checkout"
              label="Phone"
              type="tel"
              value={form.contactPhone}
              onChange={(e) =>
                setForm({ ...form, contactPhone: e.target.value })
              }
              required
            />
            <Input
              variant="checkout"
              label="Email"
              type="email"
              value={form.contactEmail}
              onChange={(e) =>
                setForm({ ...form, contactEmail: e.target.value })
              }
              className="sm:col-span-2"
              required
            />
          </div>
        </section>

        <div className="border-t border-kay-border-light" />

        <section className="p-5 sm:p-6">
          <SectionTitle icon={IconUpload} title="Visual reference" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            className="mt-5 flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-kay-border bg-kay-surface/40 px-6 py-10 transition-colors hover:border-kay-gold hover:bg-kay-gold-light/30"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-kay-gold-light text-kay-gold">
              <IconUpload className="h-5 w-5" />
            </div>
            <p className="mt-3 text-[14px] font-medium text-kay-fg">
              Click to upload or drag and drop
            </p>
            <p className="mt-1 text-[12px] text-kay-subtle">
              PNG, JPG, or PDF (max 10MB each, up to {MAX_FILES} files)
            </p>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {files.length > 0 && (
            <ul className="mt-4 space-y-2">
              {files.map((file, i) => (
                <li
                  key={`${file.name}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-kay-border-light bg-kay-surface px-3 py-2 text-[13px]"
                >
                  <span className="truncate text-kay-fg">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="ml-2 shrink-0 text-kay-subtle hover:text-kay-fg"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
        <IconInfo className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-[13px] font-semibold text-amber-900">
            What happens next?
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-amber-900/80">
            Our team will review your request and contact you within 24–48 hours
            with availability, pricing, and next steps. No obligation until you
            approve.
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-kay-gold text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(184,154,106,0.35)] transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit Sourcing Request"}
        {!submitting && <IconArrowRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
