"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const STEPS = ["Compte", "Profil", "Confirmation"];

type FieldValues = {
  email: string; password: string;
  firstName: string; lastName: string; phone: string; jobTitle: string;
};
const EMPTY: FieldValues = { email: "", password: "", firstName: "", lastName: "", phone: "", jobTitle: "" };

export default function InscriptionPage() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FieldValues>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FieldValues, string>>>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: keyof FieldValues) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      setErrors((er) => ({ ...er, [field]: undefined }));
    };

  const validateStep0 = () => {
    const errs: typeof errors = {};
    if (!values.email || !/\S+@\S+\.\S+/.test(values.email)) errs.email = "Email invalide";
    if (values.password.length < 8) errs.password = "Minimum 8 caractères";
    else if (!/[A-Z]/.test(values.password)) errs.password = "Au moins une majuscule";
    else if (!/[0-9]/.test(values.password)) errs.password = "Au moins un chiffre";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep1 = () => {
    const errs: typeof errors = {};
    if (values.firstName.trim().length < 2) errs.firstName = "Prénom requis (2 caractères min)";
    if (values.lastName.trim().length < 2) errs.lastName = "Nom requis (2 caractères min)";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setPending(true);
    setServerError("");
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          const flat: typeof errors = {};
          for (const [k, v] of Object.entries(data.errors)) flat[k as keyof FieldValues] = (v as string[])[0];
          setErrors(flat);
          setStep(0);
        } else {
          setServerError(data.error ?? "Erreur lors de l'inscription");
        }
        return;
      }
      setSuccess(true);
    } catch {
      setServerError("Impossible de joindre le serveur.");
    } finally {
      setPending(false);
    }
  };

  if (success) {
    return (
      <>
        <Header />
        <div className="auth-page">
          <div className="auth-card auth-card--success">
            <div className="auth-success-icon">✓</div>
            <h2 className="auth-card__title">Inscription réussie !</h2>
            <p className="auth-card__sub">
              Votre compte particulier a été créé. Un administrateur validera votre dossier
              sous 24–48h. Vous recevrez une confirmation par email.
            </p>
            <Link href="/connexion" className="btn btn--primary" style={{ marginTop: "1.5rem" }}>
              Se connecter
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="auth-page">
        <div className="auth-card auth-card--wide">
          <div className="auth-type-badge auth-type-badge--particulier">
            Compte Particulier
          </div>
          <h1 className="auth-card__title">Créer un compte</h1>

          {/* Stepper */}
          <div className="auth-stepper">
            {STEPS.map((label, i) => (
              <div key={i} className={`auth-step${i === step ? " auth-step--active" : i < step ? " auth-step--done" : ""}`}>
                <span className="auth-step__dot">{i < step ? "✓" : i + 1}</span>
                <span className="auth-step__label">{label}</span>
              </div>
            ))}
          </div>

          {serverError && <div className="auth-error">{serverError}</div>}

          {/* ── Étape 0 : identifiants ── */}
          {step === 0 && (
            <form onSubmit={(e) => { e.preventDefault(); if (validateStep0()) setStep(1); }} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor="email" className="auth-label">Adresse email *</label>
                <input
                  id="email" type="email" autoComplete="email" placeholder="vous@exemple.com"
                  className={`auth-input${errors.email ? " auth-input--error" : ""}`}
                  value={values.email} onChange={set("email")} required
                />
                {errors.email && <span className="auth-field-error">{errors.email}</span>}
              </div>
              <div className="auth-field">
                <label htmlFor="password" className="auth-label">Mot de passe *</label>
                <input
                  id="password" type="password" autoComplete="new-password"
                  placeholder="8 caractères min, 1 majuscule, 1 chiffre"
                  className={`auth-input${errors.password ? " auth-input--error" : ""}`}
                  value={values.password} onChange={set("password")} required
                />
                {errors.password && <span className="auth-field-error">{errors.password}</span>}
              </div>
              <button type="submit" className="btn btn--primary auth-submit">Continuer →</button>
            </form>
          )}

          {/* ── Étape 1 : profil ── */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); if (validateStep1()) setStep(2); }} className="auth-form" noValidate>
              <div className="auth-row">
                <div className="auth-field">
                  <label htmlFor="firstName" className="auth-label">Prénom *</label>
                  <input
                    id="firstName" type="text" autoComplete="given-name" placeholder="Prénom"
                    className={`auth-input${errors.firstName ? " auth-input--error" : ""}`}
                    value={values.firstName} onChange={set("firstName")} required
                  />
                  {errors.firstName && <span className="auth-field-error">{errors.firstName}</span>}
                </div>
                <div className="auth-field">
                  <label htmlFor="lastName" className="auth-label">Nom *</label>
                  <input
                    id="lastName" type="text" autoComplete="family-name" placeholder="Nom"
                    className={`auth-input${errors.lastName ? " auth-input--error" : ""}`}
                    value={values.lastName} onChange={set("lastName")} required
                  />
                  {errors.lastName && <span className="auth-field-error">{errors.lastName}</span>}
                </div>
              </div>
              <div className="auth-field">
                <label htmlFor="phone" className="auth-label">Téléphone</label>
                <input
                  id="phone" type="tel" autoComplete="tel" placeholder="+213 XXX XXX XXX"
                  className="auth-input" value={values.phone} onChange={set("phone")}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="jobTitle" className="auth-label">Poste / Fonction</label>
                <input
                  id="jobTitle" type="text" placeholder="Ex : DRH, Technicien, Gérant…"
                  className="auth-input" value={values.jobTitle} onChange={set("jobTitle")}
                />
              </div>
              <div className="auth-form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setStep(0)}>← Retour</button>
                <button type="submit" className="btn btn--primary">Continuer →</button>
              </div>
            </form>
          )}

          {/* ── Étape 2 : récapitulatif ── */}
          {step === 2 && (
            <div className="auth-form">
              <div className="auth-confirm-box">
                <p className="auth-confirm-intro">Vérifiez vos informations avant de valider :</p>
                <ul className="auth-confirm-list">
                  <li><span>Email</span><strong>{values.email}</strong></li>
                  <li><span>Prénom</span><strong>{values.firstName}</strong></li>
                  <li><span>Nom</span><strong>{values.lastName}</strong></li>
                  {values.phone && <li><span>Téléphone</span><strong>{values.phone}</strong></li>}
                  {values.jobTitle && <li><span>Fonction</span><strong>{values.jobTitle}</strong></li>}
                </ul>
              </div>
              <p className="auth-confirm-terms">
                En vous inscrivant, vous acceptez nos{" "}
                <Link href="/mentions-legales">conditions d&apos;utilisation</Link>.
              </p>
              <div className="auth-form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setStep(1)}>← Modifier</button>
                <button
                  type="button" className="btn btn--primary auth-submit"
                  disabled={pending} onClick={handleSubmit}
                >
                  {pending ? "Envoi en cours…" : "Confirmer l'inscription"}
                </button>
              </div>
            </div>
          )}

          <p className="auth-footer-link">
            Entreprise ? <Link href="/inscription-entreprise">Créer un compte entreprise</Link>
            {" · "}
            Déjà inscrit ? <Link href="/connexion">Se connecter</Link>
          </p>
        </div>
      </div>
    </>
  );
}
