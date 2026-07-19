/**
 * LPA / eSIM activation helpers used by ActivateEsimButton (do not change button behavior).
 */

export function normalizeLpaPayload(qrCodeData: string): string {
  const trimmed = qrCodeData.trim();
  if (!trimmed) return '';
  if (/^LPA:1\$/i.test(trimmed)) return trimmed;
  return `LPA:1$${trimmed}`;
}

/** Apple universal link — opens eSIM provisioning on supported iOS devices. */
export function buildEsimActivationHref(qrCodeData: string): string {
  const lpa = normalizeLpaPayload(qrCodeData);
  return `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpa)}`;
}

export function buildEsimQrPageHref(userEsimId: number): string {
  return `/dashboard/esim/${userEsimId}/qr`;
}
