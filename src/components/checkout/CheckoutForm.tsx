"use client";

import { useState } from "react";
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

const emptyAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "Nigeria",
};

export function CheckoutForm() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("self");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card");
  const [submitting, setSubmitting] = useState(false);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError("Your bag is empty.");
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
      if (!recipientName) {
        setError("Please enter the recipient's name.");
        return;
      }
      if (addressUnknown) {
        if (!recipientEmail && !recipientWhatsApp) {
          setError(
            "Please provide the recipient's email or WhatsApp so we can collect their address.",
          );
          return;
        }
      } else if (
        !recipientAddress.line1 ||
        !recipientAddress.city ||
        !recipientAddress.state
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
          subtotal,
          buyer: { fullName, email: buyer.email, phone: buyer.phone },
          buyerAddress: deliveryType === "self" ? buyerAddress : undefined,
          gift:
            deliveryType === "gift"
              ? {
                  recipientName,
                  recipientEmail: recipientEmail || undefined,
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
      clearCart();
      router.push(`/order/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
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
          <CheckoutStep step={1} title="Shipping Information">
            <div className="mb-5 grid gap-2 sm:grid-cols-2">
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
                    Delivering to Myself
                  </p>
                  <p className="text-[11px] text-kay-muted">Ship to your address</p>
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
                    Sending as a Gift
                  </p>
                  <p className="text-[11px] text-kay-muted">Note & anonymous options</p>
                </div>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                variant="checkout"
                label="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                variant="checkout"
                label="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <Input
                variant="checkout"
                label="Email"
                type="email"
                value={buyer.email}
                onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
                required
              />
              <Input
                variant="checkout"
                label="Phone"
                type="tel"
                value={buyer.phone}
                onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
                required
              />

              {deliveryType === "self" ? (
                <>
                  <Input
                    variant="checkout"
                    label="Shipping Address"
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
                  <Input
                    variant="checkout"
                    label="Recipient Name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="sm:col-span-2"
                    required
                  />

                  <div className="sm:col-span-2">
                    <Toggle
                      label="I don't know their address"
                      description="We'll send a secure Kay link so they can share delivery details."
                      checked={addressUnknown}
                      onChange={setAddressUnknown}
                    />
                  </div>

                  {addressUnknown ? (
                    <>
                      <Input
                        variant="checkout"
                        label="Recipient Email"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                      />
                      <Input
                        variant="checkout"
                        label="Recipient WhatsApp"
                        type="tel"
                        value={recipientWhatsApp}
                        onChange={(e) => setRecipientWhatsApp(e.target.value)}
                      />
                    </>
                  ) : (
                    <>
                      <Input
                        variant="checkout"
                        label="Shipping Address"
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
              disabled={submitting}
              className="flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-kay-gold text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(184,154,106,0.4)] transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {submitting ? "Processing…" : "Complete Purchase"}
              {!submitting && <IconArrowRight className="h-4 w-4" />}
            </button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-kay-subtle">
              By clicking Complete Purchase, you agree to Kay Stores&apos;{" "}
              <Link href="#" className="underline hover:text-kay-fg">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline hover:text-kay-fg">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <OrderSummary items={items} subtotal={subtotal} />
        </div>
      </div>
    </form>
  );
}
