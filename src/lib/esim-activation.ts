/**
 * Turn imported eSIM activation payload into a navigable URL.
 *
 * Imported `qr_code_data` is usually a raw LPA string (`LPA:1$smdp$CODE`).
 * Safari rejects that as an address — on Apple devices wrap it in Apple's
 * eSIM provisioning URL. Existing http(s) links are used as-is.
 */
export function buildEsimActivationHref(qrCodeData: string): string {
  const value = qrCodeData.trim();
  if (!value) return value;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const lpa = normalizeLpaPayload(value);
  if (!lpa) {
    return value;
  }

  if (isAppleDevice()) {
    return `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpa)}`;
  }

  // Android / other: try the LPA URI directly (device may handle the scheme).
  return lpa;
}

/** Accept raw LPA or `LPA:1$...` / with whitespace; return canonical LPA string or null. */
export function normalizeLpaPayload(value: string): string | null {
  const trimmed = value.trim();
  if (/^LPA:1\$/i.test(trimmed)) {
    return trimmed;
  }
  // Some imports store without the prefix but still SM-DP style payload
  if (/^[^$\s]+\$.+/.test(trimmed) && !trimmed.includes('://')) {
    return `LPA:1$${trimmed}`;
  }
  return null;
}

export function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  // iPhone / iPad / iPod; iPadOS 13+ may report as Macintosh with touch
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return (
    /Macintosh/i.test(ua) &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1
  );
}
