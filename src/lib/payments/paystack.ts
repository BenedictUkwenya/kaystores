import { createHmac, timingSafeEqual } from "crypto";
import { getSiteUrl } from "@/lib/site";
import {
  buildTxRef,
  getPaystackPublicKey,
  getPaystackSecretKey,
  type PaymentKind,
} from "@/lib/payments/config";

const PAYSTACK_API = "https://api.paystack.co";

type PaystackInitInput = {
  kind: PaymentKind;
  id: string;
  amount: number;
  currency?: string;
  email: string;
  name: string;
  phone?: string;
  title: string;
  description: string;
  redirectPath: string;
};

type PaystackInitResponse = {
  link: string;
  txRef: string;
  publicKey: string;
};

type PaystackApiResponse<T> = {
  status: boolean;
  message: string;
  data: T;
};

async function paystackFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getPaystackSecretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json()) as PaystackApiResponse<T>;
  if (!res.ok || !body.status) {
    throw new Error(body.message || "Paystack request failed.");
  }

  return body.data;
}

/** Kay stores amounts in Naira integers; Paystack expects kobo. */
export function nairaToKobo(amountNaira: number): number {
  return Math.round(amountNaira * 100);
}

export function koboToNaira(amountKobo: number): number {
  return Math.round(amountKobo) / 100;
}

export async function initializePaystackPayment(
  input: PaystackInitInput,
): Promise<PaystackInitResponse> {
  const txRef = buildTxRef(input.kind, input.id);
  const callbackUrl = `${getSiteUrl()}${input.redirectPath}`;

  const data = await paystackFetch<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: nairaToKobo(input.amount),
      currency: input.currency ?? "NGN",
      reference: txRef,
      callback_url: callbackUrl,
      metadata: {
        kind: input.kind,
        id: input.id,
        custom_fields: [
          {
            display_name: "Customer",
            variable_name: "customer_name",
            value: input.name,
          },
          {
            display_name: "Phone",
            variable_name: "phone",
            value: input.phone ?? "",
          },
          {
            display_name: "Description",
            variable_name: "description",
            value: input.description,
          },
        ],
      },
    }),
  });

  return {
    link: data.authorization_url,
    txRef: data.reference || txRef,
    publicKey: getPaystackPublicKey(),
  };
}

export type PaystackVerifyData = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string;
  id?: number;
  gateway_response?: string;
  metadata?: {
    kind?: string;
    id?: string;
  };
};

export async function verifyPaystackByReference(
  reference: string,
): Promise<PaystackVerifyData | null> {
  try {
    return await paystackFetch<PaystackVerifyData>(
      `/transaction/verify/${encodeURIComponent(reference)}`,
    );
  } catch {
    return null;
  }
}

export function isPaystackChargeSuccessful(data: PaystackVerifyData): boolean {
  return data.status === "success";
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  try {
    const hash = createHmac("sha512", getPaystackSecretKey())
      .update(rawBody)
      .digest("hex");
    const a = Buffer.from(hash);
    const b = Buffer.from(signature);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type PaystackWebhookPayload = {
  event?: string;
  data?: {
    status?: string;
    reference?: string;
    amount?: number;
    id?: number;
  };
};

export function extractPaystackWebhookTx(payload: PaystackWebhookPayload): {
  txRef: string;
  reference: string;
  successful: boolean;
} | null {
  const data = payload.data;
  if (!data?.reference) return null;

  const successful =
    payload.event === "charge.success" && data.status === "success";

  return {
    txRef: data.reference,
    reference: String(data.id ?? data.reference),
    successful,
  };
}
