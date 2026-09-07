"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { fileUrl } from "@/lib/fileUrl";
import { ACTIVITY_DOMAINS, ACTIVITY_DOMAIN_OTHER } from "@/lib/activityDomains";
import { type Account, type EventItem, type RegistrantType, formatEventDate } from "@/lib/events";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function defaultFullName(account: Account | null): string {
  if (account?.learnerProfile) return `${account.learnerProfile.firstName} ${account.learnerProfile.lastName}`;
  if (account?.companyAdmin) return `${account.companyAdmin.firstName ?? ""} ${account.companyAdmin.lastName ?? ""}`.trim();
  return "";
}

export default function EventRegisterModal({
  event, account, onClose, onRegistered,
}: {
  event: EventItem;
  account: Account | null;
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [registrantType, setRegistrantType] = useState<RegistrantType>(account?.companyAdmin ? "COMPANY" : "INDIVIDUAL");
  const [fullName, setFullName] = useState(defaultFullName(account));
  const [email, setEmail] = useState(account?.email ?? "");
  const [phone, setPhone] = useState(account?.learnerProfile?.phone ?? "");
  const [companyName, setCompanyName] = useState(account?.companyAdmin?.company.raisonSociale ?? "");
  const [jobTitle, setJobTitle] = useState(account?.learnerProfile?.jobTitle ?? "");
  const [activityDomain, setActivityDomain] = useState("");
  const [activityDomainOther, setActivityDomainOther] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const token = account ? localStorage.getItem("token") : null;
      const res = await fetch(`${API}/events/${event.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          fullName, email, phone,
          registrantType,
          companyName: registrantType === "COMPANY" ? companyName : undefined,
          jobTitle,
          activityDomain: activityDomain === ACTIVITY_DOMAIN_OTHER ? activityDomainOther : activityDomain,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const firstFieldError = data.errors ? Object.values(data.errors).flat()[0] : null;
        setError(data.error ?? (firstFieldError as string) ?? "Erreur lors de l'inscription.");
        return;
      }
      setSuccess(true);
      onRegistered();
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setPending(false);
    }
  };

  const hero = event.photos[0] ?? null;

  const modal = (
    <div className="event-register-overlay" onClick={onClose}>
      <div className={`event-register-card${hero ? " event-register-card--with-visual" : ""}`} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="event-register-card__close" onClick={onClose} aria-label="Fermer">✕</button>

        {hero && (
          <div className="event-register-card__visual">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileUrl(hero.photoUrl)} alt="" />
            <div className="event-register-card__scrim" />
            <div className="event-register-card__visual-content">
              <span className="event-register-card__badge">Invitation</span>
              <h3>{event.title}</h3>
              <p>{formatEventDate(event.eventDate)}{event.location ? ` · ${event.location}` : ""}</p>
            </div>
          </div>
        )}

        <div className="event-register-card__panel">
          {success ? (
            <div className="event-register-card__success">
              <div className="auth-success-icon">✓</div>
              <h3>Inscription envoyée</h3>
              <p>Votre inscription à « {event.title} » a bien été reçue. Vous recevrez un email dès qu&apos;elle sera validée par notre équipe.</p>
            </div>
          ) : (
            <>
              {!hero && (
                <>
                  <span className="event-register-card__eyebrow">Invitation</span>
                  <h3 className="event-register-card__title">{event.title}</h3>
                  <p className="event-register-card__meta">
                    {formatEventDate(event.eventDate)}{event.location ? ` · ${event.location}` : ""}
                  </p>
                </>
              )}

              <div className="auth-tabs" role="tablist" aria-label="Type de profil" style={{ marginBottom: 16 }}>
                <button
                  type="button" role="tab" aria-selected={registrantType === "INDIVIDUAL"}
                  className={`auth-tab${registrantType === "INDIVIDUAL" ? " auth-tab--active" : ""}`}
                  onClick={() => setRegistrantType("INDIVIDUAL")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  Particulier
                </button>
                <button
                  type="button" role="tab" aria-selected={registrantType === "COMPANY"}
                  className={`auth-tab${registrantType === "COMPANY" ? " auth-tab--active" : ""}`}
                  onClick={() => setRegistrantType("COMPANY")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M6 21V7l6-4 6 4v14M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1" />
                  </svg>
                  Entreprise
                </button>
              </div>

              {error && <div className="auth-error" style={{ marginBottom: 8 }}>{error}</div>}

              <form onSubmit={submit} className="event-register-card__form">
                <div className="auth-field">
                  <label className="auth-label">Nom complet</label>
                  <input
                    type="text" className="auth-input" required
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    placeholder="Votre nom et prénom"
                  />
                </div>
                <div className="auth-row">
                  <div className="auth-field">
                    <label className="auth-label">Email</label>
                    <input
                      type="email" className="auth-input" required
                      value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="vous@exemple.com"
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Téléphone</label>
                    <input
                      type="tel" className="auth-input" required
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+213 XX XX XX XX"
                    />
                  </div>
                </div>

                {registrantType === "COMPANY" && (
                  <div className="auth-field">
                    <label className="auth-label">Nom de l&apos;entreprise</label>
                    <input
                      type="text" className="auth-input" required
                      value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Raison sociale"
                    />
                  </div>
                )}

                <div className="auth-row">
                  <div className="auth-field">
                    <label className="auth-label">Fonction</label>
                    <input
                      type="text" className="auth-input" required
                      value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Ex : Responsable RH"
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Domaine d&apos;activité</label>
                    <select
                      className="auth-input auth-select" required
                      value={activityDomain}
                      onChange={(e) => setActivityDomain(e.target.value)}
                    >
                      <option value="" disabled>Sélectionnez…</option>
                      {ACTIVITY_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                      <option value={ACTIVITY_DOMAIN_OTHER}>{ACTIVITY_DOMAIN_OTHER}</option>
                    </select>
                  </div>
                </div>

                {activityDomain === ACTIVITY_DOMAIN_OTHER && (
                  <div className="auth-field">
                    <label className="auth-label">Précisez le domaine</label>
                    <input
                      type="text" className="auth-input" required
                      value={activityDomainOther} onChange={(e) => setActivityDomainOther(e.target.value)}
                      placeholder="Votre domaine d'activité"
                    />
                  </div>
                )}

                <button type="submit" className="btn btn--primary event-register-card__submit" disabled={pending}>
                  {pending ? "Envoi…" : "Confirmer ma place"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // Portail vers <body> : le modal doit rester un vrai overlay plein écran, jamais
  // contraint par un ancêtre transformé (ex. .event-card:hover applique un translateY,
  // ce qui redéfinit le containing block d'un `position: fixed` descendant).
  if (typeof document === "undefined") return null;
  return createPortal(modal, document.body);
}
