import Link from "next/link";
import { requireVendor } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { listTableRequests, toVendorSafeRequest } from "@/lib/table/repository";
import { mapProductRow } from "@/types/product";
import {
  DashboardLayout,
  VENDOR_NAV,
} from "@/components/dashboard/DashboardLayout";
import { TableRequestChat } from "@/components/table/TableRequestChat";
import { VendorTableQuoteForm } from "@/components/table/VendorTableQuoteForm";
import { TableReferencePhotos } from "@/components/table/TableReferencePhotos";
import { signTableReferenceImages } from "@/lib/table/images";
import { TABLE_STATUS_LABELS } from "@/components/table/TableRequestStatusTimeline";
import { formatNaira } from "@/lib/data/home";
import { isTableCatalogProduct } from "@/lib/table/catalog";
import { listShippingHubs, nearestHubsForVendor } from "@/lib/shipping/hubs";

export default async function VendorTablePage() {
  const { vendor } = await requireVendor();

  if (!vendor.canListTable) {
    return (
      <DashboardLayout
        role="vendor"
        nav={VENDOR_NAV}
        eyebrow="Kay Kitchen"
        title="Edible gifts"
        description="Kay Kitchen access is granted by admin for bakers and edible makers."
      >
        <p className="rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-6 text-[14px] text-kay-muted">
          You do not have Kay Kitchen listing permission yet. Contact Kay admin to
          request access.
        </p>
      </DashboardLayout>
    );
  }

  const supabase = await createClient();
  const { data: productRows } = await supabase
    .from("products")
    .select("*")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const tableProducts = (productRows ?? [])
    .map(mapProductRow)
    .filter(isTableCatalogProduct);

  const requests = (
    await listTableRequests({
      vendorId: vendor.id,
      limit: 50,
    })
  ).map(toVendorSafeRequest);
  const [allHubs, nearest, imageUrls] = await Promise.all([
    listShippingHubs({ activeOnly: true }),
    nearestHubsForVendor(vendor.pickupAddress?.state, 1),
    Promise.all(
      requests.map(
        async (r) => [r.id, await signTableReferenceImages(r.referenceImages)] as const,
      ),
    ).then((entries) => new Map(entries)),
  ]);
  const nearestHub = nearest[0];

  return (
    <DashboardLayout
      role="vendor"
      nav={VENDOR_NAV}
      eyebrow="Kay Kitchen"
      title="Your table"
      description="Manage edible listings and reply to custom cake requests assigned to you."
    >
      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
            Edible products
          </h2>
          <Link
            href="/vendor/products/new"
            className="text-[12px] font-medium text-kay-gold hover:underline"
          >
            Add product
          </Link>
        </div>
        <ul className="mt-4 space-y-2">
          {tableProducts.map((p) => (
            <li key={p.id}>
              <Link
                href={`/vendor/products/${p.id}/edit`}
                className="flex items-center justify-between rounded-xl border border-kay-border-light bg-kay-surface-elevated px-4 py-3 text-[13px] hover:border-kay-fg/30"
              >
                <span className="font-medium text-kay-fg">{p.name}</span>
                <span className="text-kay-muted">{formatNaira(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
        {tableProducts.length === 0 && (
          <p className="mt-3 text-[13px] text-kay-muted">
            No Kay Kitchen products yet. Add a product and select the Kay Kitchen
            collection.
          </p>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-subtle">
          Assigned requests
        </h2>
        <ul className="mt-4 space-y-4">
          {requests.map((request) => {
            const paid = request.paymentStatus === "paid";
            const pickupHub =
              request.fulfillmentMethod === "pickup" && request.pickupHubId
                ? allHubs.find((h) => h.id === request.pickupHubId)
                : undefined;
            const dropHub = pickupHub ?? nearestHub;
            return (
            <li
              key={request.id}
              id={`request-${request.id}`}
              className="scroll-mt-24 rounded-2xl border border-kay-border-light bg-kay-surface-elevated p-5 target:ring-2 target:ring-kay-gold"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-serif text-[20px] text-kay-fg">
                    {request.occasion || request.category}
                  </p>
                  <p className="text-[13px] text-kay-muted">
                    {request.reference} · {TABLE_STATUS_LABELS[request.status]}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    paid ? "bg-emerald-100 text-emerald-800" : "bg-kay-surface text-kay-subtle"
                  }`}
                >
                  {paid ? "Paid — start now" : "Not paid yet — don't start"}
                </span>
              </div>

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
                {[
                  ["Category", request.category],
                  ["Servings / size", request.servings],
                  ["Needed by", request.neededBy],
                  ["Flavours", request.flavourNotes],
                  ["Style", request.styleNotes],
                  ["Message on item", request.messageOnItem],
                  ["Allergies / dietary", request.allergies],
                  ["Client budget", request.budget ? formatNaira(request.budget) : null],
                ]
                  .filter(([, v]) => v)
                  .map(([label, value]) => (
                    <div key={label as string}>
                      <dt className="text-[10px] uppercase tracking-[0.12em] text-kay-subtle">
                        {label}
                      </dt>
                      <dd
                        className={
                          label === "Allergies / dietary" ? "text-amber-800" : "text-kay-fg"
                        }
                      >
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>

              <TableReferencePhotos urls={imageUrls.get(request.id) ?? []} className="mt-4" />

              <VendorTableQuoteForm
                requestId={request.id}
                currentAmount={request.vendorQuoteAmount}
                currentNote={request.vendorQuoteNote}
                quotedAt={request.vendorQuotedAt}
                editable={
                  request.paymentStatus === "unpaid" &&
                  (request.status === "submitted" || request.status === "reviewing")
                }
              />

              {dropHub && (
                <div className="mt-4 rounded-xl border border-kay-gold/25 bg-kay-gold-light/30 p-3 text-[12px] text-kay-fg">
                  <p className="font-medium">
                    When it&apos;s ready, bring it to {dropHub.name}
                  </p>
                  <p className="mt-1 text-kay-muted">
                    {[dropHub.address.line1, dropHub.address.city, dropHub.address.state]
                      .filter(Boolean)
                      .join(", ")}
                    {dropHub.contactPhone ? ` · ${dropHub.contactPhone}` : ""}
                  </p>
                  <p className="mt-1 text-kay-muted">
                    Label it with {request.reference}.{" "}
                    {request.fulfillmentMethod === "pickup"
                      ? "The client collects from this hub."
                      : `Kay delivers to the client${request.city ? ` in ${request.city}` : ""}.`}
                  </p>
                </div>
              )}

              <div className="mt-4">
                <TableRequestChat requestId={request.id} viewerRole="vendor" />
              </div>
            </li>
            );
          })}
        </ul>
        {requests.length === 0 && (
          <p className="mt-3 text-[13px] text-kay-muted">
            No custom requests assigned to you yet.
          </p>
        )}
      </section>
    </DashboardLayout>
  );
}
