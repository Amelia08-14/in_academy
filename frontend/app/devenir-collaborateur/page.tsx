"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import FileUpload from "../components/FileUpload";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface Fiche { url: string; name: string }

export default function DevenirCollaborateurPage() {
  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", phone: "", speciality: "", message: "" });
  const [cvUrl, setCvUrl] = useState<string | null>(null);
  const [fiches, setFiches] = useState<Fiche[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const set = (f: keyof typeof values) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setValues((v) => ({ ...v, [f]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const res = await fetch(`${API}/trainer-applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          cvUrl: cvUrl ?? undefined,
          fileUrls: fiches.map((f) => f.url),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur lors de l'envoi."); return; }
      setSuccess(true);
    } catch {
      setError("Impossible de joindre le serveur.");
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
            <h2 className="auth-card__title">Candidature envoyée !</h2>
            <p className="auth-card__sub">
              Merci pour votre intérêt. Notre équipe examinera votre profil et reviendra vers vous rapidement.
            </p>
            <Link href="/" className="btn btn--primary" style={{ marginTop: "1.5rem" }}>Retour à l&apos;accueil</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <section className="bd-page">
        <div className="container" style={{ maxWidth: 720 }}>
          <span className="section-eyebrow" style={{ color: "var(--gold-dark)" }}>Rejoignez-nous</span>
          <h1 className="branches-page-hero__title" style={{ color: "var(--navy)", fontSize: "clamp(28px,4vw,44px)", margin: "8px 0 8px" }}>
            Devenir collaborateur
          </h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 28 }}>
            Vous êtes formateur ou expert dans votre domaine ? Proposez vos formations à IN ACADEMY.
          </p>

          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={submit} className="auth-form auth-card auth-card--wide" style={{ maxWidth: "none" }}>
            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Prénom *</label>
                <input type="text" className="auth-input" required value={values.firstName} onChange={set("firstName")} />
              </div>
              <div className="auth-field">
                <label className="auth-label">Nom *</label>
                <input type="text" className="auth-input" required value={values.lastName} onChange={set("lastName")} />
              </div>
            </div>
            <div className="auth-row">
              <div className="auth-field">
                <label className="auth-label">Email *</label>
                <input type="email" className="auth-input" required value={values.email} onChange={set("email")} />
              </div>
              <div className="auth-field">
                <label className="auth-label">Téléphone</label>
                <input type="tel" className="auth-input" value={values.phone} onChange={set("phone")} placeholder="+213 XXX XXX XXX" />
              </div>
            </div>
            <div className="auth-field">
              <label className="auth-label">Spécialité / domaine</label>
              <input type="text" className="auth-input" value={values.speciality} onChange={set("speciality")} placeholder="Ex : Finance, HSE, Management…" />
            </div>
            <div className="auth-field">
              <label className="auth-label">Message</label>
              <textarea className="auth-input" rows={3} value={values.message} onChange={set("message")} placeholder="Présentez votre expérience et les formations que vous proposez." />
            </div>

            <FileUpload
              label="CV (1 fichier)"
              accept=".pdf,.doc,.docx"
              currentUrl={cvUrl}
              hint="Votre CV au format PDF de préférence."
              onUploaded={(url) => setCvUrl(url)}
              tokenStorageKey={null}
              uploadPath="/upload/trainer-application"
            />

            <div>
              <FileUpload
                label="Fiches techniques des formations (plusieurs fichiers)"
                accept=".pdf,.doc,.docx"
                hint="Ajoutez une fiche à la fois — elles s'empilent ci-dessous."
                onUploaded={(url, name) => setFiches((prev) => [...prev, { url, name }])}
                tokenStorageKey={null}
                uploadPath="/upload/trainer-application"
              />
              {fiches.length > 0 && (
                <ul className="collab-fiches">
                  {fiches.map((f, i) => (
                    <li key={i}>
                      <span>📄 {f.name}</span>
                      <button type="button" onClick={() => setFiches((prev) => prev.filter((_, j) => j !== i))} aria-label="Retirer">✕</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button type="submit" className="btn btn--primary auth-submit" disabled={pending}>
              {pending ? "Envoi…" : "Envoyer ma candidature"}
            </button>
          </form>
        </div>
      </section>
      <Footer />
    </>
  );
}
