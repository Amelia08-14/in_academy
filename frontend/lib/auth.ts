export type Role = "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "TRAINER" | "LEARNER" | "COMPANY_ADMIN";

export const ADMIN_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "MANAGER"];

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Administration",
  ADMIN: "Administration",
  MANAGER: "Administration",
  TRAINER: "Espace formateur",
  COMPANY_ADMIN: "Espace entreprise",
  LEARNER: "Mon espace",
};

export type AuthState = {
  token: string | null;
  role: string | null;
  email: string | null;
};

export function getAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { token: null, role: null, email: null };
  }
  return {
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
    email: localStorage.getItem("email"),
  };
}

export function roleHomeRoute(role: string | null): string {
  if (!role) return "/connexion";
  if (ADMIN_ROLES.includes(role as Role)) return "/admin";
  if (role === "COMPANY_ADMIN") return "/espace-entreprise";
  return "/dashboard";
}

export function roleLabel(role: string | null): string {
  if (!role) return "Mon espace";
  return ROLE_LABELS[role] ?? "Mon espace";
}

export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("email");
  window.dispatchEvent(new Event("authchange"));
}

// ─── Admin (back-office) — session totalement indépendante de celle du site ───
// Stockage séparé (admin_*) pour que le site (Header, dashboard, espace-entreprise)
// n'ait jamais accès ni connaissance d'une session admin, et inversement.

export type AdminAuthState = {
  token: string | null;
  role: string | null;
  email: string | null;
};

export function getAdminAuthState(): AdminAuthState {
  if (typeof window === "undefined") {
    return { token: null, role: null, email: null };
  }
  return {
    token: localStorage.getItem("admin_token"),
    role: localStorage.getItem("admin_role"),
    email: localStorage.getItem("admin_email"),
  };
}

export function setAdminAuthState(token: string, role: string, email: string): void {
  localStorage.setItem("admin_token", token);
  localStorage.setItem("admin_role", role);
  localStorage.setItem("admin_email", email);
  window.dispatchEvent(new Event("adminauthchange"));
}

export function adminLogout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_role");
  localStorage.removeItem("admin_email");
  window.dispatchEvent(new Event("adminauthchange"));
}
