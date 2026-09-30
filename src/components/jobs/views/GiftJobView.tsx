import { createAdminClient } from "@/lib/supabase/admin";
import { formatNaira } from "@/lib/data/home";
import { formatAddressLines, getDeliveryAddress, mapsUrl } from "@/lib/orders/address";
import type { Job } from "@/lib/jobs/types";
import type { Order } from "@/types/order";
import { AdminOrderActions } from "@/components/admin/AdminOrderActions";
import { AdminItemHubActions } from "@/components/admin/AdminItemHubActions";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { OrderSupportChat } from "@/components/orders/OrderSupportChat";
import { PartiesPanel } from "@/components/jobs/PartiesPanel";
import { HubStepControls } from "@/components/jobs/JobControls";
import { DetailSection, JobPageShell } from "@/components/jobs/JobPageShell";

type VendorItemRow = {
  id: string;
  vendor_id: string | null;
  product_name: string;
  quantity: number;
  fulfillment_status: string;
  selected_hub_name: string | null;
  selected_hub_phone: string | null;
  vendor_dispatched_at: string | null;
  hub_reminder_sent_at: string | null;
  hub_notes: string | null;
  qc_note?: string | null;
  vendor_earnings: number | null;
  updated_at?: string | null;
  vendors: {
    business_name?: string;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    pickup_address?: { line1?: string; city?: string; state?: string } | null;
  } | null;
};

export async function GiftJobView({ job, order }: { job: Job; order: Order }) {
  const admin = createAdminClient();
  const { data } =
    (await admin
      ?.from("vendor_order_items")
      .select("*, vendors(business_name, contact_name, contact_phone, contact_email, pickup_address)")
      .eq("order_id", order.id)) ?? { data: [] };
  const items = (data ?? []) as unknown as VendorItemRow[];
  const openItems = items.filter((i) => i.fulfillment_status !== "cancelled");
  const paid = order.paymentStatus === "paid";
  const allItemsQcPassed = openItems.every((i) =>
    ["qc_passed", "dispatched", "completed"].includes(i.fulfillment_status),
  );

  const address = getDeliveryAddress(order);
  const addressLines = formatAddressLines(address);
  const mapHref = mapsUrl(address);
  const shipToName =
    order.deliveryType === "gift" ? order.gift?.recipientName || "Gift recipient" : order.buyer.fullName;

  const orderActions = (
    <AdminOrderActions
      orderId={order.id}
      paymentStatus={order.paymentStatus}
      paymentReference={order.paymentReference ?? undefined}
      orderStatus={order.status}
      allItemsQcPassed={allItemsQcPassed}
      trackingNumber={order.tracking?.number}
      trackingCarrier={order.tracking?.carrier}
      trackingUrl={order.tracking?.url}
      isGift={order.deliveryType === "gift"}
    />
  );
  const itemStep = job.actor === "admin" && job.quickAction?.itemId;
  const controls =
    job.actor !== "admin" ? null : itemStep ? (
      <HubStepControls
        kind="gift"
        id={order.id}
        quickAction={job.quickAction}
        allowQcFail={job.quickAction?.action === "qc_pass"}
      />
    ) : job.quickAction ? (
      <HubStepControls kind="gift" id={order.id} quickAction={job.quickAction} />
    ) : (
      orderActions
    );
  const more = controls === orderActions ? null : orderActions;

  const fmtTime = (value: string | null | undefined) =>
    value ? new Date(value).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : null;

  return (
    <JobPageShell
      job={job}
      controls={controls}
      waitingHint={
        job.actor === "vendor" ? (
          <>Vendors are reminded automatically after 12 hours. Message them on the Vendor line below.</>
        ) : job.actor === "client" ? (
          <>If the client paid by bank transfer without telling us, record it under More actions.</>
        ) : null
      }
      more={more}
      parties={
        <PartiesPanel
          paid={paid}
          clientAmount={order.pricing.grandTotal}
          vendorAmount={job.vendorAmount}
          client={{
            name: order.buyer.fullName || order.buyer.email,
            lines: [order.buyer.email, order.buyer.phone],
          }}
          vendor={{
            name: job.vendorNames.length ? job.vendorNames.join(", ") : "Kay stock",
            lines: [`${openItems.length} item(s) to collect at the hub`],
          }}
        />
      }
      details={
        <div className="space-y-4">
          <DetailSection title="Ship to">
            <p className="text-[16px] font-semibold text-kay-fg">{shipToName}</p>
            <p>
              {order.deliveryType === "gift" ? "Gift delivery" : "Buyer address"}
              {order.anonymousPackaging ? " · Anonymous packaging" : ""}
            </p>
            {addressLines.length > 0 ? (
              <p className="whitespace-pre-line text-kay-fg">{addressLines.join("\n")}</p>
            ) : (
              <p className="text-red-600">
                No delivery address yet
                {order.handoverStatus === "pending" ? " — waiting for the recipient to add it." : "."}
              </p>
            )}
            {order.gift && (
              <p>
                Recipient: {order.gift.recipientName}
                {order.gift.recipientPhone || order.gift.recipientWhatsApp
                  ? ` · ${order.gift.recipientPhone || order.gift.recipientWhatsApp}`
                  : ""}
                {order.gift.anonymous ? " · Sender name hidden" : ""}
              </p>
            )}
            {order.gift?.note && (
              <p className="rounded-lg bg-kay-surface px-3 py-2 text-kay-fg">Gift note: {order.gift.note}</p>
            )}
            {mapHref && (
              <a href={mapHref} target="_blank" rel="noreferrer" className="text-kay-fg underline underline-offset-2">
                Open in Maps
              </a>
            )}
          </DetailSection>

          <DetailSection title="Items and who's sending them">
            {items.length === 0 ? (
              <ul className="space-y-1">
                {order.items.map((item) => (
                  <li key={item.productId} className="flex justify-between gap-3">
                    <span className="text-kay-fg">
                      {item.name} × {item.quantity} <span className="text-kay-subtle">· Kay stock</span>
                    </span>
                    <span>{formatNaira(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-3">
                {items.map((vi) => {
                  const vendor = vi.vendors;
                  return (
                    <li
                      key={vi.id}
                      className="flex flex-col gap-2 rounded-xl border border-kay-border-light p-3 sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-medium text-kay-fg">
                          {vi.product_name} × {vi.quantity}
                        </p>
                        {vendor && (
                          <p className="text-[12px]">
                            {vendor.business_name}
                            {vendor.contact_phone && (
                              <>
                                {" · "}
                                <a href={`tel:${vendor.contact_phone}`} className="underline underline-offset-2">
                                  {vendor.contact_phone}
                                </a>
                              </>
                            )}
                          </p>
                        )}
                        <p className="text-[12px]">
                          {vi.selected_hub_name
                            ? `Hub: ${vi.selected_hub_name}${vi.vendor_dispatched_at ? ` · sent ${fmtTime(vi.vendor_dispatched_at)}` : " · not sent yet"}`
                            : paid && vi.fulfillment_status === "awaiting_hub_delivery"
                              ? "Vendor hasn't picked a hub yet"
                              : null}
                        </p>
                        {vi.hub_notes && <p className="text-[12px] text-kay-fg">Vendor note: {vi.hub_notes}</p>}
                        {vi.qc_note && vi.fulfillment_status === "awaiting_hub_delivery" && (
                          <p className="text-[12px] text-red-700">Failed QC: {vi.qc_note}</p>
                        )}
                        {vi.hub_reminder_sent_at && vi.fulfillment_status === "awaiting_hub_delivery" && !vi.vendor_dispatched_at && (
                          <p className="text-[12px] text-amber-700">Reminder sent — still not dispatched</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 sm:items-end">
                        <StatusBadge status={vi.fulfillment_status} />
                        <AdminItemHubActions
                          orderId={order.id}
                          itemId={vi.id}
                          status={vi.fulfillment_status}
                          orderPaid={paid}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="pt-2 font-serif text-[20px] text-kay-fg">{formatNaira(order.pricing.grandTotal)}</p>
          </DetailSection>
        </div>
      }
      chat={<OrderSupportChat orderId={order.id} viewerRole="admin" />}
      timeline={[
        { at: order.createdAt, label: "Order placed", detail: order.buyer.fullName },
        { at: order.paidAt, label: "Paid", detail: order.paymentReference },
        ...items.map((vi) => ({
          at: vi.vendor_dispatched_at,
          label: `${vi.vendors?.business_name ?? "Vendor"} sent ${vi.product_name}`,
          detail: vi.selected_hub_name,
        })),
      ]}
    />
  );
}
