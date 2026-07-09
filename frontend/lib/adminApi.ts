// Client API dédié au back-office admin — utilise le token admin_token,
// totalement séparé de lib/api.ts (session du site, token/role/email).
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("admin_token");
}

async function adminApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAdminToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Erreur ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const adminApi = {
  get: <T>(path: string) => adminApiFetch<T>(path),
  post: <T>(path: string, body: unknown) =>
    adminApiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    adminApiFetch<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => adminApiFetch<T>(path, { method: "DELETE" }),
};
