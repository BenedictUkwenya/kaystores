"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { formatIntegerInput, parseIntegerInput } from "@/lib/data/home";
import { TABLE_COPY, TABLE_ROUTES } from "@/lib/table/catalog";
import { StateSelect } from "@/components/ui/StateSelect";
import { isValidEmail, normalizeNigerianPhone } from "@/lib/geo/nigeria";
import type {
  TableFulfillmentMethod,
  TableRequestCategory,
} from "@/types/table";

const CATEGORIES: { value: TableRequestCategory; label: string }[] = [
  { value: "cake", label: "Cake" },
  { value: "chocolate", label: "Chocolates" },
  { value: "hamper", label: "Hamper" },
  { value: "treat", label: "Treats" },
  { value: "other", label: "Other" },
];

const SIZES = ["Small (6–10)", "Medium (12–20)", "Large (25–40)", "Party (50+)"];

const FLAVOURS = [
  "Vanilla",
  "Chocolate",
  "Red velvet",
  "Fruit",
  "Lemon",
  "Baker's choice",
];

const MAX_PHOTOS = 3;
const MAX_PHOTO_EDGE = 1600;

type HubOption = {
  id: string;
  name: string;
  city: string;
  state: string;
  line1: string;
};

type Props = {
  defaultContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

type Photo = { file: File; preview: string };

/** Shrink phone photos so uploads stay small and fast. */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.82),
    );
    if (!blob) return file;
    const name = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-2 text-[13px] transition-colors ${
        active
          ? "border-kay-fg bg-kay-fg text-kay-accent-fg"
          : "border-kay-border text-kay-fg hover:border-kay-fg/50"
      }`}
    >
      {children}
    </button>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
      {children}
    </p>
  );
}

export function TableRequestForm({ defaultContact }: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deliveryLabel, setDeliveryLabel] = useState("Kay delivery");
  const [deliveryEta, setDeliveryEta] = useState<string | null>(null);
  const [deliveryEnabled, setDeliveryEnabled] = useState(true);
  const [hubs, setHubs] = useState<HubOption[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [flavours, setFlavours] = useState<string[]>([]);
  const [moreOpen, setMoreOpen] = useState(false);
  const [forSomeoneElse, setForSomeoneElse] = useState(false);
  const contactKnown = Boolean(
    defaultContact?.name && defaultContact?.email && defaultContact?.phone,
  );
  const [editContact, setEditContact] = useState(!contactKnown);
  const [form, setForm] = useState({
    category: "cake" as TableRequestCategory,
    occasion: "",
    servings: "",
    styleNotes: "",
    neededBy: "",
    fulfillmentMethod: "delivery" as TableFulfillmentMethod,
    city: "",
    state: "",
    deliveryAddress: "",
    recipientName: "",
    recipientPhone: "",
    allergies: "",
    messageOnItem: "",
    pickupHubId: "",
    budget: "",
    contactName: defaultContact?.name ?? "",
    contactEmail: defaultContact?.email ?? "",
    contactPhone: defaultContact?.phone ?? "",
  });

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/table/fulfillment");
        const data = await res.json();
        if (!res.ok) return;
        setDeliveryEnabled(data.delivery?.enabled !== false);
        setDeliveryLabel(data.delivery?.label || "Kay delivery");
        setDeliveryEta(data.delivery?.eta ?? null);
        const list = (data.hubs ?? []) as HubOption[];
        setHubs(list);
        setForm((prev) => {
          if (prev.pickupHubId || list.length === 0) return prev;
          return { ...prev, pickupHubId: list[0].id };
        });
        if (data.delivery?.enabled === false && list.length > 0) {
          setForm((prev) => ({ ...prev, fulfillmentMethod: "pickup" }));
        }
      } catch {
        /* keep defaults */
      }
    })();
  }, []);

  useEffect(
    () => () => photos.forEach((p) => URL.revokeObjectURL(p.preview)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleFlavour(flavour: string) {
    setFlavours((prev) =>
      prev.includes(flavour) ? prev.filter((f) => f !== flavour) : [...prev, flavour],
    );
  }

  async function addPhotos(list: FileList | null) {
    if (!list?.length) return;
    const room = MAX_PHOTOS - photos.length;
    const picked = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, room);
    const compressed = await Promise.all(picked.map(compressImage));
    setPhotos((prev) => [
      ...prev,
      ...compressed.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.styleNotes.trim() && flavours.length === 0 && photos.length === 0) {
      setError("Add a photo or a few words about what you'd like.");
      return;
    }
    if (!form.contactName.trim() || !isValidEmail(form.contactEmail)) {
      setEditContact(true);
      setError("Enter your name and a valid email.");
      return;
    }
    if (!normalizeNigerianPhone(form.contactPhone)) {
      setEditContact(true);
      setError("Enter a valid Nigerian phone number so we can reach you.");
      return;
    }
    if (form.fulfillmentMethod === "delivery") {
      if (!form.deliveryAddress.trim() || !form.city.trim() || !form.state.trim()) {
        setError("Add the delivery address, city and state.");
        return;
      }
    } else if (!hubs.find((h) => h.id === form.pickupHubId)) {
      setError("Choose a Kay hub for pickup.");
      return;
    }

    const hub = hubs.find((h) => h.id === form.pickupHubId);
    const delivery = form.fulfillmentMethod === "delivery";
    const payload = {
      category: form.category,
      occasion: form.occasion.trim() || undefined,
      servings: form.servings || undefined,
      flavourNotes: flavours.join(", ") || undefined,
      styleNotes: form.styleNotes.trim() || undefined,
      neededBy: form.neededBy || undefined,
      fulfillmentMethod: form.fulfillmentMethod,
      city: delivery ? form.city.trim() : undefined,
      state: delivery ? form.state.trim() : undefined,
      deliveryAddress: delivery ? form.deliveryAddress.trim() : undefined,
      recipientName: form.recipientName.trim() || undefined,
      recipientPhone: form.recipientPhone.trim() || undefined,
      allergies: form.allergies.trim() || undefined,
      messageOnItem: form.messageOnItem.trim() || undefined,
      pickupHubId: delivery ? undefined : hub?.id,
      pickupHubName: delivery ? undefined : hub?.name,
      budget: form.budget ? parseIntegerInput(form.budget) : undefined,
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
    };

    setSubmitting(true);
    try {
      let res: Response;
      if (photos.length > 0) {
        const data = new FormData();
        data.set("payload", JSON.stringify(payload));
        photos.forEach((p) => data.append("images", p.file));
        res = await fetch("/api/table/requests", { method: "POST", body: data });
      } else {
        res = await fetch("/api/table/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not submit request.");
      router.push(TABLE_ROUTES.requestStatus(data.request.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit.");
      setSubmitting(false);
    }
  }

  const isCake = form.category === "cake";

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-7">
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-kay-gold">
          Custom request
        </p>
        <h1 className="mt-2 font-serif text-[32px] text-kay-fg sm:text-[40px]">
          {TABLE_COPY.requestTitle}
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-kay-muted">
          {TABLE_COPY.requestSubtitle}
        </p>
      </div>

      <div>
        <Label>What are you ordering?</Label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              active={form.category === c.value}
              onClick={() => patch("category", c.value)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Label>Show us (optional)</Label>
        <div className="flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <div
              key={p.preview}
              className="relative h-24 w-24 overflow-hidden rounded-xl border border-kay-border"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[13px] text-white"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-kay-border text-kay-muted transition-colors hover:border-kay-fg hover:text-kay-fg"
            >
              <span className="text-[22px] leading-none">+</span>
              <span className="text-[11px]">Add photo</span>
            </button>
          )}
        </div>
        <p className="mt-2 text-[12px] text-kay-muted">
          A screenshot or Pinterest pic says it best — up to {MAX_PHOTOS}.
        </p>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => void addPhotos(e.target.files)}
        />
      </div>

      <Textarea
        label="Describe it"
        value={form.styleNotes}
        onChange={(e) => patch("styleNotes", e.target.value)}
        placeholder={
          isCake
            ? "e.g. 2 tiers, buttercream, pink & gold, “Happy 30th Tolu”"
            : "Tell us what you have in mind"
        }
        rows={2}
      />

      {isCake && (
        <div>
          <Label>Flavour</Label>
          <div className="flex flex-wrap gap-2">
            {FLAVOURS.map((f) => (
              <Chip key={f} active={flavours.includes(f)} onClick={() => toggleFlavour(f)}>
                {f}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div>
        <Label>How many people?</Label>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <Chip
              key={s}
              active={form.servings === s}
              onClick={() => patch("servings", form.servings === s ? "" : s)}
            >
              {s}
            </Chip>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="When do you need it?"
          type="date"
          min={new Date().toISOString().slice(0, 10)}
          value={form.neededBy}
          onChange={(e) => patch("neededBy", e.target.value)}
          hint={isCake ? "Custom cakes need about 3 days." : undefined}
        />
        <Input
          label="Budget (₦, optional)"
          inputMode="numeric"
          value={form.budget}
          onChange={(e) => patch("budget", formatIntegerInput(e.target.value))}
          placeholder="50,000"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className="text-[13px] font-medium text-kay-gold hover:underline"
          aria-expanded={moreOpen}
        >
          {moreOpen ? "− Fewer details" : "+ Occasion, message, allergies"}
        </button>
        {moreOpen && (
          <div className="mt-4 space-y-4">
            <Input
              label="Occasion"
              value={form.occasion}
              onChange={(e) => patch("occasion", e.target.value)}
              placeholder="Birthday, anniversary…"
            />
            <Input
              label={isCake ? "Message on the cake" : "Card note"}
              value={form.messageOnItem}
              maxLength={120}
              onChange={(e) => patch("messageOnItem", e.target.value)}
              placeholder="Happy 30th, Tolu!"
            />
            <Input
              label="Allergies or dietary needs"
              value={form.allergies}
              onChange={(e) => patch("allergies", e.target.value)}
              placeholder="Nut-free, eggless, halal…"
            />
          </div>
        )}
      </div>

      <div className="border-t border-kay-border-light pt-6">
        <Label>Delivery</Label>
        <div className="flex flex-wrap gap-2">
          {deliveryEnabled && (
            <Chip
              active={form.fulfillmentMethod === "delivery"}
              onClick={() => patch("fulfillmentMethod", "delivery")}
            >
              {deliveryLabel}
            </Chip>
          )}
          {hubs.length > 0 && (
            <Chip
              active={form.fulfillmentMethod === "pickup"}
              onClick={() => patch("fulfillmentMethod", "pickup")}
            >
              Pick up at a Kay hub
            </Chip>
          )}
        </div>
        {form.fulfillmentMethod === "delivery" && deliveryEta && (
          <p className="mt-2 text-[12px] text-kay-muted">{deliveryEta}</p>
        )}

        {form.fulfillmentMethod === "delivery" ? (
          <div className="mt-4 space-y-4">
            <Input
              label="Address"
              value={form.deliveryAddress}
              onChange={(e) => patch("deliveryAddress", e.target.value)}
              placeholder="House number, street, landmark"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="City / area"
                value={form.city}
                onChange={(e) => patch("city", e.target.value)}
                placeholder="e.g. Ikeja"
                required
              />
              <StateSelect
                value={form.state}
                onChange={(state) => patch("state", state)}
                required
              />
            </div>
            {forSomeoneElse ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Recipient name"
                  value={form.recipientName}
                  onChange={(e) => patch("recipientName", e.target.value)}
                />
                <Input
                  label="Recipient phone"
                  type="tel"
                  value={form.recipientPhone}
                  onChange={(e) => patch("recipientPhone", e.target.value)}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setForSomeoneElse(true)}
                className="text-[13px] font-medium text-kay-gold hover:underline"
              >
                + Sending to someone else?
              </button>
            )}
          </div>
        ) : (
          <div className="mt-4">
            <select
              value={form.pickupHubId}
              onChange={(e) => patch("pickupHubId", e.target.value)}
              className="h-11 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[13px] outline-none focus:border-kay-fg"
              required
            >
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                  {h.city ? ` — ${h.city}` : ""}
                  {h.state ? `, ${h.state}` : ""}
                </option>
              ))}
            </select>
            {hubs.find((h) => h.id === form.pickupHubId)?.line1 && (
              <p className="mt-2 text-[12px] text-kay-muted">
                {hubs.find((h) => h.id === form.pickupHubId)?.line1}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-kay-border-light pt-6">
        <Label>Your details</Label>
        {editContact ? (
          <div className="space-y-4">
            <Input
              label="Full name"
              value={form.contactName}
              onChange={(e) => patch("contactName", e.target.value)}
              autoComplete="name"
              required
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => patch("contactEmail", e.target.value)}
                autoComplete="email"
                required
              />
              <Input
                label="Phone"
                type="tel"
                value={form.contactPhone}
                onChange={(e) => patch("contactPhone", e.target.value)}
                placeholder="0803 000 0000"
                autoComplete="tel"
                required
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-kay-border-light bg-kay-surface px-4 py-3 text-[13px]">
            <p className="min-w-0 truncate text-kay-fg">
              {form.contactName} · {form.contactPhone}
              <span className="block truncate text-kay-muted">{form.contactEmail}</span>
            </p>
            <button
              type="button"
              onClick={() => setEditContact(true)}
              className="shrink-0 text-[12px] font-medium text-kay-gold hover:underline"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-[13px] text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="table-cta inline-flex h-12 w-full items-center justify-center rounded-full text-[14px] font-semibold disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Get my quote"}
      </button>
      <p className="-mt-3 text-center text-[12px] text-kay-muted">
        No payment now — we&apos;ll send you a price to accept or decline.
      </p>
    </form>
  );
}
