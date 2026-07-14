/**
 * API client for Travela backend.
 *
 * Override with NEXT_PUBLIC_BASE_URL (no trailing slash) if needed.
 */

const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ??
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

/** First validation message per Laravel field key. */
export function apiFieldErrors(body: unknown): Record<string, string> {
  if (!body || typeof body !== "object") return {};
  const b = body as { errors?: Record<string, string[]> };
  if (!b.errors || typeof b.errors !== "object") return {};
  const result: Record<string, string> = {};
  for (const [key, messages] of Object.entries(b.errors)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") {
      result[key] = messages[0];
    }
  }
  return result;
}

export type SetPasswordPayload = {
  email: string;
  code: string;
  password: string;
  password_confirmation: string;
};

export type SetPasswordResponse = {
  message: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  device?: string;
};

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
  email_verified?: boolean;
};

export function extractUserFromAuthBody(body: unknown): AuthUserPayload | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;

  const fromRecord = (record: Record<string, unknown>): AuthUserPayload | null => {
    const id = record.id;
    const name = record.name;
    const email = record.email;
    const emailVerified = record.email_verified;
    if (id == null && name == null && email == null) return null;
    return {
      id: typeof id === "number" || typeof id === "string" ? id : undefined,
      name: typeof name === "string" ? name : undefined,
      email: typeof email === "string" ? email : undefined,
      email_verified: typeof emailVerified === "boolean" ? emailVerified : undefined,
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
  /** POST /auth/login — body: { email, password, device? } */
  login: async (data: LoginPayload): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...data, device: data.device ?? "web" }),
    });
    const body = await parseResponseBody(res);
    return { ok: res.ok, status: res.status, body };
  },
  /** POST /auth/reset-password — walk-in SIM or forgot-password flow */
  resetPassword: async (data: SetPasswordPayload): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/auth/reset-password`, {
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
  /** POST /auth/forgot-password — request a new reset code */
  forgotPassword: async (data: { email: string }): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/auth/forgot-password`, {
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
  /** POST /auth/email/resend — resend verification email (auth required) */
  resendVerificationEmail: async (): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/auth/email/resend`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      // Some Laravel setups expect a JSON request body even if empty.
      body: JSON.stringify({}),
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
  // TODO: GET /orders/:draftId
  getByDraftId: async (_draftId: string) => ({ data: {} }),
  // TODO: POST /preorders/drafts
  createDraft: async (_payload: unknown) => ({ data: {} }),
  // TODO: POST /orders/finalize
  finalize: async (_payload: unknown) => ({ data: {} }),
};

export type EsimAssignmentPayload = {
  id?: number;
  esim?: {
    id?: number;
    msisdn?: string | null;
    phone_number?: string | null;
    iccid?: string | null;
    status?: string | null;
    sale_status?: string | null;
    sim_type?: string | null;
    provider_status?: string | null;
    description?: string | null;
    qr_code_data?: string | null;
    has_activation_data?: boolean;
  };
  bundle?: {
    name?: string | null;
    duration?: string | null;
    data_mb?: number | null;
  };
};

export type EsimAssignmentStatus = {
  has_sim: boolean;
  status?: string;
  retry_after_seconds?: number;
  inventory?: { available?: number };
  data?: EsimAssignmentPayload;
};

export type EsimActivationData = {
  qr_code_data: string;
  esim?: EsimAssignmentPayload["esim"];
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
  /** GET /me/esims/assignment-status — check whether a SIM has been assigned */
  assignmentStatus: async (): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/me/esims/assignment-status`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...authHeaders(),
      },
    });
    const body = await parseResponseBody(res);
    return { ok: res.ok, status: res.status, body };
  },
  /** POST /me/esims/register — assign a free SIM from inventory (auth required) */
  register: async (): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/me/esims/register`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify({}),
    });
    const body = await parseResponseBody(res);
    return { ok: res.ok, status: res.status, body };
  },
  /** GET /me/esims/{userEsimId}/activation — qr_code_data for device eSIM install */
  getActivation: async (userEsimId: number): Promise<ApiResult> => {
    const res = await fetch(`${PUBLIC_API_BASE}/me/esims/${userEsimId}/activation`, {
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

/** Parse GET /me/esims/{id}/activation response — activation value is `qr_code_data` only. */
export function parseEsimActivation(body: unknown): EsimActivationData | null {
  if (!body || typeof body !== "object") return null;
  const root = body as Record<string, unknown>;
  const data =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;

  const qr =
    typeof data.qr_code_data === "string" ? data.qr_code_data.trim() : "";

  if (!qr) return null;

  const esim =
    data.esim && typeof data.esim === "object" && !Array.isArray(data.esim)
      ? (data.esim as EsimAssignmentPayload["esim"])
      : undefined;

  return {
    qr_code_data: qr,
    esim,
  };
}
