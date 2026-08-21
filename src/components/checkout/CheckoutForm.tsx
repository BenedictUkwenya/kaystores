"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/providers/CartProvider";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CheckoutStep } from "@/components/checkout/CheckoutStep";
import { ManualPaymentConfirm } from "@/components/checkout/ManualPaymentConfirm";
import {
  IconArrowRight,
  IconGift,
  IconPackage,
  IconUpload,
} from "@/components/ui/Icons";
import type { DeliveryType } from "@/types/order";
import { GIFT_NOTE_MAX_LENGTH } from "@/types/order";
import {
  calculateOrderPricing,
  toPricingPayload,
} from "@/lib/pricing/calculate";
import { formatNaira } from "@/lib/data/home";
import { SITE_ROUTES } from "@/lib/data/site-routes";
import { useCheckoutPrefill } from "@/hooks/useCheckoutPrefill";
import { CheckoutProcessing } from "@/components/checkout/CheckoutProcessing";
import { AfterDarkPrivacyBanner } from "@/components/checkout/AfterDarkPrivacyBanner";

const emptyAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nigeria",
};

export function CheckoutForm({
  isPrivateCheckout = false,
}: {
  isPrivateCheckout?: boolean;
}) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("self");
  const [shippingQuotes, setShippingQuotes] = useState<
    {
      token: string;
      carrierName: string;
      serviceName?: string;
      amount: number;
      deliveryEta?: string;
    }[]
  >([]);
  const [selectedShippingToken, setSelectedShippingToken] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{
    id: string;
    orderNumber: string;
  } | null>(null);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [buyer, setBuyer] = useState({ email: "", phone: "" });
  const [buyerAddress, setBuyerAddress] = useState(emptyAddress);

  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientWhatsApp, setRecipientWhatsApp] = useState("");
  const [giftNote, setGiftNote] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState(emptyAddress);
  const [addReveal, setAddReveal] = useState(false);
  const [revealVideo, setRevealVideo] = useState<File | null>(null);
  const [revealPhoto, setRevealPhoto] = useState<File | null>(null);
  const revealVideoRef = useRef<HTMLInputElement>(null);
  const revealPhotoRef = useRef<HTMLInputElement>(null);

  const fullName = `${firstName} ${lastName}`.trim();
  const selectedShipping = shippingQuotes.find(
    (quote) => quote.token === selectedShippingToken,
  );
  const pricing = useMemo(
    () => calculateOrderPricing(items, selectedShipping?.amount),
    [items, selectedShipping?.amount],
  );

  useCheckoutPrefill({ setFirstName, setLastName, setBuyer });

  async function getDeliveryRates() {
    setError("");
    const destination =
      deliveryType === "gift" ? recipientAddress : buyerAddress;
    const recipient =
      deliveryType === "gift"
        ? {
            fullName: recipientName,
            email: recipientEmail,
            phone: recipientWhatsApp || buyer.phone,
          }
        : { fullName, email: buyer.email, phone: buyer.phone };
    if (
      !destination.line1 ||
      !destination.city ||
      !destination.state ||
      !recipient.fullName ||
      !recipient.email ||
      !recipient.phone
    ) {
      setError("Complete the delivery and contact details to see live delivery rates.");
      return;
    }
    setQuoting(true);
    setShippingQuotes([]);
    setSelectedShippingToken("");
    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, destination, recipient }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not retrieve delivery rates.");
      setShippingQuotes(data.quotes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not retrieve delivery rates.");
    } finally {
      setQuoting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your bag is empty.");
      return;
    }

    if (!pricing.canCheckout) {
      setError(pricing.movErrors[0] ?? "Minimum order value not met.");
      return;
    }

    if (!firstName || !lastName || !buyer.email || !buyer.phone) {
      setError("Please complete your contact details.");
      return;
    }

    if (deliveryType === "self") {
      if (!buyerAddress.line1 || !buyerAddress.city || !buyerAddress.state) {
        setError("Please complete your delivery address.");
        return;
      }
    }

    if (deliveryType === "gift") {
      if (!recipientName.trim()) {
        setError("Please enter the recipient's name.");
        return;
      }
      if (!recipientEmail.trim()) {
        setError("Please enter the recipient's email.");
        return;
      }
      if (
        !recipientAddress.line1 ||
        !recipientAddress.city ||
        !recipientAddress.state
      ) {
        setError("Please complete the recipient's delivery address.");
        return;
      }
    }

    if (!paidConfirmed) {
      setError('Confirm “Yes, I have paid” before placing your order.');
      return;
    }
    if (!selectedShippingToken) {
      setError("Select a live delivery service before placing your order.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryType,
          items,
          subtotal: pricing.productSubtotal,
          pricing: toPricingPayload(pricing),
          shippingQuoteToken: selectedShippingToken,
          buyer: { fullName, email: buyer.email, phone: buyer.phone },
          buyerAddress: deliveryType === "self" ? buyerAddress : undefined,
          paymentConfirmed: true,
          gift:
            deliveryType === "gift"
              ? {
                  recipientName,
                  recipientEmail: recipientEmail.trim(),
                  recipientPhone: recipientWhatsApp || undefined,
                  recipientWhatsApp: recipientWhatsApp || undefined,
                  note: giftNote,
                  anonymous,
                  addressUnknown: false,
                  recipientAddress,
                }
              : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not place order.");
      }

      const order = await res.json();
      setPlacedOrder({ id: order.id, orderNumber: order.orderNumber });
      clearCart();

      if (
        deliveryType === "gift" &&
        (addReveal || revealVideo || revealPhoto || giftNote.trim())
      ) {
        try {
          const { uploadRevealFileDirect } = await import(
            "@/lib/reveal/client-upload"
          );
          let videoPath: string | undefined;
          let photoPath: string | undefined;
          if (revealVideo) {
            videoPath = await uploadRevealFileDirect({
              orderId: order.id,
              buyerEmail: buyer.email.trim().toLowerCase(),
              file: revealVideo,
              kind: "video",
            });
          }
          if (revealPhoto) {
            photoPath = await uploadRevealFileDirect({
              orderId: order.id,
              buyerEmail: buyer.email.trim().toLowerCase(),
              file: revealPhoto,
              kind: "photo",
            });
          }
          await fetch(`/api/orders/${order.id}/reveal`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              buyerEmail: buyer.email.trim().toLowerCase(),
              note: giftNote,
              videoPath,
              photoPath,
            }),
          });
        } catch {
          // Order succeeded — user can finish Reveal on the order page.
        }
        router.replace(`/order/${order.id}/reveal`);
        return;
      }

      router.replace(`/order/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (placedOrder || submitting) {
    return (
      <CheckoutProcessing
        orderNumber={placedOrder?.orderNumber}
        isPrivate={isPrivateCheckout}
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="font-serif text-2xl text-kay-fg">Your bag is empty</p>
        <p className="mt-2 text-[14px] text-kay-muted">
          Add gifts before checking out.
        </p>
        <Button
          variant="outline"
          className="mt-6"
          onClick={() => router.push("/gifts")}
        >
          Browse Gifts
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px] lg:gap-10 xl:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          {isPrivateCheckout && <AfterDarkPrivacyBanner />}

          <CheckoutStep
            step={1}
            title={isPrivateCheckout ? "Discrete delivery" : "Shipping Information"}
          >
            <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setDeliveryType("self")}
                className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition-all ${
                  deliveryType === "self"
                    ? "border-kay-gold bg-kay-gold-light/40"
                    : "border-kay-border hover:border-kay-gold/40"
                }`}
              >
                <IconPackage className="h-5 w-5 shrink-0 text-kay-gold" />
                <div>
                  <p className="text-[13px] font-medium text-kay-fg">
                    {isPrivateCheckout
                      ? "Deliver to me discreetly"
                      : "Delivering to Myself"}
                  </p>
                  <p className="text-[11px] text-kay-muted">
                    {isPrivateCheckout
                      ? "Plain packaging · No item names outside"
                      : "Ship to your address"}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryType("gift")}
                className={`flex items-center gap-3 rounded-lg border p-3.5 text-left transition-all ${
                  deliveryType === "gift"
                    ? "border-kay-gold bg-kay-gold-light/40"
                    : "border-kay-border hover:border-kay-gold/40"
                }`}
              >
                <IconGift className="h-5 w-5 shrink-0 text-kay-gold" />
                <div>
                  <p className="text-[13px] font-medium text-kay-fg">
                    {isPrivateCheckout
                      ? "Send privately as a gift"
                      : "Sending as a Gift"}
                  </p>
                  <p className="text-[11px] text-kay-muted">
                    {isPrivateCheckout
                      ? "Anonymous option · Discreet notification"
                      : "Note & anonymous options"}
                  </p>
                </div>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {deliveryType === "gift" && (
                <p className="sm:col-span-2 text-[12px] font-medium uppercase tracking-[0.14em] text-kay-gold">
                  {isPrivateCheckout ? "Your private contact" : "Your details"}
                </p>
              )}
              <Input
                variant="checkout"
                label={isPrivateCheckout ? "Contact name" : "First Name"}
                hint={
                  isPrivateCheckout
                    ? "For delivery only. Never shown publicly."
                    : undefined
                }
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                variant="checkout"
                label={isPrivateCheckout ? "Contact surname" : "Last Name"}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <Input
                variant="checkout"
                label={
                  deliveryType === "gift"
                    ? isPrivateCheckout
                      ? "Your private email"
                      : "Your email"
                    : isPrivateCheckout
                      ? "Private email"
                      : "Email"
                }
                type="email"
                value={buyer.email}
                onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                hint={
                  deliveryType === "gift" || isPrivateCheckout
                    ? "Order updates only. Never used for marketing."
                    : undefined
                }
                required
              />
              <Input
                variant="checkout"
                label={isPrivateCheckout ? "Discrete phone" : "Phone"}
                type="tel"
                value={buyer.phone}
                onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                hint={
                  isPrivateCheckout
                    ? "Courier contact only if required."
                    : undefined
                }
                required
              />

              {deliveryType === "self" ? (
                <>
                  <Input
                    variant="checkout"
                    label={
                      isPrivateCheckout
                        ? "Discrete delivery address"
                        : "Shipping Address"
                    }
                    value={buyerAddress.line1}
                    onChange={(e) =>
                      setBuyerAddress({ ...buyerAddress, line1: e.target.value })
                    }
                    className="sm:col-span-2"
                    required
                  />
                  <Input
                    variant="checkout"
                    label="City"
                    value={buyerAddress.city}
                    onChange={(e) =>
                      setBuyerAddress({ ...buyerAddress, city: e.target.value })
                    }
                    required
                  />
                  <Input
                    variant="checkout"
                    label="Postal Code"
                    value={buyerAddress.postalCode}
                    onChange={(e) =>
                      setBuyerAddress({
                        ...buyerAddress,
                        postalCode: e.target.value,
                      })
                    }
                  />
                  <Input
                    variant="checkout"
                    label="State"
                    value={buyerAddress.state}
                    onChange={(e) =>
                      setBuyerAddress({ ...buyerAddress, state: e.target.value })
                    }
                    required
                  />
                  <Input
                    variant="checkout"
                    label="Country"
                    value={buyerAddress.country}
                    onChange={(e) =>
                      setBuyerAddress({
                        ...buyerAddress,
                        country: e.target.value,
                      })
                    }
                    required
                  />
                </>
              ) : (
                <>
                  <p className="sm:col-span-2 mt-2 text-[12px] font-medium uppercase tracking-[0.14em] text-kay-gold">
                    {isPrivateCheckout ? "Recipient (private)" : "Recipient details"}
                  </p>
                  <Input
                    variant="checkout"
                    label="Recipient name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="sm:col-span-2"
                    required
                  />
                  <Input
                    variant="checkout"
                    label="Recipient email"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    hint={
                      isPrivateCheckout
                        ? "Discreet notification only — no product details inside."
                        : "They'll receive a gift notification at this address."
                    }
                    required
                  />
                  <Input
                    variant="checkout"
                    label="Recipient WhatsApp (optional)"
                    type="tel"
                    value={recipientWhatsApp}
                    onChange={(e) => setRecipientWhatsApp(e.target.value)}
                  />

                  <Input
                    variant="checkout"
                    label={
                      isPrivateCheckout
                        ? "Discrete delivery address"
                        : "Shipping address"
                    }
                    value={recipientAddress.line1}
                    onChange={(e) =>
                      setRecipientAddress({
                        ...recipientAddress,
                        line1: e.target.value,
                      })
                    }
                    className="sm:col-span-2"
                    hint="Required — Kay delivers to the address you provide."
                    required
                  />
                  <Input
                    variant="checkout"
                    label="City"
                    value={recipientAddress.city}
                    onChange={(e) =>
                      setRecipientAddress({
                        ...recipientAddress,
                        city: e.target.value,
                      })
                    }
                    required
                  />
                  <Input
                    variant="checkout"
                    label="Postal Code"
                    value={recipientAddress.postalCode}
                    onChange={(e) =>
                      setRecipientAddress({
                        ...recipientAddress,
                        postalCode: e.target.value,
                      })
                    }
                  />
                  <Input
                    variant="checkout"
                    label="State"
                    value={recipientAddress.state}
                    onChange={(e) =>
                      setRecipientAddress({
                        ...recipientAddress,
                        state: e.target.value,
                      })
                    }
                    required
                  />

                  <div className="sm:col-span-2">
                    <Textarea
                      label="Gift note"
                      value={giftNote}
                      onChange={(e) => setGiftNote(e.target.value)}
                      maxLength={GIFT_NOTE_MAX_LENGTH}
                      placeholder="A personal message for the gift card…"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Toggle
                      label="Send anonymously"
                      description="Your name won't appear on the gift card or packing slip."
                      checked={anonymous}
                      onChange={setAnonymous}
                    />
                  </div>

                  <div className="sm:col-span-2 rounded-xl border border-kay-gold/25 bg-kay-beta-bg/40 p-4">
                    <Toggle
                      label="Add a Kay Reveal"
                      description="Optional video, photo, or note behind a Kay QR on the box. You can finish this after checkout too."
                      checked={addReveal}
                      onChange={setAddReveal}
                    />
                    {addReveal && (
                      <div className="mt-4 space-y-3 border-t border-kay-border-light pt-4">
                        <p className="text-[13px] font-medium text-kay-fg">
                          Choose what goes behind the QR
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <input
                              ref={revealVideoRef}
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime"
                              className="sr-only"
                              onChange={(e) =>
                                setRevealVideo(e.target.files?.[0] ?? null)
                              }
                            />
                            <button
                              type="button"
                              onClick={() => revealVideoRef.current?.click()}
                              className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-kay-gold/50 bg-kay-surface px-3 text-center transition-colors hover:border-kay-gold hover:bg-kay-surface-elevated"
                            >
                              <IconUpload className="h-4 w-4 text-kay-gold" />
                              <span className="text-[13px] font-medium text-kay-fg">
                                {revealVideo ? "Change video" : "Select video"}
                              </span>
                              <span className="text-[11px] text-kay-muted">
                                MP4, WebM, or MOV
                              </span>
                            </button>
                            {revealVideo && (
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <p className="truncate text-[12px] text-kay-muted">
                                  {revealVideo.name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRevealVideo(null);
                                    if (revealVideoRef.current) {
                                      revealVideoRef.current.value = "";
                                    }
                                  }}
                                  className="shrink-0 text-[12px] text-kay-subtle underline-offset-2 hover:text-kay-fg hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>

                          <div>
                            <input
                              ref={revealPhotoRef}
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="sr-only"
                              onChange={(e) =>
                                setRevealPhoto(e.target.files?.[0] ?? null)
                              }
                            />
                            <button
                              type="button"
                              onClick={() => revealPhotoRef.current?.click()}
                              className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-kay-gold/50 bg-kay-surface px-3 text-center transition-colors hover:border-kay-gold hover:bg-kay-surface-elevated"
                            >
                              <IconUpload className="h-4 w-4 text-kay-gold" />
                              <span className="text-[13px] font-medium text-kay-fg">
                                {revealPhoto ? "Change photo" : "Select photo"}
                              </span>
                              <span className="text-[11px] text-kay-muted">
                                PNG, JPG, or WebP
                              </span>
                            </button>
                            {revealPhoto && (
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <p className="truncate text-[12px] text-kay-muted">
                                  {revealPhoto.name}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRevealPhoto(null);
                                    if (revealPhotoRef.current) {
                                      revealPhotoRef.current.value = "";
                                    }
                                  }}
                                  className="shrink-0 text-[12px] text-kay-subtle underline-offset-2 hover:text-kay-fg hover:underline"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-kay-subtle">
                          Gift note above is included in the Reveal. After placing
                          your order you can also record a video on the next
                          screen.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </CheckoutStep>

          <CheckoutStep step={2} title="Delivery service">
            <div className="space-y-3">
              <p className="text-[13px] leading-relaxed text-kay-muted">
                Delivery is dispatched from the Kay hub after quality checks.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={getDeliveryRates}
                disabled={quoting}
              >
                {quoting ? "Finding delivery services…" : "Get live delivery rates"}
              </Button>
              {shippingQuotes.length > 0 && (
                <div className="space-y-2">
                  {shippingQuotes.map((quote) => (
                    <label
                      key={quote.token}
                      className={`flex cursor-pointer items-center justify-between gap-4 rounded-lg border p-3.5 transition-colors ${
                        selectedShippingToken === quote.token
                          ? "border-kay-gold bg-kay-gold-light/40"
                          : "border-kay-border hover:border-kay-gold/40"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <input
                          type="radio"
                          name="shipping-rate"
                          value={quote.token}
                          checked={selectedShippingToken === quote.token}
                          onChange={() => setSelectedShippingToken(quote.token)}
                        />
                        <span>
                          <span className="block text-[13px] font-medium text-kay-fg">
                            {quote.carrierName}
                            {quote.serviceName ? ` · ${quote.serviceName}` : ""}
                          </span>
                          {quote.deliveryEta && (
                            <span className="mt-0.5 block text-[11px] text-kay-muted">
                              {quote.deliveryEta}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold text-kay-fg">
                        {formatNaira(quote.amount)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </CheckoutStep>

          <CheckoutStep step={3} title="Payment">
            <ManualPaymentConfirm
              confirmed={paidConfirmed}
              onChange={setPaidConfirmed}
              amountLabel={formatNaira(pricing.grandTotal)}
            />
          </CheckoutStep>

          {error && (
            <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-[13px] text-red-700">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={submitting || !pricing.canCheckout || !paidConfirmed}
              className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-kay-gold text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(184,154,106,0.4)] transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting
                ? "Placing order…"
                : pricing.canCheckout
                  ? isPrivateCheckout
                    ? "Place private order"
                    : "Place order"
                  : "Minimum order not met"}
              {!submitting && pricing.canCheckout && paidConfirmed && (
                <IconArrowRight className="h-4 w-4" />
              )}
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-kay-subtle">
              By placing your order, you agree to Kay Stores&apos;{" "}
              <Link href={SITE_ROUTES.terms} className="underline hover:text-kay-fg">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href={SITE_ROUTES.privacy} className="underline hover:text-kay-fg">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary
            items={items}
            isPrivateCheckout={isPrivateCheckout}
            pricing={pricing}
          />
        </div>
      </div>
    </form>
  );
}
