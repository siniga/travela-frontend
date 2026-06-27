/**
 * Payment redirect helpers — real checkout URLs only (no legacy /test-checkout).
 */

const PAYMENT_URL_FIELDS = ["checkout_url", "payment_url", "url"] as const;
const LEGACY_TEST_CHECKOUT = /\/test-checkout(?:\/|\?|$)/i;

export function isLegacyTestCheckoutUrl(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const pathname = /^https?:\/\//i.test(trimmed)
      ? new URL(trimmed).pathname
      : trimmed.split("?")[0] ?? trimmed;
    return LEGACY_TEST_CHECKOUT.test(pathname);
  } catch {
    return LEGACY_TEST_CHECKOUT.test(trimmed);
  }
}

function readUrlFromRecord(record: Record<string, unknown>): string | null {
  for (const key of PAYMENT_URL_FIELDS) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/** Extract a payment URL from common Laravel order response shapes. */
export function extractPaymentUrl(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;

  const root = body as Record<string, unknown>;
  const candidates: Record<string, unknown>[] = [root];

  const data = root.data;
  if (data && typeof data === "object") {
    const summary = data as Record<string, unknown>;
    candidates.push(summary);
    if (summary.order && typeof summary.order === "object") {
      candidates.push(summary.order as Record<string, unknown>);
    }
  }

  if (root.order && typeof root.order === "object") {
    candidates.push(root.order as Record<string, unknown>);
  }

  for (const record of candidates) {
    const payment = record.payment;
    if (payment && typeof payment === "object") {
      const fromPayment = readUrlFromRecord(payment as Record<string, unknown>);
      if (fromPayment) return fromPayment;
    }

    const direct = readUrlFromRecord(record);
    if (direct) return direct;
  }

  return null;
}

/** Accept only absolute http(s) URLs; reject legacy test-checkout paths. */
export function normalizePaymentUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;

  const trimmed = url.trim();
  if (isLegacyTestCheckoutUrl(trimmed)) return null;
  if (!/^https?:\/\//i.test(trimmed)) return null;

  return trimmed;
}

export type PaymentRedirectParams = {
  amount: number;
  currency: string;
  email: string;
  country: string;
  countryName: string;
  simType: string;
  orderId?: string | number;
  draftId?: string;
};

export function buildPaymentRedirectUrl(
  redirectBase: string,
  params: PaymentRedirectParams
): string {
  const base = redirectBase.trim();
  if (!base) {
    throw new Error(
      "Payment is not configured. Set NEXT_PUBLIC_PAYMENT_REDIRECT_URL or use an order API that returns a checkout URL."
    );
  }
  if (isLegacyTestCheckoutUrl(base)) {
    throw new Error(
      "NEXT_PUBLIC_PAYMENT_REDIRECT_URL must not point to the removed /test-checkout route."
    );
  }

  const url = new URL(base);
  url.searchParams.set("amount", params.amount.toFixed(2));
  url.searchParams.set("currency", params.currency);
  url.searchParams.set("email", params.email);
  url.searchParams.set("country", params.country);
  url.searchParams.set("countryName", params.countryName);
  url.searchParams.set("simType", params.simType);
  if (params.orderId != null) url.searchParams.set("order_id", String(params.orderId));
  if (params.draftId) url.searchParams.set("draft_id", params.draftId);
  return url.toString();
}

/** Prefer API checkout URL; fall back to NEXT_PUBLIC_PAYMENT_REDIRECT_URL. */
export function resolvePaymentTargetUrl(
  apiPaymentUrl: string | null | undefined,
  params: PaymentRedirectParams
): string {
  const fromApi = normalizePaymentUrl(apiPaymentUrl);
  if (fromApi) return fromApi;

  const envBase = process.env.NEXT_PUBLIC_PAYMENT_REDIRECT_URL?.trim();
  if (envBase) return buildPaymentRedirectUrl(envBase, params);

  if (apiPaymentUrl?.trim() && isLegacyTestCheckoutUrl(apiPaymentUrl)) {
    throw new Error(
      "The server returned a deprecated test payment URL. Configure a real checkout URL on the API or set NEXT_PUBLIC_PAYMENT_REDIRECT_URL."
    );
  }

  throw new Error(
    "No payment checkout URL available. The order API must return payment.checkout_url or set NEXT_PUBLIC_PAYMENT_REDIRECT_URL."
  );
}
