"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'envoi.");
        return;
      }
      // Réponse volontairement générique côté serveur (compte trouvé ou non) :
      // on affiche toujours ce même message, quel que soit le résultat réel.
      setSent(true);
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Header />
      <div className="auth-page">
        <div className="auth-card">
          {sent ? (
            <>
              <div className="auth-success-icon">✓</div>
              <h1 className="auth-card__title">Email envoyé</h1>
              <p className="auth-card__sub">
                Si un compte existe avec l&apos;adresse <strong>{email}</strong>, un lien de
                réinitialisation vient de lui être envoyé. Pensez à vérifier vos spams.
              </p>
              <div className="auth-footer-links">
                <p className="auth-footer-link">
                  <Link href="/connexion">Retour à la connexion</Link>
                </p>
              </div>
            </>
          ) : (
            <>
              <h1 className="auth-card__title">Mot de passe oublié</h1>
              <p className="auth-card__sub">
                Indiquez votre adresse email : nous vous enverrons un lien pour choisir un nouveau mot de passe.
              </p>

              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                <div className="auth-field">
                  <label htmlFor="email" className="auth-label">Adresse email</label>
                  <input
                    id="email" name="email" type="email" autoComplete="email" required
                    placeholder="vous@exemple.com"
                    className="auth-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn--primary auth-submit" disabled={pending}>
                  {pending ? "Envoi…" : "Envoyer le lien de réinitialisation"}
                </button>
              </form>

              <div className="auth-footer-links">
                <p className="auth-footer-link">
                  <Link href="/connexion">Retour à la connexion</Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
