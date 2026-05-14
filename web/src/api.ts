const API = import.meta.env.VITE_API_URL || "";

const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  username: "Username",
  password: "Password",
  title: "Titulo",
  kind: "Tipo",
  year: "Año",
  name: "Nombre",
  date: "Fecha",
  notes: "Notas",
};

type ZodFieldErrors = Record<string, string[] | undefined>;
type ApiErrorPayload = {
  error?: string | { fieldErrors?: ZodFieldErrors; formErrors?: string[] };
  message?: string;
};

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function normalizeZodMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("expected string to have >=6 characters")) {
    return "debe tener al menos 6 caracteres";
  }
  if (lower.includes("expected string to have >=1 characters")) {
    return "no puede estar vacio";
  }
  if (lower.includes("invalid email")) {
    return "email invalido";
  }
  return message;
}

function formatFieldErrors(fieldErrors: ZodFieldErrors) {
  const parts = Object.entries(fieldErrors).flatMap(([field, messages]) => {
    const label = FIELD_LABELS[field] ?? field;
    if (!messages || messages.length === 0) return [];
    return messages.map((message) => `${label}: ${normalizeZodMessage(message)}`);
  });
  return parts.join(" • ");
}

function extractErrorMessage(payload: unknown) {
  if (!payload) return null;
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object") return null;
  const data = payload as ApiErrorPayload;
  if (typeof data.error === "string") return data.error;
  if (typeof data.error === "object" && data.error?.fieldErrors) {
    const formatted = formatFieldErrors(data.error.fieldErrors);
    if (formatted) return formatted;
  }
  if (typeof data.error === "object" && Array.isArray(data.error?.formErrors) && data.error.formErrors.length) {
    return data.error.formErrors.join(" ");
  }
  if (typeof data.message === "string") return data.message;
  return null;
}

async function toApiError(res: Response) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json().catch(() => null);
    const message = extractErrorMessage(data) || "Request failed";
    return new ApiError(message, res.status, data);
  }
  const text = await res.text().catch(() => "");
  return new ApiError(text || res.statusText || "Request failed", res.status);
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) return error.message || fallback;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function api<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
  });

  if (!res.ok) {
    throw await toApiError(res);
  }
  return res.json();
}
