import { getSiteUrl } from "@/lib/site";
import {
  buildTxRef,
  getFlutterwavePublicKey,
  getFlutterwaveSecretKey,
  type PaymentKind,
} from "@/lib/payments/config";

const FLW_API = "https://api.flutterwave.com/v3";

type FlutterwaveInitInput = {
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

type FlutterwaveInitResponse = {
  link: string;
  txRef: string;
  publicKey: string;
};

type FlutterwaveApiResponse<T> = {
  status: string;
  message: string;
  data: T;
};

async function flutterwaveFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${FLW_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getFlutterwaveSecretKey()}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json()) as FlutterwaveApiResponse<T>;
  if (!res.ok || body.status !== "success") {
    throw new Error(body.message || "Flutterwave request failed.");
  }

  return body.data;
}

export async function initializeFlutterwavePayment(
  input: FlutterwaveInitInput,
): Promise<FlutterwaveInitResponse> {
  const txRef = buildTxRef(input.kind, input.id);
  const redirectUrl = `${getSiteUrl()}${input.redirectPath}`;

  const data = await flutterwaveFetch<{ link: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: txRef,
      amount: input.amount,
      currency: input.currency ?? "NGN",
      redirect_url: redirectUrl,
      customer: {
        email: input.email,
        name: input.name,
        phonenumber: input.phone ?? "",
      },
      customizations: {
        title: input.title,
        description: input.description,
        logo: `${getSiteUrl()}/brand/email-logo.png`,
      },
    }),
  });

  return {
    link: data.link,
    txRef,
    publicKey: getFlutterwavePublicKey(),
  };
}

export type FlutterwaveVerifyData = {
  status: string;
  tx_ref: string;
  flw_ref?: string;
  id?: number;
  amount?: number;
  currency?: string;
};

export async function verifyFlutterwaveByTxRef(
  txRef: string,
): Promise<FlutterwaveVerifyData | null> {
  try {
    const data = await flutterwaveFetch<FlutterwaveVerifyData>(
      `/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
    );
    return data;
  } catch {
    return null;
  }
}

export function isFlutterwaveChargeSuccessful(data: FlutterwaveVerifyData): boolean {
  return data.status === "successful";
}

export function verifyFlutterwaveWebhookSignature(
  signature: string | null,
  secret?: string,
): boolean {
  if (!secret) return false;
  if (!signature) return false;
  return signature === secret;
}

export type FlutterwaveWebhookPayload = {
  event?: string;
  data?: {
    status?: string;
    tx_ref?: string;
    flw_ref?: string;
    id?: number;
    amount?: number;
  };
};

export function extractWebhookTx(payload: FlutterwaveWebhookPayload): {
  txRef: string;
  reference: string;
  successful: boolean;
} | null {
  const data = payload.data;
  if (!data?.tx_ref) return null;

  const successful =
    payload.event === "charge.completed" && data.status === "successful";

  return {
    txRef: data.tx_ref,
    reference: data.flw_ref ?? String(data.id ?? data.tx_ref),
    successful,
  };
}
