/**
 * LPA / eSIM activation helpers used by ActivateEsimButton.
 */

const PENDING_INSTALL_KEY = 'travela:esim-install-pending';
const PENDING_INSTALL_MAX_AGE_MS = 48 * 60 * 60 * 1000;

export type PendingEsimInstall = {
  userEsimId: number;
  startedAt: string;
};

export function normalizeLpaPayload(qrCodeData: string): string {
  const trimmed = qrCodeData.trim();
  if (!trimmed) return '';
  if (/^LPA:1\$/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Some imports store SM-DP payload without the LPA prefix
  if (/^[^$\s]+\$.+/.test(trimmed) && !trimmed.includes('://')) {
    return `LPA:1$${trimmed}`;
  }
  return `LPA:1$${trimmed}`;
}

export function isAppleDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return (
    /Macintosh/i.test(ua) &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1
  );
}

/**
 * Build a navigable install URL for the current device.
 * - Apple: universal link (Safari rejects raw LPA: URIs)
 * - Android / other: raw LPA scheme (or https if already a link)
 */
export function buildEsimActivationHref(qrCodeData: string): string {
  const value = qrCodeData.trim();
  if (!value) return value;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const lpa = normalizeLpaPayload(value);
  if (!lpa) return value;

  if (isAppleDevice()) {
    return `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpa)}`;
  }

  return lpa;
}

export function buildEsimQrPageHref(userEsimId: number): string {
  return `/dashboard/esim/${userEsimId}/qr`;
}

export function readPendingEsimInstall(): PendingEsimInstall | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PENDING_INSTALL_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as PendingEsimInstall;
    if (
      typeof parsed?.userEsimId !== 'number' ||
      typeof parsed?.startedAt !== 'string'
    ) {
      localStorage.removeItem(PENDING_INSTALL_KEY);
      return null;
    }
    const started = Date.parse(parsed.startedAt);
    if (!Number.isFinite(started) || Date.now() - started > PENDING_INSTALL_MAX_AGE_MS) {
      localStorage.removeItem(PENDING_INSTALL_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(PENDING_INSTALL_KEY);
    return null;
  }
}

export function writePendingEsimInstall(userEsimId: number): void {
  if (typeof window === 'undefined') return;
  const payload: PendingEsimInstall = {
    userEsimId,
    startedAt: new Date().toISOString(),
  };
  localStorage.setItem(PENDING_INSTALL_KEY, JSON.stringify(payload));
}

export function clearPendingEsimInstall(userEsimId?: number): void {
  if (typeof window === 'undefined') return;
  if (userEsimId == null) {
    localStorage.removeItem(PENDING_INSTALL_KEY);
    return;
  }
  const pending = readPendingEsimInstall();
  if (!pending || pending.userEsimId === userEsimId) {
    localStorage.removeItem(PENDING_INSTALL_KEY);
  }
}

export function hasPendingEsimInstall(userEsimId: number): boolean {
  const pending = readPendingEsimInstall();
  return pending?.userEsimId === userEsimId;
}
