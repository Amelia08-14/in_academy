"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { ADMIN_ROLES, setAdminAuthState, type Role } from "@/lib/auth";
import { apiErrorMessage } from "@/lib/apiError";

const navItems = [
  { href: "/admin", label: "Vue d'ensemble", icon: "dashboard" },
  { href: "/admin/inscriptions", label: "Inscriptions", icon: "check" },
  { href: "/admin/branches", label: "Branches", icon: "branches" },
  { href: "/admin/formations", label: "Formations", icon: "book" },
  { href: "/admin/sessions", label: "Sessions", icon: "calendar" },
  { href: "/admin/devis", label: "Devis B2B", icon: "document" },
  { href: "/admin/formateurs", label: "Formateurs", icon: "users" },
  { href: "/admin/evenements", label: "Nos Events", icon: "calendar" },
  { href: "/admin/candidatures", label: "Candidatures", icon: "inbox" },
  { href: "/admin/documents", label: "Documents", icon: "folder" },
  { href: "/admin/partenaires", label: "Partenaires", icon: "handshake" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "profile" },
];

const iconPaths: Record<string, React.ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  check: <><path d="M12 3 4.5 6v5.2c0 4.7 3.2 8.2 7.5 9.8 4.3-1.6 7.5-5.1 7.5-9.8V6L12 3Z"/><path d="m9 12 2 2 4-4"/></>,
  branches: <><circle cx="6" cy="5" r="2"/><circle cx="18" cy="5" r="2"/><circle cx="12" cy="19" r="2"/><path d="M6 7v3c0 2 1.5 3 3 3h6c1.5 0 3-1 3-3V7M12 13v4"/></>,
  book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v17h4.5A2.5 2.5 0 0 1 20 22V5.5Z"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></>,
  document: <><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  inbox: <><path d="M4 4h16v16H4z"/><path d="M4 14h4l2 3h4l2-3h4"/></>,
  folder: <><path d="M3 6h7l2 2h9v11H3z"/></>,
  handshake: <><path d="m8 12 3 3a2 2 0 0 0 3 0l5-5M2 9l4-4 5 2 2-1 5 5M2 9l5 7 2-2M22 9l-3-3-3 1"/></>,
  profile: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
};

function AdminIcon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{iconPaths[name]}</svg>;
}

function AdminBrand() {
  return (
    <div className="admin-sidebar__brand">
      <Image src="/images/logo_in_academy.png" alt="IN Academy" width={148} height={58} className="admin-sidebar__brand-image" priority />
      <span className="admin-sidebar__sub">Administration</span>
    </div>
  );
}

function AdminLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        setError(apiErrorMessage(data, "Identifiants incorrects"));
        return;
      }
      if (!data || typeof data !== "object") {
        setError("Réponse invalide du serveur.");
        return;
      }
      const { token, role } = data as { token?: unknown; role?: unknown };
      if (typeof token !== "string" || typeof role !== "string") {
        setError(apiErrorMessage(data, "Réponse de connexion invalide."));
        return;
      }
      if (!ADMIN_ROLES.includes(role as Role)) {
        setError("Ce compte n'a pas accès au back-office administrateur.");
        return;
      }
      setAdminAuthState(token, role, email);
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand"><AdminBrand /></div>

        <h1 className="admin-login__title">Connexion administrateur</h1>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label htmlFor="admin-email" className="auth-label">Email</label>
            <input
              id="admin-email" type="email" autoComplete="email" required
              className="auth-input" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@in-academy.dz"
            />
          </div>
          <div className="auth-field">
            <label htmlFor="admin-password" className="auth-label">Mot de passe</label>
            <input
              id="admin-password" type="password" autoComplete="current-password" required
              className="auth-input" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" className="btn btn--primary auth-submit" disabled={pending}>
            {pending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { ready, token, role, email, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!ready) return null;
  if (!token) return <AdminLoginScreen />;

  return (
    <div className={`admin-layout${menuOpen ? " admin-layout--menu-open" : ""}`}>
      <button className="admin-mobile-menu" type="button" aria-label="Ouvrir le menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
        <span /><span /><span />
      </button>
      <button className="admin-sidebar-overlay" type="button" aria-label="Fermer le menu" onClick={() => setMenuOpen(false)} />
      <aside className="admin-sidebar">
        <AdminBrand />

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={`admin-nav__item${pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}/`)) ? " admin-nav__item--active" : ""}`}
            >
              <span className="admin-nav__icon"><AdminIcon name={item.icon} /></span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <span className="admin-sidebar__user-email">{email}</span>
            <span className="admin-sidebar__user-role">{role}</span>
          </div>
          <button onClick={logout} className="admin-logout-btn">
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="admin-main">{children}</main>
    </div>
  );
}
