"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/providers/CartProvider";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { CheckoutStep } from "@/components/checkout/CheckoutStep";
import { PaymentMethodSelect } from "@/components/checkout/PaymentMethodSelect";
import { IconArrowRight, IconGift, IconPackage } from "@/components/ui/Icons";
import type { DeliveryType } from "@/types/order";
import { GIFT_NOTE_MAX_LENGTH } from "@/types/order";
import {
  calculateOrderPricing,
  toPricingPayload,
} from "@/lib/pricing/calculate";
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
  const pricing = useMemo(() => calculateOrderPricing(items), [items]);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("self");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card");
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
  const [addressUnknown, setAddressUnknown] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState(emptyAddress);

  const fullName = `${firstName} ${lastName}`.trim();

  useCheckoutPrefill({ setFirstName, setLastName, setBuyer });

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
        !addressUnknown &&
        (!recipientAddress.line1 ||
          !recipientAddress.city ||
          !recipientAddress.state)
      ) {
        setError("Please complete the recipient's delivery address.");
        return;
      }
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
          buyer: { fullName, email: buyer.email, phone: buyer.phone },
          buyerAddress: deliveryType === "self" ? buyerAddress : undefined,
          gift:
            deliveryType === "gift"
              ? {
                  recipientName,
                  recipientEmail: recipientEmail.trim(),
                  recipientPhone: recipientWhatsApp || undefined,
                  recipientWhatsApp: recipientWhatsApp || undefined,
                  note: giftNote,
                  anonymous,
                  addressUnknown,
                  recipientAddress: addressUnknown
                    ? undefined
                    : recipientAddress,
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

      const payRes = await fetch("/api/payments/flutterwave/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "order", id: order.id, email: buyer.email }),
      });
      const payData = await payRes.json();
      if (payRes.ok && payData.link) {
        window.location.href = payData.link;
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

                  <div className="sm:col-span-2">
                    <Toggle
                      label="I don't know their address"
                      description={
                        isPrivateCheckout
                          ? "We'll email a secure, product-free link for their address."
                          : "We'll email them a secure Kay link to share delivery details."
                      }
                      checked={addressUnknown}
                      onChange={setAddressUnknown}
                    />
                  </div>

                  {!addressUnknown && (
                    <>
                      <Input
                        variant="checkout"
                        label={
                      isPrivateCheckout
                        ? "Discrete delivery address"
                        : "Shipping Address"
                    }
                        value={recipientAddress.line1}
                        onChange={(e) =>
                          setRecipientAddress({
                            ...recipientAddress,
                            line1: e.target.value,
                          })
                        }
                        className="sm:col-span-2"
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
                    </>
                  )}

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
                </>
              )}
            </div>
          </CheckoutStep>

          <CheckoutStep step={2} title="Payment Method">
            <PaymentMethodSelect
              value={paymentMethod}
              onChange={setPaymentMethod}
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
              disabled={submitting || !pricing.canCheckout}
              className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-kay-gold text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(184,154,106,0.4)] transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting
                ? "Processing…"
                : pricing.canCheckout
                  ? isPrivateCheckout
                    ? "Complete private order"
                    : "Complete Purchase"
                  : "Minimum order not met"}
              {!submitting && pricing.canCheckout && (
                <IconArrowRight className="h-4 w-4" />
              )}
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-kay-subtle">
              By clicking Complete Purchase, you agree to Kay Stores&apos;{" "}
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
          <OrderSummary items={items} isPrivateCheckout={isPrivateCheckout} />
        </div>
      </div>
    </form>
  );
}
