/** Mirrors api/app/Support/BundleVisibility.php for client-side filtering. */

export type ApiBundleLike = {
  alias?: string | null;
  name?: string;
  price?: string | number | null;
  price_usd?: string | number | null;
  data_mb?: number | null;
  bundle_size?: string | number | null;
  bundle_size_in_mb?: number | null;
  unit?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type UiBundleLike = {
  name?: string;
  tagline?: string;
  price?: string | number | null;
  data_mb?: number | null;
};

function bundlePrice(bundle: ApiBundleLike | UiBundleLike): number {
  const raw =
    'price_usd' in bundle && bundle.price_usd != null && bundle.price_usd !== ''
      ? bundle.price_usd
      : bundle.price;
  const n = Number(raw ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function resolveDataMb(bundle: ApiBundleLike | UiBundleLike): number {
  if (typeof bundle.data_mb === 'number' && bundle.data_mb > 0) {
    return bundle.data_mb;
  }

  if (!('bundle_size' in bundle)) {
    return 0;
  }

  if (typeof bundle.bundle_size_in_mb === 'number' && bundle.bundle_size_in_mb > 0) {
    return bundle.bundle_size_in_mb;
  }

  const size = Number(bundle.bundle_size);
  if (!Number.isFinite(size) || size <= 0) return 0;

  const unit = (bundle.unit ?? '').toUpperCase();
  if (unit === 'GB') return Math.round(size * 1024);
  if (unit === 'MB') return Math.round(size);
  if (size <= 512) return Math.round(size);
  return 0;
}

export function isAdminOnlyApiBundle(bundle: ApiBundleLike): boolean {
  if (bundle.metadata?.admin_only === true) {
    return true;
  }

  const price = bundlePrice(bundle);
  if (price > 0) {
    return false;
  }

  const alias = (bundle.alias ?? '').trim().toLowerCase();
  const name = (bundle.name ?? '').toLowerCase();
  const dataMb = resolveDataMb(bundle);

  if (alias === 'starter') {
    return true;
  }

  if (name.includes('25mb') && (name.includes('30day') || name.includes('30days'))) {
    return true;
  }

  if (dataMb === 25 && price === 0) {
    return true;
  }

  return false;
}

/** After alias→name mapping in the UI (label "Starter", tagline = catalog name). */
export function isAdminOnlyUiBundle(bundle: UiBundleLike): boolean {
  const price = bundlePrice(bundle);
  if (price > 0) {
    return false;
  }

  const label = (bundle.name ?? '').trim().toLowerCase();
  const tagline = (bundle.tagline ?? '').toLowerCase();
  const dataMb = resolveDataMb(bundle);

  if (label === 'starter') {
    return true;
  }

  if (tagline.includes('25mb') && (tagline.includes('30day') || tagline.includes('30days'))) {
    return true;
  }

  if (dataMb === 25 && price === 0) {
    return true;
  }

  return false;
}

export function filterBundlesForRole<T extends ApiBundleLike>(
  bundles: T[],
  role?: string | null,
): T[] {
  if (role === 'admin') {
    return bundles;
  }
  return bundles.filter((bundle) => !isAdminOnlyApiBundle(bundle));
}

export function filterUiBundlesForRole<T extends UiBundleLike>(
  bundles: T[],
  role?: string | null,
): T[] {
  if (role === 'admin') {
    return bundles;
  }
  return bundles.filter((bundle) => !isAdminOnlyUiBundle(bundle));
}

export function isAdminUser(role?: string | null): boolean {
  return role === 'admin';
}
