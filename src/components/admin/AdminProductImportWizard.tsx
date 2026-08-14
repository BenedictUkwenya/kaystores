"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductPlacementPicker } from "@/components/vendor/ProductPlacementPicker";
import { formatNaira } from "@/lib/data/home";
import { hasAnyPlacement } from "@/lib/shop/taxonomy";
import type { Vendor } from "@/types/dashboard";

type PreviewRow = {
  index: number;
  name: string;
  sku: string;
  slug: string;
  price: number;
  stock: number;
  brand: string;
  imageCount: number;
  errors: string[];
  warnings: string[];
};

type CommitResult = {
  created: { name: string; sku: string; slug: string }[];
  errors: { index: number; sku: string; error: string }[];
  skipped: number;
};

type Props = {
  vendors: Vendor[];
  initialVendorId?: string;
};

const STEPS = ["Vendor", "Defaults", "Files", "Preview"] as const;

export function AdminProductImportWizard({ vendors, initialVendorId }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [query, setQuery] = useState("");
  const [vendorId, setVendorId] = useState(initialVendorId ?? "");
  const vendor = vendors.find((v) => v.id === vendorId) ?? null;

  const [brand, setBrand] = useState(vendor?.businessName ?? "");
  const [segment, setSegment] = useState<"gifting" | "after_dark">("gifting");
  const [stock, setStock] = useState("20");
  const [publish, setPublish] = useState(true);
  const [placement, setPlacement] = useState({
    occasions: [] as string[],
    recipients: [] as string[],
    collections: [] as string[],
  });

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [skipIndexes, setSkipIndexes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);

  const filteredVendors = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(
      (v) =>
        v.businessName.toLowerCase().includes(q) ||
        v.contactEmail.toLowerCase().includes(q) ||
        v.contactName.toLowerCase().includes(q),
    );
  }, [query, vendors]);

  function selectVendor(next: Vendor) {
    setVendorId(next.id);
    setBrand((current) =>
      !current.trim() || current === vendor?.businessName
        ? next.businessName
        : current,
    );
    if (!next.canListAfterDark) setSegment("gifting");
  }

  function defaultsPayload() {
    return {
      brand: brand.trim() || vendor?.businessName || "",
      segment,
      occasions: placement.occasions,
      recipients: placement.recipients,
      collections: placement.collections,
      stock: Math.max(1, Math.floor(Number(stock) || 20)),
      publish,
    };
  }

  function buildForm(dryRun: boolean) {
    const form = new FormData();
    form.set("vendorId", vendorId);
    form.set("defaults", JSON.stringify(defaultsPayload()));
    form.set("dryRun", dryRun ? "true" : "false");
    if (!dryRun) {
      form.set("skipIndexes", [...skipIndexes].join(","));
    }
    if (csvFile) form.set("csv", csvFile);
    if (zipFile) form.set("zip", zipFile);
    for (const file of imageFiles) form.append("images", file);
    return form;
  }

  async function runPreview() {
    setError(null);
    if (!csvFile) {
      setError("Upload a CSV file first.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: buildForm(true),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Preview failed.");
      const nextRows = (data.rows ?? []) as PreviewRow[];
      setRows(nextRows);
      setSkipIndexes(new Set(nextRows.filter((r) => r.errors.length > 0).map((r) => r.index)));
      setResult(null);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed.");
    } finally {
      setLoading(false);
    }
  }

  async function runImport() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        body: buildForm(false),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Import failed.");
      setResult({
        created: data.created ?? [],
        errors: data.errors ?? [],
        skipped: data.skipped ?? 0,
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  const readyCount = rows.filter(
    (row) => row.errors.length === 0 && !skipIndexes.has(row.index),
  ).length;

  return (
    <div className="space-y-8">
      <ol className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] uppercase tracking-[0.12em] text-kay-subtle">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={i === step ? "font-semibold text-kay-fg" : undefined}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="space-y-4">
          <p className="text-[14px] text-kay-muted">
            Choose the approved vendor these listings belong to.
          </p>
          {vendors.length === 0 ? (
            <p className="text-[14px] text-kay-muted">No approved vendors yet.</p>
          ) : (
            <>
              <Input
                label="Search vendors"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Business name or email"
              />
              <ul className="divide-y divide-kay-border-light border-y border-kay-border-light">
                {filteredVendors.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => selectVendor(item)}
                      className={`flex w-full items-baseline justify-between gap-4 px-1 py-3 text-left ${
                        vendorId === item.id ? "text-kay-fg" : "text-kay-muted"
                      }`}
                    >
                      <span className="font-medium">{item.businessName}</span>
                      <span className="text-[12px]">{item.contactEmail}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      {step === 1 && vendor && (
        <section className="space-y-5">
          <p className="text-[14px] text-kay-muted">
            Applied to every row unless the CSV overrides brand, stock, or
            categories.
          </p>
          <Input
            label="Brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            hint={`Prefills from ${vendor.businessName}`}
            required
          />
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
              Segment
            </label>
            <select
              value={segment}
              onChange={(e) =>
                setSegment(e.target.value as "gifting" | "after_dark")
              }
              className="h-11 w-full rounded-lg border border-kay-border bg-kay-input-bg px-3.5 text-[14px]"
            >
              <option value="gifting">Luxury gifting</option>
              {vendor.canListAfterDark && (
                <option value="after_dark">After Dark</option>
              )}
            </select>
          </div>
          <Input
            label="Default stock"
            type="number"
            min={1}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
              Publish mode
            </p>
            <div className="flex gap-4 text-[14px]">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="publish"
                  checked={publish}
                  onChange={() => setPublish(true)}
                />
                Live
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="publish"
                  checked={!publish}
                  onChange={() => setPublish(false)}
                />
                Draft
              </label>
            </div>
          </div>
          <ProductPlacementPicker value={placement} onChange={setPlacement} />
          {publish && !hasAnyPlacement(placement) && (
            <p className="text-[13px] text-kay-muted">
              Choose at least one category here, or fill occasions / recipients /
              collections in the CSV, before publishing live.
            </p>
          )}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-5">
          <p className="text-[14px] leading-relaxed text-kay-muted">
            Required CSV columns: name, sku, price. Name images by SKU —{" "}
            <span className="font-mono text-kay-fg">TEST-KAY-001.jpg</span>,{" "}
            <span className="font-mono text-kay-fg">TEST-KAY-001-2.jpg</span>{" "}
            (up to 3). Keep the zip under about 4 MB, or upload loose files.
          </p>
          <a
            href="/api/admin/products/import/template"
            className="inline-block text-[13px] font-medium text-kay-gold hover:underline"
          >
            Download CSV template
          </a>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
              CSV
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
              className="text-[13px]"
            />
            {csvFile && (
              <p className="mt-1.5 text-[12px] text-kay-subtle">{csvFile.name}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
              Image zip (optional)
            </label>
            <input
              type="file"
              accept=".zip,application/zip"
              onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
              className="text-[13px]"
            />
            {zipFile && (
              <p className="mt-1.5 text-[12px] text-kay-subtle">{zipFile.name}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
              Loose image files (optional)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
              multiple
              onChange={(e) => setImageFiles(Array.from(e.target.files ?? []))}
              className="text-[13px]"
            />
            {imageFiles.length > 0 && (
              <p className="mt-1.5 text-[12px] text-kay-subtle">
                {imageFiles.length} file{imageFiles.length === 1 ? "" : "s"}
              </p>
            )}
          </div>
        </section>
      )}

      {step === 3 && !result && (
        <section className="space-y-4">
          <p className="text-[14px] text-kay-muted">
            {readyCount} ready to import. Rows with errors are skipped unless you
            fix the CSV and preview again.
          </p>
          {rows.length === 0 ? (
            <p className="text-[14px] text-kay-muted">No rows in this CSV.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-kay-border-light text-[11px] uppercase tracking-[0.12em] text-kay-subtle">
                    <th className="py-2 pr-3 font-medium">Include</th>
                    <th className="py-2 pr-3 font-medium">Name</th>
                    <th className="py-2 pr-3 font-medium">SKU</th>
                    <th className="py-2 pr-3 font-medium">Price</th>
                    <th className="py-2 pr-3 font-medium">Stock</th>
                    <th className="py-2 pr-3 font-medium">Images</th>
                    <th className="py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const blocked = row.errors.length > 0;
                    return (
                      <tr
                        key={row.index}
                        className="border-b border-kay-border-light/70 align-top"
                      >
                        <td className="py-3 pr-3">
                          <input
                            type="checkbox"
                            disabled={blocked}
                            checked={!skipIndexes.has(row.index) && !blocked}
                            onChange={(e) => {
                              setSkipIndexes((prev) => {
                                const next = new Set(prev);
                                if (e.target.checked) next.delete(row.index);
                                else next.add(row.index);
                                return next;
                              });
                            }}
                          />
                        </td>
                        <td className="py-3 pr-3">
                          <p className="font-medium text-kay-fg">{row.name || "—"}</p>
                          <p className="text-[12px] text-kay-subtle">{row.slug}</p>
                        </td>
                        <td className="py-3 pr-3 font-mono text-[12px]">{row.sku || "—"}</td>
                        <td className="py-3 pr-3">{formatNaira(row.price)}</td>
                        <td className="py-3 pr-3">{row.stock}</td>
                        <td className="py-3 pr-3">{row.imageCount}</td>
                        <td className="py-3">
                          {row.errors.map((msg) => (
                            <p key={msg} className="text-red-600">
                              {msg}
                            </p>
                          ))}
                          {row.warnings.map((msg) => (
                            <p key={msg} className="text-kay-muted">
                              {msg}
                            </p>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {result && (
        <section className="space-y-3">
          <p className="text-[15px] text-kay-fg">
            Created {result.created.length} listing
            {result.created.length === 1 ? "" : "s"}
            {result.skipped ? ` · skipped ${result.skipped}` : ""}
            {result.errors.length ? ` · ${result.errors.length} failed` : ""}.
          </p>
          {result.created.length > 0 && (
            <ul className="space-y-1 text-[13px] text-kay-muted">
              {result.created.map((item) => (
                <li key={item.sku}>
                  {item.name}{" "}
                  <span className="font-mono text-[12px]">({item.sku})</span>
                </li>
              ))}
            </ul>
          )}
          {result.errors.map((item) => (
            <p key={`${item.index}-${item.sku}`} className="text-[13px] text-red-600">
              {item.sku || `Row ${item.index}`}: {item.error}
            </p>
          ))}
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/admin/products"
              className="text-[13px] font-medium text-kay-gold hover:underline"
            >
              View products
            </Link>
            <button
              type="button"
              className="text-[13px] font-medium text-kay-gold hover:underline"
              onClick={() => {
                setResult(null);
                setRows([]);
                setCsvFile(null);
                setZipFile(null);
                setImageFiles([]);
                setStep(2);
              }}
            >
              Import another batch
            </button>
          </div>
        </section>
      )}

      {error && <p className="text-[13px] text-red-600">{error}</p>}

      {!result && (
        <div className="flex flex-wrap gap-3">
          {step > 0 && (
            <Button
              type="button"
              variant="secondary"
              disabled={loading}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
          )}
          {step === 0 && (
            <Button
              type="button"
              disabled={!vendorId}
              onClick={() => setStep(1)}
            >
              Continue
            </Button>
          )}
          {step === 1 && (
            <Button
              type="button"
              disabled={!brand.trim()}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          )}
          {step === 2 && (
            <Button
              type="button"
              disabled={loading || !csvFile}
              onClick={() => void runPreview()}
            >
              {loading ? "Checking…" : "Preview"}
            </Button>
          )}
          {step === 3 && (
            <Button
              type="button"
              disabled={loading || readyCount === 0}
              onClick={() => void runImport()}
            >
              {loading
                ? "Importing…"
                : `Import ${readyCount} product${readyCount === 1 ? "" : "s"}`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
