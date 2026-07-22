"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../hooks/useAuth";
import { useQuoteCart } from "../hooks/useQuoteCart";

// Bouton flottant « Mon devis (n) » — visible pour une entreprise dès qu'elle a
// des formations dans son panier (tâche 7). Masqué sur la page panier et l'admin.
export default function QuoteCartFab() {
  const pathname = usePathname();
  const { role } = useAuth();
  const cart = useQuoteCart();

  if (role !== "COMPANY_ADMIN") return null;
  if (cart.count === 0) return null;
  if (pathname === "/devis-panier" || pathname.startsWith("/admin")) return null;

  return (
    <Link href="/devis-panier" className="quote-fab" aria-label="Voir mon devis">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      Mon devis
      <span className="quote-fab__count">{cart.count}</span>
    </Link>
  );
}
