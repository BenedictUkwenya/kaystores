export type PaymentKind = "order" | "concierge";

export function isPaystackConfigured(): boolean {
  return Boolean(
    process.env.PAYSTACK_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim(),
  );
}

export function getPaystackSecretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  if (!key) throw new Error("Paystack is not configured.");
  return key;
}

export function getPaystackPublicKey(): string {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() ?? "";
}

export function isFlutterwaveConfigured(): boolean {
  return Boolean(
    process.env.FLUTTERWAVE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY?.trim(),
  );
}

export function getFlutterwaveSecretKey(): string {
  const key = process.env.FLUTTERWAVE_SECRET_KEY?.trim();
  if (!key) throw new Error("Flutterwave is not configured.");
  return key;
}

export function getFlutterwavePublicKey(): string {
  return process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY?.trim() ?? "";
}

export function getFlutterwaveWebhookSecret(): string | undefined {
  return process.env.FLUTTERWAVE_WEBHOOK_SECRET?.trim() || undefined;
}

/**
 * Paystack references allow only alphanumeric plus `-`, `.`, `=`.
 * Use underscore so both Paystack and legacy Flutterwave `kind:id` parse.
 */
export function buildTxRef(kind: PaymentKind, id: string): string {
  return `${kind}_${id}`;
}

export function parseTxRef(
  txRef: string,
): { kind: PaymentKind; id: string } | null {
  const match = /^(order|concierge)[_:]([0-9a-f-]{36})$/i.exec(txRef.trim());
  if (!match) return null;
  return { kind: match[1] as PaymentKind, id: match[2] };
}
