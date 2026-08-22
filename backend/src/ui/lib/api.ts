export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface Envelope<T> {
  data: T;
  meta?: unknown;
}

async function request<T>(path: string, init?: RequestInit): Promise<Envelope<T>> {
  const res = await fetch(path, {
    ...init,
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (res.status === 204) {
    return { data: undefined as T };
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const error = (body && body.error) || {
      code: "UNKNOWN",
      message: `Request failed (${res.status})`,
    };
    throw new ApiError(res.status, error.code, error.message, error.details);
  }

  return body as Envelope<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path).then((r) => r.data),
  getList: <T>(path: string) =>
    request<T[]>(path).then((r) => ({ data: r.data, meta: r.meta as import("./types").ListMeta })),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }).then((r) => r.data),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }).then((r) => r.data),
  del: (path: string) => request<void>(path, { method: "DELETE" }).then(() => undefined),
};

export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
