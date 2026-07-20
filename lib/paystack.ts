import crypto from "crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";

type InitializeParams = {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
};

type InitializeResponse = {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

/**
 * Starts a Paystack transaction (server-to-server). Returns a hosted
 * checkout URL we redirect the browser to. Requires PAYSTACK_SECRET_KEY.
 */
export async function initializePaystackTransaction(
  params: InitializeParams
): Promise<InitializeResponse> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo, // Paystack expects the smallest currency unit
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata ?? {},
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paystack initialize failed (${res.status}): ${body}`);
  }

  return res.json();
}

type VerifyResponse = {
  status: boolean;
  message: string;
  data: {
    status: "success" | "failed" | "abandoned";
    reference: string;
    amount: number;
    customer: { email: string };
  };
};

/**
 * Confirms a transaction's true status directly with Paystack. Used as a
 * fallback on the success page in case the webhook hasn't landed yet.
 */
export async function verifyPaystackTransaction(
  reference: string
): Promise<VerifyResponse> {
  const res = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Paystack verify failed (${res.status}): ${body}`);
  }

  return res.json();
}

/**
 * Validates that a webhook request genuinely came from Paystack by
 * recomputing the HMAC SHA512 signature with our secret key and comparing
 * it (constant-time) against the `x-paystack-signature` header.
 */
export function isValidPaystackSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  if (!signatureHeader) return false;

  const hash = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(signatureHeader)
    );
  } catch {
    // Length mismatch etc. — definitely not valid
    return false;
  }
}

/**
 * Generates a reasonably unique, Paystack-safe reference string.
 * Prefixed so refs are recognizable in the Paystack dashboard.
 */
export function generateReference(prefix: "TIX" | "MER"): string {
  const random = crypto.randomBytes(8).toString("hex");
  return `NR1-${prefix}-${Date.now()}-${random}`;
}

/**
 * Short, unique, gate-friendly code for an individual ticket pass.
 * Encoded into the QR shown on the success page and typed manually as
 * a fallback if a phone camera won't cooperate at the door.
 */
export function generatePassCode(): string {
  return crypto.randomBytes(5).toString("hex").toUpperCase(); // e.g. "A1B2C3D4E5"
}
