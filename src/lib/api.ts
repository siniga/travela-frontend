/**
 * API client for Travela backend.
 *
 * Override with NEXT_PUBLIC_BASE_URL (no trailing slash), e.g. for local Laravel:
 *   NEXT_PUBLIC_BASE_URL=http://127.0.0.1:8000/api
 */

const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") ??
  "https://api.thetravela.com/api";

function getBearerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function authHeaders(): Record<string, string> {
  const token = getBearerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function getJson<T>(url: string): Promise<{ data: T }> {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Request failed (${res.status}) ${url}${text ? ` — ${text}` : ""}`);
  }
  return { data: (await res.json()) as T };
}

async function parseResponseBody(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export type RegisterResult = {
  ok: boolean;
  status: number;
  /** Parsed JSON body, or plain text if invalid JSON */
  body: unknown;
};

export type ApiResult = {
  ok: boolean;
  status: number;
  /** Parsed JSON body, or plain text if invalid JSON */
  body: unknown;
};

export function apiErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const b = body as { message?: unknown; errors?: Record<string, string[]> };
    if (typeof b.message === "string") return b.message;
    if (b.errors && typeof b.errors === "object") {
      const first = Object.values(b.errors).flat()[0];
      if (typeof first === "string") return first;
    }
  }
  return fallback;
}

export function extractAuthTokenFromBody(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.token === "string") return b.token;
  if (typeof b.access_token === "string") return b.access_token;
  const data = b.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (typeof d.token === "string") return d.token;
    if (typeof d.access_token === "string") return d.access_token;
  }
  return null;
}

export type AuthUserPayload = {
  id?: number | string;
  name?: string;
  email?: string;
};

export function extractUserFromAuthBody(body: unknown): AuthUserPayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const fromRecord = (record: Record<string, unknown>): AuthUserPayload | null => {
    const id = record.id;
    const name = record.name;
    const email = record.email;
    if (id == null && name == null && email == null) return null;
    return {
      id: typeof id === "number" || typeof id === "string" ? id : undefined,
      name: typeof name === "string" ? name : undefined,
      email: typeof email === "string" ? email : undefined,
    };
  };

  if (b.user && typeof b.user === "object") {
    const parsed = fromRecord(b.user as Record<string, unknown>);
    if (parsed) return parsed;
  }

  const data = b.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.user && typeof d.user === "object") {
      const parsed = fromRecord(d.user as Record<string, unknown>);
      if (parsed) return parsed;
    }
    const parsed = fromRecord(d);
    if (parsed) return parsed;
  }

  return fromRecord(b);
}

export const CountriesApi = {
  // TODO: GET /countries
  list: async () => ({ data: [] }),
};

export const BundlesApi = {
  // GET /public/bundles
  list: async <T = unknown>() => getJson<T>(`${PUBLIC_API_BASE}/public/bundles`),
};

export const KycApi = {
  // TODO: POST /kyc
  create: async (_data: unknown) => ({ data: {} }),
  // TODO: GET /kyc/get
  get: async () => ({ data: {} }),
};

export const AuthApi = {
  /** POST /auth/register — body: { name, email, password } */
  register: async (data: { name: string; email: string; password: string }): Promise<RegisterResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const body = await parseResponseBody(res);
    return { ok: res.ok, status: res.status, body };
  },
  /** POST /auth/login — body: { email, password } */
  login: async (data: { email: string; password: string }): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const body = await parseResponseBody(res);
    return { ok: res.ok, status: res.status, body };
  },
  /** POST /auth/verify-email — body: { email, code } */
  verifyEmail: async (data: { email: string; code: string }): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/auth/verify-email`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    });
    const body = await parseResponseBody(res);
    return { ok: res.ok, status: res.status, body };
  },
  /** POST /auth/send-verification-email — body: { email } */
  sendVerificationEmail: async (data: { email: string }): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/auth/send-verification-email`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(data),
    });
    const body = await parseResponseBody(res);
    return { ok: res.ok, status: res.status, body };
  },
};

export const OrderApi = {
  /** GET /me/orders — list orders for the signed-in user */
  listMine: async (): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/me/orders`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    });
    const body = await parseResponseBody(res);
    return { ok: res.ok, status: res.status, body };
  },
  /** POST /orders */
  create: async (payload: unknown): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/orders`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(payload),
    });
    const body = await parseResponseBody(res);
    return { ok: res.ok, status: res.status, body };
  },
  /** POST /orders/:orderId/payment-paid-test (test) */
  paymentPaidTest: async (orderId: string | number): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/public/orders/${orderId}/payment-paid-test`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    });
    const body = await parseResponseBody(res);
    return { ok: res.ok, status: res.status, body };
  },
  // TODO: GET /orders/:draftId
  getByDraftId: async (_draftId: string) => ({ data: {} }),
  // TODO: POST /preorders/drafts
  createDraft: async (_payload: unknown) => ({ data: {} }),
  // TODO: POST /orders/finalize
  finalize: async (_payload: unknown) => ({ data: {} }),
};

export const EsimsApi = {
  /** GET /me/esims — eSIM details for the signed-in user */
  listMine: async (): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/me/esims`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    });
    const body = await parseResponseBody(res);
    return { ok: res.ok, status: res.status, body };
  },
};
