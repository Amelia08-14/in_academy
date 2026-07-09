"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import { api } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
const STEPS = ["Entreprise", "Compte admin", "Confirmation"];

const WILAYAS = [
  "Adrar","Chlef","Laghouat","Oum El Bouaghi","Batna","Béjaïa","Biskra","Béchar","Blida",
  "Bouira","Tamanrasset","Tébessa","Tlemcen","Tiaret","Tizi Ouzou","Alger","Djelfa","Jijel",
  "Sétif","Saïda","Skikda","Sidi Bel Abbès","Annaba","Guelma","Constantine","Médéa",
  "Mostaganem","M'Sila","Mascara","Ouargla","Oran","El Bayadh","Illizi","Bordj Bou Arréridj",
  "Boumerdès","El Tarf","Tindouf","Tissemsilt","El Oued","Khenchela","Souk Ahras","Tipaza",
  "Mila","Aïn Defla","Naâma","Aïn Témouchent","Ghardaïa","Relizane",
];

const ACTIVITY_OTHER = "AUTRE";

interface Category { id: string; name: string }

type Values = {
  raisonSociale: string; wilaya: string; commune: string; phone: string;
  activityCategoryId: string; activityOther: string;
  adminEmail: string; adminPassword: string;
  adminFirstName: string; adminLastName: string;
};
const EMPTY: Values = {
  raisonSociale: "", wilaya: "", commune: "", phone: "",
  activityCategoryId: "", activityOther: "",
  adminEmail: "", adminPassword: "", adminFirstName: "", adminLastName: "",
};

type Errors = Partial<Record<keyof Values, string>>;

export default function InscriptionEntreprisePage() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    api.get<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  const set = (field: keyof Values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }));
      setErrors((er) => ({ ...er, [field]: undefined }));
    };

  const validateStep0 = () => {
    const errs: Errors = {};
    if (values.raisonSociale.trim().length < 2) errs.raisonSociale = "Raison sociale requise";
    if (!values.wilaya) errs.wilaya = "Wilaya requise";
    if (values.commune.trim().length < 2) errs.commune = "Commune requise";
    if (!values.phone.trim()) errs.phone = "Téléphone requis";
    if (!values.activityCategoryId) errs.activityCategoryId = "Activité professionnelle requise";
    if (values.activityCategoryId === ACTIVITY_OTHER && !values.activityOther.trim()) {
      errs.activityOther = "Précisez votre activité";
    }
    if (!values.adminEmail || !/\S+@\S+\.\S+/.test(values.adminEmail)) errs.adminEmail = "Email invalide";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep1 = () => {
    const errs: Errors = {};
    if (values.adminFirstName.trim().length < 2) errs.adminFirstName = "Prénom requis";
    if (values.adminLastName.trim().length < 2) errs.adminLastName = "Nom requis";
    if (values.adminPassword.length < 8) errs.adminPassword = "Minimum 8 caractères";
    else if (!/[A-Z]/.test(values.adminPassword)) errs.adminPassword = "Au moins une majuscule";
    else if (!/[0-9]/.test(values.adminPassword)) errs.adminPassword = "Au moins un chiffre";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    setPending(true);
    setServerError("");
    try {
      const payload = {
        raisonSociale: values.raisonSociale,
        wilaya: values.wilaya,
        commune: values.commune,
        phone: values.phone,
        activityCategoryId: values.activityCategoryId === ACTIVITY_OTHER ? undefined : values.activityCategoryId,
        activityOther: values.activityCategoryId === ACTIVITY_OTHER ? values.activityOther : undefined,
        adminEmail: values.adminEmail,
        adminPassword: values.adminPassword,
        adminFirstName: values.adminFirstName,
        adminLastName: values.adminLastName,
      };
      const res = await fetch(`${API}/companies/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) {
          const flat: Errors = {};
          for (const [k, v] of Object.entries(data.errors)) flat[k as keyof Values] = (v as string[])[0];
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

  const selectedCategoryName = categories.find((c) => c.id === values.activityCategoryId)?.name;

  if (success) {
    return (
      <>
        <Header />
        <div className="auth-page">
          <div className="auth-card auth-card--success">
            <div className="auth-success-icon">✓</div>
            <h2 className="auth-card__title">Bienvenue chez IN ACADEMY !</h2>
            <p className="auth-card__sub">
              Votre compte entreprise est actif. Vous pouvez vous connecter dès
              maintenant pour accéder au catalogue et demander vos devis.
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
          <div className="auth-type-badge auth-type-badge--entreprise">
            Compte Entreprise B2B
          </div>
          <h1 className="auth-card__title">Ouvrir un compte entreprise</h1>
          <p className="auth-card__sub">
            Accédez aux formations B2B, demandez des devis et gérez vos équipes
          </p>

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

          {/* ── Étape 0 : identité entreprise ── */}
          {step === 0 && (
            <form onSubmit={(e) => { e.preventDefault(); if (validateStep0()) setStep(1); }} className="auth-form" noValidate>
              <div className="auth-field">
                <label htmlFor="raisonSociale" className="auth-label">Raison sociale *</label>
                <input
                  id="raisonSociale" type="text" placeholder="Nom légal de l'entreprise"
                  className={`auth-input${errors.raisonSociale ? " auth-input--error" : ""}`}
                  value={values.raisonSociale} onChange={set("raisonSociale")} required
                />
                {errors.raisonSociale && <span className="auth-field-error">{errors.raisonSociale}</span>}
              </div>

              <div className="auth-row">
                <div className="auth-field">
                  <label htmlFor="wilaya" className="auth-label">Wilaya *</label>
                  <select
                    id="wilaya" className={`auth-input auth-select${errors.wilaya ? " auth-input--error" : ""}`}
                    value={values.wilaya} onChange={set("wilaya")} required
                  >
                    <option value="">Sélectionner…</option>
                    {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                  {errors.wilaya && <span className="auth-field-error">{errors.wilaya}</span>}
                </div>
                <div className="auth-field">
                  <label htmlFor="commune" className="auth-label">Commune *</label>
                  <input
                    id="commune" type="text" placeholder="Commune"
                    className={`auth-input${errors.commune ? " auth-input--error" : ""}`}
                    value={values.commune} onChange={set("commune")} required
                  />
                  {errors.commune && <span className="auth-field-error">{errors.commune}</span>}
                </div>
              </div>

              <div className="auth-row">
                <div className="auth-field">
                  <label htmlFor="phone" className="auth-label">Téléphone *</label>
                  <input
                    id="phone" type="tel" placeholder="+213 XXX XXX XXX"
                    className={`auth-input${errors.phone ? " auth-input--error" : ""}`}
                    value={values.phone} onChange={set("phone")} required
                  />
                  {errors.phone && <span className="auth-field-error">{errors.phone}</span>}
                </div>
                <div className="auth-field">
                  <label htmlFor="adminEmail" className="auth-label">Email *</label>
                  <input
                    id="adminEmail" type="email" autoComplete="email" placeholder="contact@entreprise.dz"
                    className={`auth-input${errors.adminEmail ? " auth-input--error" : ""}`}
                    value={values.adminEmail} onChange={set("adminEmail")} required
                  />
                  {errors.adminEmail && <span className="auth-field-error">{errors.adminEmail}</span>}
                  <span className="auth-field-hint">Cet email servira aussi à vous connecter</span>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="activityCategoryId" className="auth-label">Activité professionnelle *</label>
                <select
                  id="activityCategoryId" className={`auth-input auth-select${errors.activityCategoryId ? " auth-input--error" : ""}`}
                  value={values.activityCategoryId} onChange={set("activityCategoryId")} required
                >
                  <option value="">Sélectionner…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  <option value={ACTIVITY_OTHER}>Autre</option>
                </select>
                {errors.activityCategoryId && <span className="auth-field-error">{errors.activityCategoryId}</span>}
              </div>

              {values.activityCategoryId === ACTIVITY_OTHER && (
                <div className="auth-field">
                  <label htmlFor="activityOther" className="auth-label">Précisez votre activité *</label>
                  <input
                    id="activityOther" type="text" placeholder="Votre secteur d'activité"
                    className={`auth-input${errors.activityOther ? " auth-input--error" : ""}`}
                    value={values.activityOther} onChange={set("activityOther")} required
                  />
                  {errors.activityOther && <span className="auth-field-error">{errors.activityOther}</span>}
                </div>
              )}

              <button type="submit" className="btn btn--primary auth-submit">Continuer →</button>
            </form>
          )}

          {/* ── Étape 1 : compte administrateur entreprise ── */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); if (validateStep1()) setStep(2); }} className="auth-form" noValidate>
              <p className="auth-section-hint">
                Ces informations identifient le responsable du compte entreprise IN ACADEMY.
              </p>
              <div className="auth-row">
                <div className="auth-field">
                  <label htmlFor="adminFirstName" className="auth-label">Prénom responsable *</label>
                  <input
                    id="adminFirstName" type="text" autoComplete="given-name" placeholder="Prénom"
                    className={`auth-input${errors.adminFirstName ? " auth-input--error" : ""}`}
                    value={values.adminFirstName} onChange={set("adminFirstName")} required
                  />
                  {errors.adminFirstName && <span className="auth-field-error">{errors.adminFirstName}</span>}
                </div>
                <div className="auth-field">
                  <label htmlFor="adminLastName" className="auth-label">Nom responsable *</label>
                  <input
                    id="adminLastName" type="text" autoComplete="family-name" placeholder="Nom"
                    className={`auth-input${errors.adminLastName ? " auth-input--error" : ""}`}
                    value={values.adminLastName} onChange={set("adminLastName")} required
                  />
                  {errors.adminLastName && <span className="auth-field-error">{errors.adminLastName}</span>}
                </div>
              </div>
              <div className="auth-field">
                <label htmlFor="adminPassword" className="auth-label">Mot de passe *</label>
                <input
                  id="adminPassword" type="password" autoComplete="new-password"
                  placeholder="8 caractères min, 1 majuscule, 1 chiffre"
                  className={`auth-input${errors.adminPassword ? " auth-input--error" : ""}`}
                  value={values.adminPassword} onChange={set("adminPassword")} required minLength={8}
                />
                {errors.adminPassword && <span className="auth-field-error">{errors.adminPassword}</span>}
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
                <p className="auth-confirm-intro">Vérifiez vos informations avant de soumettre :</p>
                <ul className="auth-confirm-list">
                  <li><span>Entreprise</span><strong>{values.raisonSociale}</strong></li>
                  <li><span>Wilaya</span><strong>{values.wilaya}</strong></li>
                  <li><span>Commune</span><strong>{values.commune}</strong></li>
                  <li><span>Téléphone</span><strong>{values.phone}</strong></li>
                  <li><span>Activité</span><strong>{values.activityCategoryId === ACTIVITY_OTHER ? values.activityOther : selectedCategoryName}</strong></li>
                  <li><span>Responsable</span><strong>{values.adminFirstName} {values.adminLastName}</strong></li>
                  <li><span>Email (connexion)</span><strong>{values.adminEmail}</strong></li>
                </ul>
              </div>
              <div className="auth-form-actions">
                <button type="button" className="btn btn--outline" onClick={() => setStep(1)}>← Modifier</button>
                <button
                  type="button" className="btn btn--primary auth-submit"
                  disabled={pending} onClick={handleSubmit}
                >
                  {pending ? "Envoi en cours…" : "Créer mon compte entreprise"}
                </button>
              </div>
            </div>
          )}

          <p className="auth-footer-link">
            Particulier ? <Link href="/inscription">Inscription individuelle</Link>
            {" · "}
            Déjà inscrit ? <Link href="/connexion">Se connecter</Link>
          </p>
        </div>
      </div>
    </>
  );
}
