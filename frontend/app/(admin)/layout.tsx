"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { ADMIN_ROLES, setAdminAuthState, type Role } from "@/lib/auth";

const navItems = [
  { href: "/admin", label: "Vue d'ensemble", icon: "▤" },
  { href: "/admin/inscriptions", label: "Inscriptions", icon: "✎" },
  { href: "/admin/formations", label: "Formations", icon: "◉" },
  { href: "/admin/sessions", label: "Sessions", icon: "▣" },
  { href: "/admin/devis", label: "Devis B2B", icon: "◈" },
  { href: "/admin/formateurs",   label: "Formateurs",  icon: "★" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "◎" },
];

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
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Identifiants incorrects"); return; }
      if (!ADMIN_ROLES.includes(data.role as Role)) {
        setError("Ce compte n'a pas accès au back-office administrateur.");
        return;
      }
      setAdminAuthState(data.token, data.role, email);
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__brand">
          <span className="admin-sidebar__logo">IN</span>
          <div>
            <span className="admin-sidebar__title">ACADEMY</span>
            <span className="admin-sidebar__sub">Back-office</span>
          </div>
        </div>

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

  if (!ready) return null;
  if (!token) return <AdminLoginScreen />;

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__logo">IN</span>
          <div>
            <span className="admin-sidebar__title">ACADEMY</span>
            <span className="admin-sidebar__sub">Back-office</span>
          </div>
        </div>

        <nav className="admin-nav">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav__item${pathname === item.href ? " admin-nav__item--active" : ""}`}
            >
              <span className="admin-nav__icon">{item.icon}</span>
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
