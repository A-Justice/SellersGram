const PAYSTACK_BASE = "https://api.paystack.co";

export function paystackSecretKey() {
  return process.env.PAYSTACK_SECRET_KEY || "";
}

export function isPaystackConfigured() {
  return Boolean(paystackSecretKey());
}

type InitializeInput = {
  amountGhs: number;
  email: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string | number>;
};

export async function initializePaystackTransaction(input: InitializeInput) {
  const secret = paystackSecretKey();
  if (!secret) throw new Error("Paystack is not configured.");

  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(input.amountGhs * 100),
      email: input.email,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
      currency: "GHS",
      channels: ["card", "bank", "mobile_money", "ussd"],
    }),
  });

  const data = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: {
      authorization_url: string;
      access_code: string;
      reference: string;
    };
  };

  if (!response.ok || !data.status || !data.data?.authorization_url) {
    throw new Error(data.message || "Could not start Paystack payment.");
  }

  return data.data;
}

export type PaystackVerifyData = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string | number>;
};

export async function verifyPaystackTransaction(reference: string) {
  const secret = paystackSecretKey();
  if (!secret) throw new Error("Paystack is not configured.");

  const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
  });

  const data = (await response.json()) as {
    status?: boolean;
    message?: string;
    data?: PaystackVerifyData;
  };

  if (!response.ok || !data.status || !data.data) {
    throw new Error(data.message || "Could not verify Paystack payment.");
  }

  return data.data;
}
