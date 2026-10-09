"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { AddressLocationPicker } from "@/components/checkout/AddressLocationPicker";
import { redirectToPaystackCheckout } from "@/components/payments/PaystackPayButton";
import {
  SPLIT_MIN_PEOPLE,
  SPLIT_WINDOW_HOURS,
  maxSplitPeople,
  splitAmounts,
} from "@/lib/payments/split-math";
import {
  IconArrowRight,
  IconGift,
  IconPackage,
  IconSparkle,
  IconUpload,
} from "@/components/ui/Icons";
import type { DeliveryType, AddressDetails } from "@/types/order";
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
import { markCartPendingOrder } from "@/components/checkout/ClearCartOnPaid";
import { isValidEmail, normalizeNigerianPhone } from "@/lib/geo/nigeria";
import { OCCASIONS } from "@/lib/shop/taxonomy";
import { earliestArrivalDate, formatOccasionDate } from "@/lib/orders/occasion";

const emptyAddress: AddressDetails = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nigeria",
};

export function CheckoutForm({
  isPrivateCheckout = false,
  paystackEnabled,
}: {
  isPrivateCheckout?: boolean;
  paystackEnabled: boolean;
}) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const hasPrivateItems = items.some((item) => item.segment === "after_dark");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("self");
  const [shippingQuotes, setShippingQuotes] = useState<
    {
      token: string;
      carrierName: string;
      serviceName?: string;
      amount: number;
      deliveryEta?: string;
      deliveryDate?: string;
      hubName?: string;
      kind?: "manual" | "terminal";
    }[]
  >([]);
  const [selectedShippingToken, setSelectedShippingToken] = useState("");
  const [quoting, setQuoting] = useState(false);
  const [quotingMode, setQuotingMode] = useState<
    "manual" | "terminal" | "all" | null
  >(null);
  const [terminalEnabled, setTerminalEnabled] = useState(true);
  const [manualEnabled, setManualEnabled] = useState(true);
  const [paidConfirmed, setPaidConfirmed] = useState(false);
  const [splitOn, setSplitOn] = useState(false);
  const [splitCount, setSplitCount] = useState(SPLIT_MIN_PEOPLE);
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
  const [anonymousPackaging, setAnonymousPackaging] = useState(
    isPrivateCheckout || hasPrivateItems,
  );
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [occasion, setOccasion] = useState("");
  const [occasionDate, setOccasionDate] = useState("");
  const [recipientEmailOn, setRecipientEmailOn] = useState<"now" | "date">("now");
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

  const splitMax = maxSplitPeople(pricing.grandTotal);
  const splitAvailable = paystackEnabled && splitMax >= SPLIT_MIN_PEOPLE;
  const splitActive = splitAvailable && splitOn;
  const splitPeople = Math.min(Math.max(splitCount, SPLIT_MIN_PEOPLE), Math.max(splitMax, SPLIT_MIN_PEOPLE));
  const splitPreview = splitActive
    ? splitAmounts(pricing.grandTotal, splitPeople)
    : [];

  useCheckoutPrefill({ setFirstName, setLastName, setBuyer });

  useEffect(() => {
    if (isPrivateCheckout || hasPrivateItems) setAnonymousPackaging(true);
  }, [isPrivateCheckout, hasPrivateItems]);

  // A quote is tied to the address and contact it was priced for.
  const quoteKey = JSON.stringify(
    deliveryType === "gift"
      ? [deliveryType, recipientAddress.line1, recipientAddress.city, recipientAddress.state, recipientName, recipientEmail, recipientWhatsApp]
      : [deliveryType, buyerAddress.line1, buyerAddress.city, buyerAddress.state, fullName, buyer.email, buyer.phone],
  );
  const itemsKey = items.map((i) => `${i.productId}:${i.variationOptionId ?? ""}:${i.quantity}`).join("|");
  const lastQuoteKey = useRef(quoteKey + itemsKey);
  useEffect(() => {
    const key = quoteKey + itemsKey;
    if (key === lastQuoteKey.current) return;
    lastQuoteKey.current = key;
    setShippingQuotes([]);
    setSelectedShippingToken("");
  }, [quoteKey, itemsKey]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/shipping/quote");
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.settings) {
          setTerminalEnabled(data.settings.terminalEnabled !== false);
          setManualEnabled(data.settings.manualEnabled !== false);
        }
      } catch {
        // keep defaults
      }
    })();
  }, []);

  async function getDeliveryRates(mode: "terminal" | "manual" | "all" = "all") {
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
      setError(
        "Complete the delivery and contact details to see delivery options.",
      );
      return;
    }
    setQuoting(true);
    setQuotingMode(mode);
    setShippingQuotes([]);
    setSelectedShippingToken("");
    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, destination, recipient, mode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not retrieve delivery rates.");
      if (data.settings) {
        setTerminalEnabled(data.settings.terminalEnabled !== false);
        setManualEnabled(data.settings.manualEnabled !== false);
      }
      const quotes = data.quotes ?? [];
      setShippingQuotes(quotes);
      if (quotes.length === 1) {
        setSelectedShippingToken(quotes[0].token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not retrieve delivery rates.");
    } finally {
      setQuoting(false);
      setQuotingMode(null);
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
    if (!isValidEmail(buyer.email)) {
      setError("Enter a valid email address.");
      return;
    }
    const buyerPhone = normalizeNigerianPhone(buyer.phone);
    if (!buyerPhone) {
      setError("Enter a valid Nigerian phone number, e.g. 0803 123 4567.");
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
      if (!isValidEmail(recipientEmail)) {
        setError("Enter a valid email for the recipient.");
        return;
      }
      if (!normalizeNigerianPhone(recipientWhatsApp)) {
        setError("Add the recipient's phone number so the rider can reach them.");
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
      if (occasion && !occasionDate) {
        setError("Add the date of that occasion.");
        return;
      }
    }

    if (!paystackEnabled && !paidConfirmed) {
      setError('Confirm “Yes, I have paid” before placing your order.');
      return;
    }
    if (!selectedShippingToken) {
      setError("Select a live delivery service before placing your order.");
      return;
    }

    setSubmitting(true);
    const instructions = deliveryNotes.trim() || undefined;
    const recipientPhone = normalizeNigerianPhone(recipientWhatsApp) ?? undefined;

    let createdOrderId: string | null = null;
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
          buyer: { fullName, email: buyer.email.trim(), phone: buyerPhone },
          buyerAddress:
            deliveryType === "self" ? { ...buyerAddress, instructions } : undefined,
          paymentConfirmed: paystackEnabled ? false : true,
          split: splitActive ? { count: splitPeople } : undefined,
          anonymousPackaging,
          gift:
            deliveryType === "gift"
              ? {
                  recipientName: recipientName.trim(),
                  recipientEmail: recipientEmail.trim(),
                  recipientPhone,
                  recipientWhatsApp: recipientPhone,
                  note: giftNote,
                  anonymous,
                  addressUnknown: false,
                  recipientAddress: { ...recipientAddress, instructions },
                  ...(occasion
                    ? {
                        occasion,
                        occasionDate,
                        recipientEmailOn:
                          recipientEmail.trim() && recipientEmailOn === "date"
                            ? "date"
                            : "now",
                      }
                    : { recipientEmailOn: "now" as const }),
                }
              : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Could not place order.");
      }

      const order = await res.json();
      createdOrderId = order.id;
      setPlacedOrder({ id: order.id, orderNumber: order.orderNumber });

      // Pay first — don't block redirect on optional Reveal media upload.
      if (paystackEnabled) {
        // The bag is emptied on the order page once payment is confirmed.
        markCartPendingOrder(order.id);
        if (
          deliveryType === "gift" &&
          (addReveal || revealVideo || revealPhoto || giftNote.trim())
        ) {
          void uploadRevealForOrder(order.id, buyer.email.trim().toLowerCase());
        }
        if (splitActive) {
          clearCart();
          router.replace(`/order/${order.id}/split`);
          return;
        }
        await redirectToPaystackCheckout({
          kind: "order",
          id: order.id,
          email: buyer.email.trim().toLowerCase(),
        });
        return;
      }

      clearCart();

      if (
        deliveryType === "gift" &&
        (addReveal || revealVideo || revealPhoto || giftNote.trim())
      ) {
        try {
          await uploadRevealForOrder(order.id, buyer.email.trim().toLowerCase());
        } catch {
          // Order succeeded — user can finish Reveal on the order page.
        }
        router.replace(`/order/${order.id}/reveal`);
        return;
      }

      router.replace(`/order/${order.id}`);
    } catch (err) {
      if (createdOrderId) {
        // Order exists but Paystack didn't open — the order page has a Pay button.
        router.replace(`/order/${createdOrderId}?payment=retry`);
        return;
      }
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  async function uploadRevealForOrder(orderId: string, buyerEmail: string) {
    const { uploadRevealFileDirect } = await import(
      "@/lib/reveal/client-upload"
    );
    let videoPath: string | undefined;
    let photoPath: string | undefined;
    if (revealVideo) {
      videoPath = await uploadRevealFileDirect({
        orderId,
        buyerEmail,
        file: revealVideo,
        kind: "video",
      });
    }
    if (revealPhoto) {
      photoPath = await uploadRevealFileDirect({
        orderId,
        buyerEmail,
        file: revealPhoto,
        kind: "photo",
      });
    }
    await fetch(`/api/orders/${orderId}/reveal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        buyerEmail,
        note: giftNote,
        videoPath,
        photoPath,
      }),
    });
  }

  if (placedOrder || submitting) {
    return (
      <CheckoutProcessing
        orderNumber={placedOrder?.orderNumber}
        isPrivate={isPrivateCheckout}
        paystackRedirect={paystackEnabled}
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
            title={isPrivateCheckout ? "Discreet delivery" : "Shipping Information"}
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
                      : "Note, Reveal & anonymous options"}
                  </p>
                </div>
              </button>
            </div>

            <div
              className={`mb-5 rounded-xl border p-4 transition-colors ${
                anonymousPackaging
                  ? "border-kay-gold bg-kay-gold-light/30"
                  : "border-kay-border bg-kay-surface/40"
              }`}
            >
              <Toggle
                bare
                id="anonymous-packaging"
                label="Anonymous packaging"
                description="Plain outer wrap — no product names or brand labels on the outside. Available for every Kay order."
                checked={anonymousPackaging}
                onChange={setAnonymousPackaging}
              />
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
                label={isPrivateCheckout ? "Discreet phone" : "Phone"}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="0803 123 4567"
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
                <AddressLocationPicker
                  value={buyerAddress}
                  onChange={setBuyerAddress}
                  label={
                    isPrivateCheckout
                      ? "Discreet delivery address"
                      : "Shipping Address"
                  }
                  required
                />
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
                    label="Recipient phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="off"
                    value={recipientWhatsApp}
                    onChange={(e) => setRecipientWhatsApp(e.target.value)}
                    hint="Only used by the rider on delivery day."
                    placeholder="0803 123 4567"
                    required
                  />

                  <AddressLocationPicker
                    value={recipientAddress}
                    onChange={setRecipientAddress}
                    label={
                      isPrivateCheckout
                        ? "Discreet delivery address"
                        : "Shipping address"
                    }
                    hint="Search or drop a pin — Kay delivers to this address."
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
                      description="Your name won't appear on the gift card, packing slip, or Kay Reveal."
                      checked={anonymous}
                      onChange={setAnonymous}
                    />
                  </div>

                  <div
                    className={`sm:col-span-2 overflow-hidden rounded-2xl border-2 transition-colors ${
                      addReveal
                        ? "border-kay-gold bg-kay-gold-light/35 shadow-[0_0_0_1px_rgba(184,154,106,0.35)]"
                        : "border-kay-gold/70 bg-gradient-to-br from-kay-gold-light/50 via-kay-surface-elevated to-kay-surface"
                    }`}
                  >
                    <div className="flex items-start gap-3 border-b border-kay-gold/25 bg-kay-gold/10 px-4 py-3.5 sm:px-5">
                      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kay-gold text-white">
                        <IconSparkle className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-kay-gold">
                          Signature gift moment
                        </p>
                        <h3 className="mt-1 font-serif text-[22px] leading-tight text-kay-fg sm:text-[24px]">
                          Kay Reveal
                        </h3>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-kay-muted">
                          Add a video, photo, or note. We print a{" "}
                          <span className="font-medium text-kay-fg">
                            Kay QR sticker
                          </span>{" "}
                          on the box — they scan it and your message plays.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 px-4 py-4 sm:px-5 sm:py-5">
                      <Toggle
                        bare
                        id="add-kay-reveal"
                        label={
                          addReveal
                            ? "Kay Reveal is on for this gift"
                            : "Turn on Kay Reveal"
                        }
                        description={
                          addReveal
                            ? "Upload media below, or finish after checkout on the order page."
                            : "Optional — but it’s the magic that makes a Kay gift unforgettable."
                        }
                        checked={addReveal}
                        onChange={setAddReveal}
                      />

                      {!addReveal && (
                        <p className="flex items-center gap-2 rounded-lg border border-dashed border-kay-gold/40 bg-kay-surface/60 px-3 py-2.5 text-[12px] text-kay-muted">
                          <IconGift className="h-3.5 w-3.5 shrink-0 text-kay-gold" />
                          Flip the switch to attach a personal video or photo to
                          the QR on the box.
                        </p>
                      )}

                      {addReveal && (
                        <div className="space-y-3 border-t border-kay-gold/20 pt-4">
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
                                className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-kay-gold/60 bg-kay-surface-elevated px-3 text-center transition-colors hover:border-kay-gold hover:bg-kay-gold-light/30"
                              >
                                <IconUpload className="h-5 w-5 text-kay-gold" />
                                <span className="text-[13px] font-semibold text-kay-fg">
                                  {revealVideo ? "Change video" : "Add video"}
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
                                className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-kay-gold/60 bg-kay-surface-elevated px-3 text-center transition-colors hover:border-kay-gold hover:bg-kay-gold-light/30"
                              >
                                <IconUpload className="h-5 w-5 text-kay-gold" />
                                <span className="text-[13px] font-semibold text-kay-fg">
                                  {revealPhoto ? "Change photo" : "Add photo"}
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
                          <p className="text-[11px] leading-relaxed text-kay-muted">
                            Your gift note above is included in the Reveal. You
                            can also finish or change media after checkout on
                            the order page.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <Textarea
                label="Delivery instructions (optional)"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Gate code, best time to deliver, who to ask for…"
              />
              {deliveryType === "gift" && (
                <div className="space-y-3 rounded-xl border border-kay-border-light bg-kay-surface-elevated p-4">
                  <label className="block text-[13px] text-kay-muted">
                    Occasion
                    <select
                      value={occasion}
                      onChange={(e) => {
                        const next = e.target.value;
                        setOccasion(next);
                        if (!next) {
                          setOccasionDate("");
                          setRecipientEmailOn("now");
                        }
                      }}
                      className="mt-1 h-11 w-full rounded-xl border border-kay-border bg-kay-input-bg px-3 text-[14px] text-kay-fg"
                    >
                      <option value="">No occasion</option>
                      {OCCASIONS.map((item) => (
                        <option key={item.slug} value={item.slug}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {occasion && (
                    <>
                      <label className="block text-[13px] text-kay-muted">
                        Date of the occasion
                        <input
                          type="date"
                          value={occasionDate}
                          onChange={(e) => setOccasionDate(e.target.value)}
                          className="mt-1 h-11 w-full rounded-xl border border-kay-border bg-kay-input-bg px-3 text-[14px] text-kay-fg"
                        />
                      </label>
                      {recipientEmail.trim() && (
                        <fieldset className="space-y-2">
                          <legend className="text-[13px] text-kay-muted">
                            When should they hear about it?
                          </legend>
                          <label className="flex items-center gap-2 text-[13px] text-kay-fg">
                            <input
                              type="radio"
                              name="recipientEmailOn"
                              checked={recipientEmailOn === "now"}
                              onChange={() => setRecipientEmailOn("now")}
                            />
                            Tell them now
                          </label>
                          <label className="flex items-center gap-2 text-[13px] text-kay-fg">
                            <input
                              type="radio"
                              name="recipientEmailOn"
                              checked={recipientEmailOn === "date"}
                              onChange={() => setRecipientEmailOn("date")}
                            />
                            Email them on that date
                          </label>
                        </fieldset>
                      )}
                      {occasionDate && <OccasionArrivalNote date={occasionDate} quote={selectedShipping} />}
                    </>
                  )}
                </div>
              )}
            </div>
          </CheckoutStep>

          <CheckoutStep step={2} title="Delivery service">
            <div className="space-y-4">
              <p className="text-[13px] leading-relaxed text-kay-muted">
                Choose how your order leaves the Kay hub after quality checks.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {manualEnabled && (
                  <button
                    type="button"
                    disabled={quoting}
                    onClick={() => getDeliveryRates("manual")}
                    className={`rounded-xl border p-4 text-left transition-all disabled:opacity-60 ${
                      shippingQuotes.some((q) => q.kind === "manual") &&
                      selectedShippingToken &&
                      shippingQuotes.find((q) => q.token === selectedShippingToken)
                        ?.kind === "manual"
                        ? "border-kay-gold bg-kay-gold-light/30"
                        : "border-kay-border hover:border-kay-gold/50"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-kay-gold">
                      Kay delivery
                    </p>
                    <p className="mt-1 text-[14px] font-medium text-kay-fg">
                      Manual / Kay-arranged
                    </p>
                    <p className="mt-1 text-[12px] text-kay-muted">
                      Kay handles the last mile — no live courier quote needed.
                    </p>
                  </button>
                )}
                {terminalEnabled && (
                  <button
                    type="button"
                    disabled={quoting}
                    onClick={() => getDeliveryRates("terminal")}
                    className={`rounded-xl border p-4 text-left transition-all disabled:opacity-60 ${
                      shippingQuotes.some((q) => q.kind === "terminal") &&
                      selectedShippingToken &&
                      shippingQuotes.find((q) => q.token === selectedShippingToken)
                        ?.kind === "terminal"
                        ? "border-kay-gold bg-kay-gold-light/30"
                        : "border-kay-border hover:border-kay-gold/50"
                    }`}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-500">
                      Terminal Africa
                    </p>
                    <p className="mt-1 text-[14px] font-medium text-kay-fg">
                      Live carrier rates
                    </p>
                    <p className="mt-1 text-[12px] text-kay-muted">
                      Compare courier prices to your address (GIG, DHL, etc.).
                    </p>
                  </button>
                )}
              </div>

              {manualEnabled && terminalEnabled && (
                <button
                  type="button"
                  disabled={quoting}
                  onClick={() => getDeliveryRates("all")}
                  className="text-[12px] font-medium text-kay-subtle underline-offset-2 hover:text-kay-fg hover:underline disabled:opacity-50"
                >
                  Compare Kay delivery and carrier rates
                </button>
              )}

              {quoting && (
                <div className="flex items-center gap-3 rounded-xl border border-kay-border-light bg-kay-surface/60 px-4 py-3">
                  <span
                    className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-kay-gold border-t-transparent"
                    aria-hidden
                  />
                  <div>
                    <p className="text-[13px] font-medium text-kay-fg">
                      {quotingMode === "manual"
                        ? "Loading Kay delivery…"
                        : quotingMode === "terminal"
                          ? "Finding live carrier rates…"
                          : "Loading delivery options…"}
                    </p>
                    <p className="text-[11px] text-kay-muted">
                      This can take a few seconds.
                    </p>
                  </div>
                </div>
              )}

              {!manualEnabled && !terminalEnabled && (
                <p className="text-[13px] text-amber-600">
                  Delivery options are temporarily unavailable. Please contact Kay.
                </p>
              )}

              {!quoting && shippingQuotes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-kay-subtle">
                    Select a rate
                  </p>
                  {shippingQuotes.map((quote) => {
                    const isManual = quote.kind === "manual";
                    return (
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
                            <span className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                  isManual
                                    ? "bg-kay-gold-light/60 text-kay-fg"
                                    : "bg-sky-500/15 text-sky-600"
                                }`}
                              >
                                {isManual ? "Kay" : "Carrier"}
                              </span>
                              <span className="text-[13px] font-medium text-kay-fg">
                                {quote.carrierName}
                                {quote.serviceName ? ` · ${quote.serviceName}` : ""}
                              </span>
                            </span>
                            {(quote.deliveryEta || quote.hubName) && (
                              <span className="mt-0.5 block text-[11px] text-kay-muted">
                                {[
                                  quote.hubName
                                    ? isManual
                                      ? null
                                      : `From ${quote.hubName}`
                                    : null,
                                  quote.deliveryEta,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="shrink-0 text-[13px] font-semibold text-kay-fg">
                          {quote.amount === 0
                            ? "Complimentary"
                            : formatNaira(quote.amount)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </CheckoutStep>

          <CheckoutStep step={3} title="Payment">
            {paystackEnabled ? (
              <div className="rounded-xl border border-kay-border bg-kay-surface/50 p-4 sm:p-5">
                <p className="text-[15px] font-semibold text-kay-fg">
                  Pay with Paystack
                </p>
                <p className="mt-1 text-[13px] text-kay-muted">
                  Tap <span className="font-medium text-kay-fg">Pay with Paystack</span>{" "}
                  below — we create your order, then open Paystack so you can pay{" "}
                  {formatNaira(pricing.grandTotal)} by card, transfer, or USSD.
                </p>
                {process.env.NEXT_PUBLIC_KAY_TEST_CHECKOUT === "1" && (
                  <p className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-700">
                    Test checkout mode is on — MOV and fees are waived so totals stay
                    near product price. Turn off{" "}
                    <code className="text-[11px]">NEXT_PUBLIC_KAY_TEST_CHECKOUT</code>{" "}
                    when you&apos;re done.
                  </p>
                )}
                {splitAvailable && (
                  <div className="mt-4 border-t border-kay-border-light pt-4">
                    <Toggle
                      bare
                      id="split-cost"
                      label="Split the cost with friends"
                      description={`We'll create a payment link for each person. Everyone has ${SPLIT_WINDOW_HOURS} hours to pay — the gift ships once all shares are in.`}
                      checked={splitOn}
                      onChange={setSplitOn}
                    />
                    {splitActive && (
                      <div className="mt-4 rounded-lg bg-kay-bg/60 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-[13px] text-kay-fg">
                            People (including you)
                          </span>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              aria-label="Fewer people"
                              disabled={splitPeople <= SPLIT_MIN_PEOPLE}
                              onClick={() => setSplitCount(splitPeople - 1)}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-kay-border text-[18px] text-kay-fg transition hover:border-kay-fg disabled:opacity-40"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-[18px] font-semibold tabular-nums text-kay-fg">
                              {splitPeople}
                            </span>
                            <button
                              type="button"
                              aria-label="More people"
                              disabled={splitPeople >= splitMax}
                              onClick={() => setSplitCount(splitPeople + 1)}
                              className="flex h-9 w-9 items-center justify-center rounded-full border border-kay-border text-[18px] text-kay-fg transition hover:border-kay-fg disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className="mt-3 text-[13px] text-kay-muted">
                          {splitPreview.every((a) => a === splitPreview[0]) ? (
                            <>
                              Each person pays{" "}
                              <span className="font-semibold text-kay-fg">
                                {formatNaira(splitPreview[0])}
                              </span>
                              .
                            </>
                          ) : (
                            <>
                              {splitPeople - 1} people pay{" "}
                              <span className="font-semibold text-kay-fg">
                                {formatNaira(splitPreview[0])}
                              </span>
                              , one pays{" "}
                              <span className="font-semibold text-kay-fg">
                                {formatNaira(splitPreview[splitPreview.length - 1])}
                              </span>
                              .
                            </>
                          )}{" "}
                          Your items are held while everyone pays.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <ManualPaymentConfirm
                confirmed={paidConfirmed}
                onChange={setPaidConfirmed}
                amountLabel={formatNaira(pricing.grandTotal)}
              />
            )}
          </CheckoutStep>

          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-[13px] text-red-500">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              disabled={
                submitting ||
                !pricing.canCheckout ||
                (!paystackEnabled && !paidConfirmed)
              }
              className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-kay-gold text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(184,154,106,0.4)] transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting
                ? splitActive
                  ? "Creating share links…"
                  : paystackEnabled
                    ? "Opening checkout…"
                    : "Placing order…"
                : pricing.canCheckout
                  ? splitActive
                    ? `Split between ${splitPeople} people`
                    : isPrivateCheckout
                    ? paystackEnabled
                      ? "Pay privately with Paystack"
                      : "Place private order"
                    : paystackEnabled
                      ? "Pay with Paystack"
                      : "Place order"
                  : "Minimum order not met"}
              {!submitting &&
                pricing.canCheckout &&
                (paystackEnabled || paidConfirmed) && (
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

function OccasionArrivalNote({
  date,
  quote,
}: {
  date: string;
  quote?: { deliveryEta?: string; deliveryDate?: string };
}) {
  const earliest = earliestArrivalDate(quote);
  if (!earliest) {
    return (
      <p className="text-[12px] leading-relaxed text-kay-muted">
        Choose a delivery service to see if this can arrive by {formatOccasionDate(date)}.
      </p>
    );
  }
  const tooSoon = date < earliest;
  return (
    <p className={`text-[12px] leading-relaxed ${tooSoon ? "text-red-600" : "text-kay-muted"}`}>
      Earliest we can get this there is {formatOccasionDate(earliest)}.
      {tooSoon
        ? ` That is after ${formatOccasionDate(date)}, so it may not arrive in time. You can still place the order.`
        : ` That is in time for ${formatOccasionDate(date)}.`}
    </p>
  );
}
