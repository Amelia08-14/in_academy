"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";
import { api } from "@/lib/api";

interface Me {
  email: string;
  learnerProfile: { firstName: string; lastName: string } | null;
  companyAdmin: { firstName: string | null; lastName: string | null; company: { raisonSociale: string } } | null;
}

function initials(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return text.slice(0, 2).toUpperCase();
}

const NAV_LINKS = [
  { href: "/", label: "ACCUEIL" },
  { href: "/branches", label: "NOS FORMATIONS" },
  { href: "/formateurs", label: "FORMATEURS" },
  { href: "/contact", label: "CONTACT" },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, email, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const showProfile = isAuthenticated;

  useEffect(() => {
    if (!showProfile) return;
    api.get<Me>("/auth/me").then(setMe).catch(() => setMe(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProfile]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    setMenuOpen(false);
    setMobileOpen(false);
    logout();
    router.push("/");
  };

  const displayName = me?.learnerProfile
    ? `${me.learnerProfile.firstName} ${me.learnerProfile.lastName}`
    : me?.companyAdmin?.company.raisonSociale ?? null;

  const subLabel =
    role === "COMPANY_ADMIN" && me?.companyAdmin?.firstName
      ? `${me.companyAdmin.firstName} ${me.companyAdmin.lastName ?? ""}`.trim()
      : email;

  const menuItems =
    role === "COMPANY_ADMIN"
      ? [
          { label: "Mes devis", href: "/espace-entreprise?tab=devis" },
          { label: "Mes formations", href: "/espace-entreprise?tab=formations" },
        ]
      : [
          { label: "Mes formations", href: "/dashboard" },
          { label: "Sessions disponibles", href: "/branches" },
        ];

  return (
    <>
    <motion.header
      className="header"
      id="header"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="header__inner container">
        {/* Logo */}
        <Link href="/" className="header__logo">
          <Image
            src="/images/logo_in_academy_white.png"
            alt="IN Academy"
            width={56}
            height={56}
            className="header__logo-img"
            priority
          />
        </Link>

        {/* Navigation Pill */}
        <div className="header__nav-wrapper">
          <nav className="header__nav" id="main-nav">
            {NAV_LINKS.map((item) => {
              const active = item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`header__nav-link${active ? " header__nav-link--active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Auth */}
        <div className="header__auth">
          {showProfile ? (
            <div className="header__profile" ref={menuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setMenuOpen((v) => !v)}
                className="header__avatar-btn"
                type="button"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Mon profil"
              >
                {initials(displayName ?? email ?? "?")}
              </motion.button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    className="header__profile-menu"
                    role="menu"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="header__profile-menu-head">
                      <span className="header__profile-menu-avatar">{initials(displayName ?? email ?? "?")}</span>
                      <div className="header__profile-menu-head-text">
                        <span className="header__profile-menu-name">{displayName ?? "Mon compte"}</span>
                        <span className="header__profile-menu-sub">{subLabel}</span>
                      </div>
                    </div>

                    <div className="header__profile-menu-divider" />

                    {menuItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="header__profile-menu-item"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}

                    <div className="header__profile-menu-divider" />

                    <button
                      type="button"
                      className="header__profile-menu-item"
                      role="menuitem"
                      onClick={handleLogout}
                    >
                      Se déconnecter
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/connexion" className="header__login-btn">
                  SE CONNECTER
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link href="/inscription" className="header__cta-btn">
                  S&apos;INSCRIRE
                  <span className="header__cta-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </span>
                </Link>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="header__menu-toggle"
          id="menu-toggle"
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav-drawer"
          onClick={() => setMobileOpen((v) => !v)}
          type="button"
        >
          <span className={mobileOpen ? "translate-y-[7px] rotate-45" : ""} />
          <span className={mobileOpen ? "opacity-0" : ""} />
          <span className={mobileOpen ? "-translate-y-[7px] -rotate-45" : ""} />
        </button>
      </div>
    </motion.header>

      {/* Mobile drawer — rendered outside <motion.header> so `position: fixed` resolves
          against the viewport, not the header's own animated (transformed) box. */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 top-0 z-[999] bg-navy-deeper/70 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              id="mobile-nav-drawer"
              className="fixed right-0 top-0 z-[1000] flex h-dvh w-[84vw] max-w-sm flex-col overflow-y-auto bg-navy-deeper px-6 pb-8 pt-24 shadow-2xl md:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
            >
              <nav className="flex flex-col gap-1" aria-label="Navigation principale">
                {NAV_LINKS.map((item) => {
                  const active = item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-xl px-4 py-3.5 font-mono text-sm font-medium uppercase tracking-wider transition-colors ${
                        active ? "bg-gold/15 text-gold-light" : "text-white/75 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="my-6 h-px bg-white/10" />

              {showProfile ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3 px-4 pb-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold font-mono text-sm font-bold text-navy-deeper">
                      {initials(displayName ?? email ?? "?")}
                    </span>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate font-body text-sm font-bold text-white">{displayName ?? "Mon compte"}</span>
                      <span className="truncate font-mono text-xs text-white/50">{subLabel}</span>
                    </div>
                  </div>
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-xl px-4 py-3.5 font-body text-sm font-medium text-white/85 transition-colors hover:bg-white/5"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-xl px-4 py-3.5 text-left font-body text-sm font-medium text-white/85 transition-colors hover:bg-white/5"
                  >
                    Se déconnecter
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/connexion"
                    className="rounded-full border border-white/20 px-5 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-white/85 transition-colors hover:border-white/50 hover:bg-white/5"
                  >
                    Se connecter
                  </Link>
                  <Link
                    href="/inscription"
                    className="rounded-full bg-linear-to-br from-gold to-gold-dark px-5 py-3 text-center font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-md"
                  >
                    S&apos;inscrire
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
