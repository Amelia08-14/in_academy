"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

export default function Header() {
  const pathname = usePathname();

  return (
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
            <Link
              href="/"
              className={`header__nav-link${pathname === "/" ? " header__nav-link--active" : ""}`}
            >
              ACCUEIL
            </Link>
            <Link
              href="/branches"
              className={`header__nav-link${pathname === "/branches" ? " header__nav-link--active" : ""}`}
            >
              BRANCHES
            </Link>
            <Link
              href="/formations"
              className={`header__nav-link${pathname === "/formations" ? " header__nav-link--active" : ""}`}
            >
              FORMATIONS
            </Link>
          </nav>
        </div>

        {/* CTA Button */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Link href="/inscrire" className="header__cta-btn">
            S&apos;INSCRIRE
            <span className="header__cta-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </span>
          </Link>
        </motion.div>

        {/* Mobile Toggle */}
        <button
          className="header__menu-toggle"
          id="menu-toggle"
          aria-label="Ouvrir le menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </motion.header>
  );
}
