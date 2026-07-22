"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import { useQuoteCart } from "../hooks/useQuoteCart";
import { api } from "@/lib/api";

export default function DevisPanierPage() {
  const router = useRouter();
  const { role, isAuthenticated, ready } = useAuth();
  const cart = useQuoteCart();
  const [message, setMessage] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async () => {
    setState("sending");
    setError("");
    try {
      await api.post("/companies/quotes", {
        message: message || undefined,
        items: cart.items.map((i) => ({ formationId: i.formationId, participants: i.participants })),
      });
      cart.clear();
      setState("done");
    } catch (e) {
      setState("error");
      setError(e instanceof Error ? e.message : "Erreur lors de l'envoi du devis.");
    }
  };

  return (
    <>
      <Header />
      <section className="bd-page">
        <div className="container" style={{ maxWidth: 820 }}>
          <h1 className="branches-page-hero__title" style={{ color: "var(--navy)", fontSize: "clamp(28px,4vw,44px)", marginBottom: 8 }}>
            Mon devis
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>
            Ajustez le nombre d&apos;employés par formation, ajoutez un message, puis envoyez votre demande de devis.
          </p>

          {ready && (!isAuthenticated || role !== "COMPANY_ADMIN") && (
            <div className="catalogue__notice" style={{ marginBottom: 24 }}>
              <span>La demande de devis est réservée aux comptes entreprise.</span>
              <div className="catalogue__notice-actions">
                <Link href="/connexion?redirect=/devis-panier" className="btn btn--outline">Se connecter</Link>
                <Link href="/inscription-entreprise" className="btn btn--primary">Compte entreprise</Link>
              </div>
            </div>
          )}

          {state === "done" ? (
            <div className="catalogue__empty">
              <p>✓ Votre demande de devis a bien été envoyée. Notre équipe reviendra vers vous rapidement.</p>
              <Link href="/espace-entreprise?tab=devis" className="btn btn--primary" style={{ marginTop: 16 }}>
                Voir mes devis
              </Link>
            </div>
          ) : cart.items.length === 0 ? (
            <div className="catalogue__empty">
              <p>Votre devis est vide.</p>
              <Link href="/branches" className="btn btn--outline" style={{ marginTop: 16 }}>Parcourir les formations</Link>
            </div>
          ) : (
            <>
              <div className="quote-cart__list">
                {cart.items.map((i) => (
                  <div className="quote-cart__item" key={i.formationId}>
                    <span className="quote-cart__title">{i.title}</span>
                    <div className="quote-cart__controls">
                      <label className="quote-cart__label">Employés</label>
                      <input
                        type="number" min={1} className="auth-input quote-cart__qty"
                        value={i.participants}
                        onChange={(e) => cart.setParticipants(i.formationId, Math.max(1, Number(e.target.value) || 1))}
                      />
                      <button type="button" className="quote-cart__remove" onClick={() => cart.remove(i.formationId)} aria-label="Retirer">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="auth-field" style={{ marginTop: 20 }}>
                <label className="auth-label">Message (optionnel)</label>
                <textarea
                  className="auth-input" rows={4}
                  value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Précisez vos besoins, dates souhaitées, contraintes…"
                />
              </div>

              {error && <div className="auth-error" style={{ marginTop: 12 }}>{error}</div>}

              <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                <button
                  type="button" className="btn btn--primary"
                  disabled={state === "sending" || !isAuthenticated || role !== "COMPANY_ADMIN"}
                  onClick={submit}
                >
                  {state === "sending" ? "Envoi…" : `Envoyer le devis (${cart.items.length} formation${cart.items.length > 1 ? "s" : ""})`}
                </button>
                <button type="button" className="btn btn--outline" onClick={() => { cart.clear(); router.push("/branches"); }}>
                  Vider le devis
                </button>
              </div>
            </>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
