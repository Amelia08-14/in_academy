"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function ReinitialiserMotDePasseForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); return; }
    if (!/[A-Z]/.test(password)) { setError("Le mot de passe doit contenir au moins une majuscule."); return; }
    if (!/[0-9]/.test(password)) { setError("Le mot de passe doit contenir au moins un chiffre."); return; }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }

    setPending(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la réinitialisation.");
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/connexion"), 2500);
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setPending(false);
    }
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1 className="auth-card__title">Lien invalide</h1>
          <p className="auth-card__sub">
            Ce lien de réinitialisation est incomplet ou invalide. Demandez-en un nouveau.
          </p>
          <div className="auth-footer-links">
            <p className="auth-footer-link">
              <Link href="/mot-de-passe-oublie">Demander un nouveau lien</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-success-icon">✓</div>
          <h1 className="auth-card__title">Mot de passe mis à jour</h1>
          <p className="auth-card__sub">Vous allez être redirigé vers la page de connexion…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-card__title">Choisir un nouveau mot de passe</h1>
        <p className="auth-card__sub">Ce lien n&apos;est valable qu&apos;une seule fois et expire au bout d&apos;1 heure.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label htmlFor="password" className="auth-label">Nouveau mot de passe</label>
            <input
              id="password" type="password" autoComplete="new-password" required
              placeholder="8 caractères minimum"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="auth-field">
            <label htmlFor="confirm" className="auth-label">Confirmer le mot de passe</label>
            <input
              id="confirm" type="password" autoComplete="new-password" required
              placeholder="••••••••"
              className="auth-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn--primary auth-submit" disabled={pending}>
            {pending ? "Enregistrement…" : "Réinitialiser le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ReinitialiserMotDePassePage() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="auth-page">Chargement…</div>}>
        <ReinitialiserMotDePasseForm />
      </Suspense>
    </>
  );
}
