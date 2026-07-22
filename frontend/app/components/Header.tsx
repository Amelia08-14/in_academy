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
  { href: "/", label: "ACCUEIL", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  { href: "/branches", label: "NOS FORMATIONS", icon: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15Z" },
  { href: "/formateurs", label: "FORMATEURS", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { href: "/devenir-collaborateur", label: "COLLABORER", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" },
  { href: "/contact", label: "CONTACT", icon: "M4 4h16v16H4zM22 6l-10 7L2 6" },
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
              className="fixed inset-0 z-[999] bg-navy-deeper/70 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              id="mobile-nav-drawer"
              className="fixed inset-y-0 right-0 z-[1000] flex w-4/5 max-w-xs flex-col bg-beige-light shadow-2xl md:hidden"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 38 }}
            >
              <div className="flex shrink-0 justify-end px-5 pt-5">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fermer le menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-navy/50 transition-colors hover:bg-navy/10 hover:text-navy"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Middle region grows to fill all space, so the footer always sits at the bottom
                  and the nav stays vertically centered — independent of viewport height. */}
              <div className="flex flex-1 flex-col overflow-y-auto">
                {showProfile && (
                  <div className="flex shrink-0 flex-col items-center gap-2 px-6 pb-2 pt-1 text-center">
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gold font-mono text-lg font-bold text-navy-deeper">
                      {initials(displayName ?? email ?? "?")}
                    </span>
                    <span className="max-w-full truncate font-body text-base font-bold text-navy">{displayName ?? "Mon compte"}</span>
                    <span className="max-w-full truncate font-mono text-xs text-navy/50">{subLabel}</span>
                  </div>
                )}

                <nav className="flex flex-1 flex-col items-center justify-center gap-7 px-6 py-6" aria-label="Navigation principale">
                  {NAV_LINKS.map((item) => {
                    const active = item.href === "/"
                      ? pathname === "/"
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 font-body text-base font-bold transition-colors ${
                          active ? "text-gold-dark" : "text-navy hover:text-gold-dark"
                        }`}
                      >
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d={item.icon} />
                        </svg>
                        {item.label}
                      </Link>
                    );
                  })}

                  {showProfile && menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="font-body text-base font-bold text-navy hover:text-gold-dark"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Réutilise les boutons du site (.btn) pour rester cohérent avec le hero.
                  `env(safe-area-inset-bottom)` : le drawer est `fixed inset-y-0`, donc son bas
                  tombe derrière la barre du navigateur / home indicator sur mobile. */}
              <div
                className="shrink-0 px-8 pt-8"
                style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10rem)" }}
              >
                {showProfile ? (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="btn btn--outline"
                    >
                      Se déconnecter
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <Link href="/inscription" className="btn btn--primary">
                      S&apos;inscrire
                    </Link>
                    <Link href="/connexion" className="btn btn--outline">
                      Se connecter
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
