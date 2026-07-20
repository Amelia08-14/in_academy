"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Onglets de choix du type d'inscription (Particulier / Entreprise).
// Chaque onglet navigue vers sa page en conservant le paramètre ?redirect.
// On lit le paramètre via window pour rester utilisable sans Suspense.
export default function AuthTabs({ active }: { active: "particulier" | "entreprise" }) {
  const [suffix, setSuffix] = useState("");

  useEffect(() => {
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    setSuffix(redirect ? `?redirect=${encodeURIComponent(redirect)}` : "");
  }, []);

  return (
    <div className="auth-tabs" role="tablist" aria-label="Type d'inscription">
      <Link
        href={`/inscription${suffix}`}
        role="tab"
        aria-selected={active === "particulier"}
        className={`auth-tab${active === "particulier" ? " auth-tab--active" : ""}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
        Particulier
      </Link>
      <Link
        href={`/inscription-entreprise${suffix}`}
        role="tab"
        aria-selected={active === "entreprise"}
        className={`auth-tab${active === "entreprise" ? " auth-tab--active" : ""}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
        </svg>
        Entreprise
      </Link>
    </div>
  );
}
