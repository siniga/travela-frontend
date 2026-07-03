'use client';

import {
  apiErrorMessage,
  BundlesApi,
  EsimsApi,
  OrderApi,
  type EsimAssignmentPayload,
  type EsimAssignmentStatus,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  CheckCircle,
  Clock,
  Globe,
  Info,
  Loader2,
  MapPin,
  Package,
  Smartphone,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

interface PurchaseData {
  items?: {
    bundle: {
      name: string;
      data_mb?: number;
      validity_days?: number;
      price?: string | number;
      currency?: string;
    };
    quantity: number;
  }[];
  trip?: {
    countryName?: string;
    duration?: number;
    arrivalDate?: string;
    departureDate?: string;
  };
  total?: number;
  currency?: string;
  orderId?: string | number;
  draftId?: string;
  simType?: string;
  date?: string;
}

interface PendingPaymentData {
  order_id?: string | number;
  draft_id?: string;
  simType?: string;
  items?: PurchaseData['items'];
  trip?: PurchaseData['trip'];
  total?: number;
  currency?: string;
  email?: string;
}

interface OrderItemRecord {
  id: number;
  bundle_name: string;
  data_amount: number | null;
  validity_days: number;
  price: string;
  currency: string;
}

interface OrderRecord {
  id: number;
  draft_id: string;
  payment_reference: string | null;
  status: string;
  payment_status: string;
  total_amount: string;
  currency: string;
  paid_at: string | null;
  created_at: string;
  metadata?: {
    countryName?: string;
    simType?: string;
    country?: string;
  } | null;
  trip?: {
    destination_country?: string;
    arrival_date?: string;
    departure_date?: string;
    duration_days?: number;
  } | null;
  order_items?: OrderItemRecord[];
}

interface PhysicalPickupDetails {
  draftId?: string;
  orderId?: string | number;
  countryName?: string;
  arrivalDate?: string | null;
  departureDate?: string | null;
  items: {
    name: string;
    dataLabel: string;
    validityDays?: number;
    price?: string;
    currency?: string;
  }[];
  total?: string;
  currency?: string;
  paymentReference?: string | null;
  status?: string;
}

interface EsimDetail {
  id: number;
  sim_id?: number | null;
  msisdn?: string | null;
  iccid?: string | null;
  description?: string | null;
  status?: string | null;
  sim_type?: string | null;
  provider_status?: string | null;
}

interface BundleDetail {
  id?: number;
  name?: string | null;
  alias?: string | null;
  data_mb?: number | null;
  validity_days?: number | null;
  duration_days?: number | null;
  duration?: string | null;
}

interface EsimsListResponse {
  esims: UserEsimRecord[];
  latestOrderBundle: BundleDetail | null;
}

interface OrderItemDetail {
  id?: number;
  data_amount?: number | null;
  bundle_name?: string | null;
  validity_days?: number | null;
}

interface OrderDetail {
  metadata?: {
    country?: string;
    countryName?: string;
    simType?: string;
  };
}

interface TopUpBundle {
  id: string | number;
  sim_bundle_id?: number | null;
  name: string;
  data_mb?: number;
  validity_days?: number;
  price?: string | number;
  currency?: string;
  description?: string;
  tagline?: string;
}

type ApiBundle = {
  id: number;
  sim_bundle_id?: number | null;
  name: string;
  alias?: string | null;
  validity_days?: number | null;
  price?: string | number | null;
  currency?: string | null;
  data_mb?: number | null;
  bundle_size?: string | number | null;
  bundle_size_in_mb?: number | null;
  unit?: string | null;
};

type BundlesResponse = { bundles: ApiBundle[] };

interface UserEsimRecord {
  id: number;
  esim_id: number;
  balance?: string | null;
  balance_currency?: string | null;
  balance_fetched_at?: string | null;
  created_at?: string | null;
  esim?: EsimDetail | null;
  bundle?: BundleDetail | null;
  order_item?: OrderItemDetail | null;
  order?: OrderDetail | null;
}

const DEFAULT_RETRY_SECONDS = 300;
const TOPUP_MODAL_TRANSITION_MS = 320;
const CHECKOUT_TRANSITION_KEY = 'travela:checkout-transition';

type WatcherSignal = {
  cancelled: boolean;
  timeoutId?: number;
};

function sleep(ms: number, signal: WatcherSignal) {
  return new Promise<void>((resolve) => {
    if (signal.cancelled) {
      resolve();
      return;
    }
    signal.timeoutId = window.setTimeout(() => resolve(), ms);
  });
}

function coerceNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeBundle(raw: unknown): BundleDetail | null {
  if (!raw || typeof raw !== 'object') return null;
  const b = raw as Record<string, unknown>;
  const data_mb = coerceNumber(b.data_mb);
  const validity_days = coerceNumber(b.validity_days) ?? coerceNumber(b.duration_days);
  return {
    id: coerceNumber(b.id),
    name: typeof b.name === 'string' ? b.name : null,
    alias: typeof b.alias === 'string' ? b.alias : null,
    data_mb: data_mb ?? null,
    validity_days: validity_days ?? null,
    duration_days: coerceNumber(b.duration_days) ?? null,
    duration: typeof b.duration === 'string' ? b.duration : null,
  };
}

function formatMb(mb?: number | null) {
  if (mb == null || mb <= 0) return '—';
  return `${mb.toLocaleString()} MB`;
}

function bundleToMb(bundle: ApiBundle): number | undefined {
  const direct = coerceNumber(bundle.data_mb);
  if (direct != null && direct > 0) return direct;

  const sizeInMb = coerceNumber(bundle.bundle_size_in_mb);
  if (sizeInMb != null && sizeInMb > 0) return sizeInMb;

  const size = coerceNumber(bundle.bundle_size);
  if (size == null) return undefined;

  const unit = (bundle.unit ?? '').toUpperCase();
  if (unit === 'GB') return Math.round(size * 1024);
  if (unit === 'MB') return Math.round(size);
  return undefined;
}

function resolveBundleDataMb(
  userBundle?: BundleDetail | null,
  latestOrderBundle?: BundleDetail | null,
  assignedBundle?: EsimAssignmentPayload['bundle'],
  purchaseBundle?: { data_mb?: number },
  orderItemDataAmount?: number | null
): number | undefined {
  const fromUser = coerceNumber(userBundle?.data_mb);
  if (fromUser != null && fromUser > 0) return fromUser;

  const fromLatestOrder = coerceNumber(latestOrderBundle?.data_mb);
  if (fromLatestOrder != null && fromLatestOrder > 0) return fromLatestOrder;

  const fromAssigned = coerceNumber(assignedBundle?.data_mb);
  if (fromAssigned != null && fromAssigned > 0) return fromAssigned;

  const fromPurchase = coerceNumber(purchaseBundle?.data_mb);
  if (fromPurchase != null && fromPurchase > 0) return fromPurchase;

  const fromOrderItem = coerceNumber(orderItemDataAmount);
  if (fromOrderItem != null && fromOrderItem > 0) return fromOrderItem;

  return undefined;
}

/** Balance area shows bundle data allowance (data_mb) first. */
function displayDataBalance(bundleDataMb?: number) {
  if (bundleDataMb != null && bundleDataMb > 0) return formatMb(bundleDataMb);
  return '—';
}

function formatTripDate(iso?: string | null) {
  if (!iso) return null;
  const datePart = iso.includes('T') ? iso.split('T')[0] : iso;
  return new Date(datePart + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function parseEsimsFromBody(body: unknown): EsimsListResponse {
  if (!body || typeof body !== 'object') {
    return { esims: [], latestOrderBundle: null };
  }

  const b = body as { data?: unknown; latest_order?: unknown };
  const esims: UserEsimRecord[] = Array.isArray(b.data)
    ? b.data
        .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
        .map((record) => ({
          ...(record as unknown as UserEsimRecord),
          bundle: normalizeBundle(record.bundle),
        }))
    : [];

  let latestOrderBundle: BundleDetail | null = null;
  if (b.latest_order && typeof b.latest_order === 'object') {
    const latestOrder = b.latest_order as Record<string, unknown>;
    latestOrderBundle = normalizeBundle(latestOrder.bundle);
  }

  return { esims, latestOrderBundle };
}

function parseAssignmentStatus(body: unknown): EsimAssignmentStatus {
  if (!body || typeof body !== 'object') {
    return { has_sim: false };
  }

  const root = body as Record<string, unknown>;
  const source =
    root.has_sim != null || root.status != null
      ? root
      : root.data && typeof root.data === 'object'
        ? (root.data as Record<string, unknown>)
        : root;

  const has_sim = source.has_sim === true;
  const status = typeof source.status === 'string' ? source.status : undefined;
  const retry_after_seconds =
    typeof source.retry_after_seconds === 'number'
      ? source.retry_after_seconds
      : undefined;

  let inventory: EsimAssignmentStatus['inventory'];
  if (source.inventory && typeof source.inventory === 'object') {
    const inv = source.inventory as Record<string, unknown>;
    inventory = {
      available: typeof inv.available === 'number' ? inv.available : undefined,
    };
  }

  let data: EsimAssignmentPayload | undefined;
  if (source.data && typeof source.data === 'object') {
    const d = source.data as Record<string, unknown>;
    const esim =
      d.esim && typeof d.esim === 'object' ? (d.esim as EsimAssignmentPayload['esim']) : undefined;
    const bundle =
      d.bundle && typeof d.bundle === 'object'
        ? (d.bundle as EsimAssignmentPayload['bundle'])
        : undefined;
    if (esim || bundle) data = { esim, bundle };
  }

  return { has_sim, status, retry_after_seconds, inventory, data };
}

function shouldPollAssignment(status: EsimAssignmentStatus): boolean {
  if (status.has_sim) return false;
  return status.status === 'waiting_for_inventory';
}

function readPendingPaymentFromStorage(): PendingPaymentData | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('pendingPayment');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPaymentData;
  } catch {
    return null;
  }
}

function parseOrdersFromBody(body: unknown): OrderRecord[] {
  if (!body || typeof body !== 'object') return [];
  const b = body as { data?: unknown };
  if (!Array.isArray(b.data)) return [];
  return b.data as OrderRecord[];
}

function isPaidOrder(order: OrderRecord): boolean {
  const status = (order.payment_status || order.status || '').toLowerCase();
  return status === 'paid' || status === 'completed';
}

function formatOrderItemData(mb?: number | null) {
  if (mb == null || mb <= 0) return '—';
  return mb >= 1024 ? `${(mb / 1024).toFixed(0)} GB` : `${mb} MB`;
}

function resolvePhysicalPickupDetails(
  orders: OrderRecord[],
  pendingPayment: PendingPaymentData | null,
  purchase: PurchaseData | null
): PhysicalPickupDetails | null {
  const apiOrder = orders
    .filter((o) => o.metadata?.simType === 'physical' && isPaidOrder(o))
    .sort(
      (a, b) =>
        new Date(b.paid_at ?? b.created_at).getTime() -
        new Date(a.paid_at ?? a.created_at).getTime()
    )[0];

  if (apiOrder) {
    const items =
      apiOrder.order_items?.map((item) => ({
        name: item.bundle_name || 'Bundle',
        dataLabel: formatOrderItemData(item.data_amount),
        validityDays: item.validity_days,
        price: item.price,
        currency: item.currency ?? apiOrder.currency,
      })) ?? [];

    return {
      draftId: apiOrder.draft_id,
      orderId: apiOrder.id,
      countryName:
        apiOrder.metadata?.countryName ?? apiOrder.trip?.destination_country ?? undefined,
      arrivalDate: apiOrder.trip?.arrival_date ?? null,
      departureDate: apiOrder.trip?.departure_date ?? null,
      items,
      total: apiOrder.total_amount,
      currency: apiOrder.currency,
      paymentReference: apiOrder.payment_reference,
      status: apiOrder.payment_status || apiOrder.status,
    };
  }

  const localSource = pendingPayment?.simType === 'physical' ? pendingPayment : null;
  const purchaseSource =
    !localSource && purchase?.simType === 'physical' ? purchase : null;
  const source = localSource ?? purchaseSource;
  if (!source) return null;

  const items =
    source.items?.map((item) => ({
      name: item.bundle.name,
      dataLabel: formatOrderItemData(item.bundle.data_mb),
      validityDays: item.bundle.validity_days,
      price:
        item.bundle.price != null
          ? Number(item.bundle.price).toFixed(2)
          : undefined,
      currency: item.bundle.currency ?? source.currency,
    })) ?? [];

  return {
    draftId: localSource?.draft_id ?? purchase?.draftId,
    orderId: localSource?.order_id ?? purchase?.orderId,
    countryName: source.trip?.countryName,
    arrivalDate: source.trip?.arrivalDate ?? null,
    departureDate: source.trip?.departureDate ?? null,
    items,
    total: source.total != null ? Number(source.total).toFixed(2) : undefined,
    currency: source.currency,
    status: 'paid',
  };
}

function hasPhysicalSimPurchase(
  orders: OrderRecord[],
  pendingPayment: PendingPaymentData | null,
  purchase: PurchaseData | null
): boolean {
  return resolvePhysicalPickupDetails(orders, pendingPayment, purchase) != null;
}

function simTypeLabel(simType?: string | null) {
  const normalized = (simType ?? 'esim').toLowerCase();
  if (normalized === 'physical') return 'Physical SIM Card';
  return 'eSIM';
}

function isSimActive(status?: string | null) {
  return (status ?? '').toUpperCase() === 'MANAGED';
}

function simStatusLabel(status?: string | null) {
  return isSimActive(status) ? 'Active' : 'Inactive';
}

function formatMsisdn(msisdn?: string | null) {
  if (!msisdn) return null;
  return msisdn.startsWith('+') ? msisdn : `+${msisdn}`;
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPaymentData | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [userEsims, setUserEsims] = useState<UserEsimRecord[]>([]);
  const [latestOrderBundle, setLatestOrderBundle] = useState<BundleDetail | null>(null);
  const [assignedSim, setAssignedSim] = useState<EsimAssignmentPayload | null>(null);
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [waitingForSim, setWaitingForSim] = useState(false);
  const [esimsError, setEsimsError] = useState('');
  const [activating, setActivating] = useState(false);
  const [topUpModalOpen, setTopUpModalOpen] = useState(false);
  const [topUpModalShown, setTopUpModalShown] = useState(false);
  const [topUpModalClosing, setTopUpModalClosing] = useState(false);
  const [topUpBundles, setTopUpBundles] = useState<TopUpBundle[]>([]);
  const [topUpBundlesLoading, setTopUpBundlesLoading] = useState(false);
  const ordersRef = useRef(orders);
  const purchaseRef = useRef(purchase);

  ordersRef.current = orders;
  purchaseRef.current = purchase;

  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await OrderApi.listMine();
      if (!res.ok) {
        setOrders([]);
        return;
      }
      setOrders(parseOrdersFromBody(res.body));
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadEsims = useCallback(async () => {
    setEsimsError('');
    try {
      const res = await EsimsApi.listMine();
      if (!res.ok) {
        const msg =
          res.body &&
          typeof res.body === 'object' &&
          typeof (res.body as { message?: unknown }).message === 'string'
            ? String((res.body as { message: string }).message)
            : `Could not load eSIMs (HTTP ${res.status}).`;
        setEsimsError(msg);
        setUserEsims([]);
        setLatestOrderBundle(null);
        return;
      }
      const parsed = parseEsimsFromBody(res.body);
      setUserEsims(parsed.esims);
      setLatestOrderBundle(parsed.latestOrderBundle);
    } catch (e: unknown) {
      const fallback =
        e instanceof Error ? e.message : typeof e === 'string' ? e : String(e);
      setEsimsError(fallback || 'Failed to load eSIM details.');
      setUserEsims([]);
      setLatestOrderBundle(null);
    }
  }, []);

  const applyAssignedSim = useCallback(
    (payload: EsimAssignmentPayload | undefined) => {
      if (payload) setAssignedSim(payload);
    },
    []
  );

  const handleActivateSim = useCallback(async (userEsimId: number) => {
    setActivating(true);
    setEsimsError('');
    try {
      const res = await EsimsApi.activate(userEsimId);
      if (!res.ok) {
        setEsimsError(apiErrorMessage(res.body, `Activation failed (HTTP ${res.status}).`));
        return;
      }
      await loadEsims();
    } catch (e: unknown) {
      const fallback =
        e instanceof Error ? e.message : typeof e === 'string' ? e : String(e);
      setEsimsError(fallback || 'Activation failed.');
    } finally {
      setActivating(false);
    }
  }, [loadEsims]);

  useEffect(() => {
    if (!topUpModalOpen) return;

    let cancelled = false;
    setTopUpBundlesLoading(true);

    (async () => {
      try {
        const res = await BundlesApi.list<BundlesResponse>();
        const apiBundles = res.data?.bundles ?? [];
        const uiBundles: TopUpBundle[] = apiBundles.map((b) => ({
          id: b.id,
          sim_bundle_id: b.sim_bundle_id ?? null,
          name: b.alias?.trim() || b.name,
          data_mb: bundleToMb(b),
          validity_days: b.validity_days ?? undefined,
          price: b.price ?? undefined,
          currency: b.currency ?? undefined,
          tagline: b.name,
        }));
        if (!cancelled) setTopUpBundles(uiBundles);
      } catch {
        if (!cancelled) setTopUpBundles([]);
      } finally {
        if (!cancelled) setTopUpBundlesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [topUpModalOpen]);

  const closeTopUpModal = useCallback((onClosed?: () => void) => {
    if (topUpModalClosing) return;
    setTopUpModalClosing(true);
    window.setTimeout(() => {
      setTopUpModalOpen(false);
      setTopUpModalClosing(false);
      setTopUpModalShown(false);
      onClosed?.();
    }, TOPUP_MODAL_TRANSITION_MS);
  }, [topUpModalClosing]);

  useEffect(() => {
    if (!topUpModalOpen) return;
    setTopUpModalShown(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setTopUpModalShown(true));
    });
    return () => cancelAnimationFrame(id);
  }, [topUpModalOpen]);

  useEffect(() => {
    if (!topUpModalOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTopUpModal();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [topUpModalOpen, closeTopUpModal]);

  const handleTopUpPurchase = useCallback(
    (bundle: TopUpBundle) => {
      if (topUpModalClosing) return;

      const activeEsim = userEsims[0] ?? null;
      const country = activeEsim?.order?.metadata?.country ?? 'TZ';
      const countryName =
        activeEsim?.order?.metadata?.countryName ??
        purchase?.trip?.countryName ??
        'Tanzania';
      const simType =
        activeEsim?.esim?.sim_type === 'physical' ? 'physical' : 'esim';

      localStorage.setItem(
        'cart',
        JSON.stringify({
          items: [{ bundle, quantity: 1 }],
          country,
          countryName,
          simType,
          checkoutMode: 'topup',
        })
      );
      sessionStorage.setItem(CHECKOUT_TRANSITION_KEY, 'topup-modal');
      closeTopUpModal(() => router.push('/checkout'));
    },
    [userEsims, purchase, router, topUpModalClosing, closeTopUpModal]
  );

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/auth/login?redirect=/dashboard');
      return;
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const raw = localStorage.getItem('lastPurchase');
    if (raw) {
      try {
        setPurchase(JSON.parse(raw));
      } catch {
        setPurchase(null);
      }
    }
    setPendingPayment(readPendingPaymentFromStorage());
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadOrders();
  }, [isAuthenticated, loadOrders]);

  useEffect(() => {
    if (!isAuthenticated || ordersLoading) return;

    const signal: WatcherSignal = { cancelled: false };

    async function dashboardSimWatcher() {
      setAssignmentLoading(true);
      setWaitingForSim(false);

      try {
        while (!signal.cancelled) {
          const statusRes = await EsimsApi.assignmentStatus();
          if (signal.cancelled) return;

          if (!statusRes.ok) {
            const msg =
              statusRes.body &&
              typeof statusRes.body === 'object' &&
              typeof (statusRes.body as { message?: unknown }).message === 'string'
                ? String((statusRes.body as { message: string }).message)
                : `Could not check SIM assignment (HTTP ${statusRes.status}).`;
            setEsimsError(msg);
            setAssignmentLoading(false);
            return;
          }

          const status = parseAssignmentStatus(statusRes.body);
          const pendingPay = readPendingPaymentFromStorage();
          const isPhysicalPurchase =
            pendingPay?.simType === 'physical' ||
            hasPhysicalSimPurchase(ordersRef.current, pendingPay, purchaseRef.current);

          if (isPhysicalPurchase && !status.has_sim) {
            setWaitingForSim(false);
            setAssignmentLoading(false);
            return;
          }

          if (status.has_sim) {
            applyAssignedSim(status.data);
            setWaitingForSim(false);
            if (pendingPay?.simType === 'physical') {
              localStorage.removeItem('pendingPayment');
              setPendingPayment(null);
            }
            await loadEsims();
            setAssignmentLoading(false);
            return;
          }

          if (shouldPollAssignment(status)) {
            setWaitingForSim(true);
          } else {
            setWaitingForSim(false);
            await loadEsims();
            setAssignmentLoading(false);
            return;
          }

          if ((status.inventory?.available ?? 0) > 0) {
            const assignRes = await EsimsApi.register();
            if (signal.cancelled) return;

            if (assignRes.ok || assignRes.status === 201) {
              const assign = parseAssignmentStatus(assignRes.body);
              if (assign.has_sim) {
                applyAssignedSim(assign.data);
                setWaitingForSim(false);
                await loadEsims();
                setAssignmentLoading(false);
                return;
              }
            }
          }

          const delayMs = (status.retry_after_seconds ?? DEFAULT_RETRY_SECONDS) * 1000;
          await sleep(delayMs, signal);
        }
      } catch (e: unknown) {
        if (signal.cancelled) return;
        const fallback =
          e instanceof Error ? e.message : typeof e === 'string' ? e : String(e);
        setEsimsError(fallback || 'Failed to check SIM assignment.');
        setAssignmentLoading(false);
      }
    }

    void dashboardSimWatcher();

    return () => {
      signal.cancelled = true;
      if (signal.timeoutId) window.clearTimeout(signal.timeoutId);
    };
  }, [isAuthenticated, applyAssignedSim, loadEsims, ordersLoading]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f6f8f6' }}>
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const primaryUserEsim = userEsims[0] ?? null;
  const primaryBundle = purchase?.items?.[0]?.bundle;
  const apiBundle = primaryUserEsim?.bundle ?? latestOrderBundle ?? null;
  const orderItemDataAmount = coerceNumber(primaryUserEsim?.order_item?.data_amount);

  const assignedMsisdn =
    assignedSim?.esim?.msisdn ?? primaryUserEsim?.esim?.msisdn ?? null;
  const assignedBundleName =
    apiBundle?.alias ??
    apiBundle?.name ??
    assignedSim?.bundle?.name ??
    primaryBundle?.name ??
    primaryUserEsim?.esim?.description ??
    null;
  const assignedBundleDuration =
    apiBundle?.duration ??
    (apiBundle?.validity_days ? `${apiBundle.validity_days} days` : null) ??
    assignedSim?.bundle?.duration ??
    (primaryBundle?.validity_days ? `${primaryBundle.validity_days} days` : null);
  const bundleDataMb = resolveBundleDataMb(
    primaryUserEsim?.bundle,
    latestOrderBundle,
    assignedSim?.bundle,
    primaryBundle,
    orderItemDataAmount
  );

  const simType = primaryUserEsim?.esim?.sim_type ?? assignedSim?.esim?.sim_type ?? 'esim';
  const simStatus = primaryUserEsim?.esim?.status ?? assignedSim?.esim?.status ?? null;
  const simIsActive = isSimActive(simStatus);
  const simTypeTitle = simTypeLabel(simType);
  const isEsimType = simType.toLowerCase() !== 'physical';

  const hasActiveEsim =
    Boolean(assignedMsisdn) || userEsims.length > 0;

  const physicalPickupDetails = resolvePhysicalPickupDetails(
    orders,
    pendingPayment,
    purchase
  );
  const isPhysicalSimAwaitingPickup =
    !hasActiveEsim && physicalPickupDetails != null;

  const totalEsims =
    userEsims.length > 0
      ? userEsims.length
      : (purchase?.items?.reduce((s, c) => s + c.quantity, 0) ?? 0);

  const headlineData = displayDataBalance(bundleDataMb);
  const balanceAreaValue = displayDataBalance(bundleDataMb);

  const esimTitle =
    assignedBundleName ??
    (assignedMsisdn ? formatMsisdn(assignedMsisdn) : null) ??
    'eSIM';

  const activationIso =
    purchase?.trip?.arrivalDate ?? primaryUserEsim?.created_at ?? null;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f6f8f6' }}>
      {/* Header bar */}
      <div className="bg-white border-b border-slate-100 px-4 py-5">
        <div className="max-w-5xl mx-auto flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-0.5">
              Dashboard
            </p>
            <h1 className="text-xl font-extrabold text-slate-900">
              {isAuthenticated
                ? `Welcome back, ${user?.name?.split(' ')[0] ?? 'Traveller'}`
                : 'Your eSIM Dashboard'}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setTopUpModalOpen(true)}
            className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#112116' }}
          >
            Top Up
          </button>
        </div>
      </div>

      {topUpModalOpen && (
        <div
          className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 transition-opacity duration-300 ease-out ${
            topUpModalShown && !topUpModalClosing ? 'opacity-100' : 'opacity-0'
          } ${topUpModalClosing ? 'pointer-events-none' : ''}`}
          onClick={() => closeTopUpModal()}
          role="presentation"
        >
          <div
            className={`bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              topUpModalShown && !topUpModalClosing
                ? 'opacity-100 translate-y-0 sm:scale-100'
                : 'opacity-0 translate-y-full sm:translate-y-4 sm:scale-95'
            }`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="topup-modal-title"
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-slate-100"
              style={{ backgroundColor: '#112116' }}
            >
              <div>
                <h2 id="topup-modal-title" className="text-base font-extrabold text-white">
                  Top Up
                </h2>
                <p className="text-xs text-white/60 mt-0.5">Choose a bundle to purchase</p>
              </div>
              <button
                type="button"
                onClick={() => closeTopUpModal()}
                disabled={topUpModalClosing}
                className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="overflow-y-auto p-4 space-y-3 max-h-[calc(85vh-4.5rem)]">
              {topUpBundlesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={28} className="animate-spin text-slate-400" />
                </div>
              ) : topUpBundles.length === 0 ? (
                <div className="text-center py-12">
                  <Package size={36} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-sm text-slate-500 font-medium">No bundles available right now.</p>
                </div>
              ) : (
                topUpBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900">{bundle.name}</p>
                      <p className="text-lg font-black text-slate-900 tracking-tight">
                        {formatMb(bundle.data_mb)}
                      </p>
                      {bundle.tagline && bundle.tagline !== bundle.name && (
                        <p className="text-xs text-slate-500">{bundle.tagline}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {bundle.validity_days ?? 30} days · {bundle.currency ?? 'USD'}{' '}
                        {Number(bundle.price ?? 0).toFixed(0)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTopUpPurchase(bundle)}
                      disabled={topUpModalClosing}
                      className="flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
                      style={{ backgroundColor: '#112116' }}
                    >
                      Purchase
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {esimsError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {esimsError}
          </div>
        )}

        {waitingForSim && !hasActiveEsim && !isPhysicalSimAwaitingPickup && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-4 flex items-start gap-3">
            <Loader2 size={20} className="animate-spin text-sky-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-sky-900">
                We&apos;re assigning your number. This may take a few minutes.
              </p>
              <p className="text-xs text-sky-700 mt-1">
                We&apos;ll update this page automatically when your SIM is ready.
              </p>
            </div>
          </div>
        )}

        {isPhysicalSimAwaitingPickup && physicalPickupDetails && (
          <div className="rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-sm">
            <div
              className="px-6 py-5 flex items-start gap-4"
              style={{ backgroundColor: 'rgba(23,207,84,0.08)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: 'rgba(23,207,84,0.15)' }}
              >
                <MapPin size={22} style={{ color: '#112116' }} />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 mb-1">
                  Your number is reserved — pick up your SIM at the airport
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Good news — your Travela number has already been purchased and is waiting for you.
                  When you arrive, visit the Travela counter at the airport to collect your physical
                  SIM card. Bring a valid ID and your order reference below so our team can help you
                  quickly.
                </p>
              </div>
            </div>

            <div className="px-6 py-5 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <Package size={16} style={{ color: '#17cf54' }} />
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600">
                  Order details
                </h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 mb-4">
                {physicalPickupDetails.draftId && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 sm:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Order reference (show at counter)
                    </p>
                    <p className="text-lg font-black text-slate-900 tracking-tight break-all">
                      {physicalPickupDetails.draftId}
                    </p>
                  </div>
                )}
                {physicalPickupDetails.orderId != null && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Order ID
                    </p>
                    <p className="text-sm font-bold text-slate-900">{physicalPickupDetails.orderId}</p>
                  </div>
                )}
                {physicalPickupDetails.countryName && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Destination
                    </p>
                    <p className="text-sm font-bold text-slate-900">{physicalPickupDetails.countryName}</p>
                  </div>
                )}
                {formatTripDate(physicalPickupDetails.arrivalDate) && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Arrival date
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {formatTripDate(physicalPickupDetails.arrivalDate)}
                    </p>
                  </div>
                )}
                {formatTripDate(physicalPickupDetails.departureDate) && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Departure date
                    </p>
                    <p className="text-sm font-bold text-slate-900">
                      {formatTripDate(physicalPickupDetails.departureDate)}
                    </p>
                  </div>
                )}
                {physicalPickupDetails.paymentReference && (
                  <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 sm:col-span-2">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">
                      Payment reference
                    </p>
                    <p className="text-sm font-bold text-slate-900 break-all">
                      {physicalPickupDetails.paymentReference}
                    </p>
                  </div>
                )}
              </div>

              {physicalPickupDetails.items.length > 0 && (
                <div className="space-y-2 mb-4">
                  {physicalPickupDetails.items.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {item.dataLabel} · {item.name}
                        </p>
                        {item.validityDays != null && (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {item.validityDays} days validity · Physical SIM
                          </p>
                        )}
                      </div>
                      {item.price != null && (
                        <p className="text-sm font-semibold text-slate-800 flex-shrink-0">
                          {item.currency ?? physicalPickupDetails.currency}{' '}
                          {item.price}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {physicalPickupDetails.total != null && physicalPickupDetails.currency && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <p className="text-sm font-bold text-slate-700">Total paid</p>
                  <p className="text-base font-extrabold" style={{ color: '#112116' }}>
                    {physicalPickupDetails.currency} {physicalPickupDetails.total}
                  </p>
                </div>
              )}

              {ordersLoading && (
                <p className="text-xs text-slate-400 mt-3 flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin" />
                  Refreshing order details…
                </p>
              )}
            </div>
          </div>
        )}

        {assignmentLoading && !hasActiveEsim && !waitingForSim && !isPhysicalSimAwaitingPickup ? (
          <div className="rounded-2xl p-12 flex items-center justify-center bg-white border border-slate-100">
            <Loader2 size={28} className="animate-spin text-slate-400" />
          </div>
        ) : hasActiveEsim ? (
          <>
            {/* SIM card */}
            <div
              className="rounded-2xl p-6 text-white"
              style={{ backgroundColor: '#112116' }}
            >
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {isEsimType ? (
                      <Wifi size={14} className="text-white/50" />
                    ) : (
                      <Smartphone size={14} className="text-white/50" />
                    )}
                    <p className="text-xs font-bold uppercase tracking-widest text-white/50">
                      {simTypeTitle}
                    </p>
                  </div>
                  {assignedMsisdn && (
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                      {formatMsisdn(assignedMsisdn)}
                    </h2>
                  )}
                  {!assignedMsisdn && (
                    <h2 className="text-4xl font-black tracking-tight">{headlineData}</h2>
                  )}
                  <p className="text-base font-black text-white mt-1">{esimTitle}</p>
                  {assignedBundleDuration && (
                    <p className="text-sm font-semibold mt-1" style={{ color: '#17cf54' }}>
                      {assignedBundleDuration}
                    </p>
                  )}
                  {formatTripDate(activationIso) && (
                    <p className="text-xs font-semibold text-white/60 uppercase tracking-wide mt-2">
                      Scheduled activation
                    </p>
                  )}
                  {formatTripDate(activationIso) && (
                    <p className="text-sm font-bold" style={{ color: '#17cf54' }}>
                      {formatTripDate(activationIso)}
                    </p>
                  )}
                  {purchase?.trip?.countryName && (
                    <p className="text-sm font-semibold mt-1 text-white/80">{purchase.trip.countryName}</p>
                  )}
                </div>
                <span
                  className="text-xs font-extrabold px-3 py-1.5 rounded-full"
                  style={
                    simIsActive
                      ? { backgroundColor: '#17cf54', color: '#112116' }
                      : { backgroundColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.8)' }
                  }
                >
                  {simStatusLabel(simStatus)}
                </span>
              </div>

              <div
                className="h-2.5 rounded-full overflow-hidden mb-1"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: simIsActive ? '#17cf54' : 'rgba(255,255,255,0.35)',
                    width: simIsActive ? '100%' : '35%',
                  }}
                />
              </div>

              {assignedMsisdn && balanceAreaValue !== '—' && (
                <p className="text-sm text-white/60 mt-3">{balanceAreaValue} data plan</p>
              )}

              {!simIsActive && primaryUserEsim?.id && (
                <button
                  type="button"
                  onClick={() => void handleActivateSim(primaryUserEsim.id)}
                  disabled={activating}
                  className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#17cf54', color: '#112116' }}
                >
                  {activating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Activating…
                    </>
                  ) : (
                    <>
                      <Zap size={16} /> Activate
                    </>
                  )}
                </button>
              )}

              {totalEsims > 1 && (
                <div
                  className="mt-4 flex items-center gap-2 text-sm"
                  style={{ color: 'rgba(255,255,255,0.6)' }}
                >
                  <Globe size={14} />
                  <span>You have {totalEsims} eSIMs on your account</span>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: isEsimType ? (
                    <Wifi size={16} style={{ color: '#17cf54' }} />
                  ) : (
                    <Smartphone size={16} style={{ color: '#17cf54' }} />
                  ),
                  label: 'SIM Type',
                  value: simTypeTitle,
                  sub: simStatusLabel(simStatus),
                },
                {
                  icon: <Globe size={16} style={{ color: '#17cf54' }} />,
                  label: 'Balance',
                  value: balanceAreaValue,
                  sub:
                    bundleDataMb != null
                      ? apiBundle?.name
                        ? `${apiBundle.name} bundle`
                        : 'Bundle data allowance'
                      : 'No bundle data',
                },
                {
                  icon: <Clock size={16} style={{ color: '#17cf54' }} />,
                  label: 'Duration',
                  value: assignedBundleDuration ?? '—',
                  sub: primaryUserEsim?.created_at ? 'Assigned' : 'Bundle validity',
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-xl border border-slate-100 p-4"
                >
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                    {s.icon} {s.label}
                  </div>
                  <p className="text-xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Activation instructions */}
            {isEsimType ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info size={18} style={{ color: '#17cf54' }} />
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600">
                    How to Activate
                  </h3>
                </div>
                {[
                  { num: '1', text: 'Open the email from Travela with your ', bold: 'eSIM QR Code' },
                  {
                    num: '2',
                    text: 'Go to Settings › Cellular › ',
                    bold: 'Add eSIM',
                    after: ' and scan the QR code',
                  },
                  { num: '3', text: 'Turn on ', bold: 'Data Roaming', after: ' for the new eSIM' },
                ].map((step) => (
                  <div key={step.num} className="flex gap-3 mb-3">
                    <div
                      className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'rgba(23,207,84,0.15)', color: '#112116' }}
                    >
                      {step.num}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {step.text}
                      <strong className="text-slate-900">{step.bold}</strong>
                      {step.after ?? ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Info size={18} style={{ color: '#17cf54' }} />
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-600">
                    Physical SIM
                  </h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Insert your physical SIM card into your device. Tap <strong className="text-slate-900">Activate</strong> above once the card is in place to enable your plan.
                </p>
              </div>
            )}
          </>
        ) : isPhysicalSimAwaitingPickup ? null : (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 border border-slate-100"
              style={{ backgroundColor: '#f6f8f6' }}
            >
              <Smartphone size={30} className="text-slate-300" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">No Active eSIM</h2>
            <p className="text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
              Purchase an eSIM bundle to stay connected during your travels.
            </p>
          </div>
        )}

        {/* Travela branding footer */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{ backgroundColor: '#112116' }}
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle size={16} style={{ color: '#17cf54' }} />
            <span className="text-xs font-bold text-white/70">
              Travela · by Onnela · For A More Enjoyable Life
            </span>
          </div>
          <p className="text-xs text-white/30">Available in 50+ African countries</p>
        </div>
      </div>
    </div>
  );
}
