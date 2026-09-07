"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { fileUrl } from "@/lib/fileUrl";
import { TRAINING_DOMAINS } from "@/lib/trainingDomains";
import { type Account, type EventItem, formatEventDate } from "@/lib/events";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export default function EventRegisterModal({
  event, account, onClose, onRegistered,
}: {
  event: EventItem;
  account: Account | null;
  onClose: () => void;
  onRegistered: () => void;
}) {
  const [fullName, setFullName] = useState(
    account?.learnerProfile ? `${account.learnerProfile.firstName} ${account.learnerProfile.lastName}` : ""
  );
  const [email, setEmail] = useState(account?.email ?? "");
  const [phone, setPhone] = useState(account?.learnerProfile?.phone ?? "");
  const [jobTitle, setJobTitle] = useState(account?.learnerProfile?.jobTitle ?? "");
  const [trainingDomain, setTrainingDomain] = useState("");
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
        body: JSON.stringify({ fullName, email, phone: phone || undefined, jobTitle: jobTitle || undefined, trainingDomain: trainingDomain || undefined }),
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
              <p className="event-register-card__prompt">
                {account ? "Vos coordonnées (reprises de votre profil) :" : "Vos coordonnées pour valider votre place :"}
              </p>

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
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <input
                    type="email" className="auth-input" required
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com"
                  />
                </div>
                <div className="auth-row">
                  <div className="auth-field">
                    <label className="auth-label">Téléphone (facultatif)</label>
                    <input
                      type="tel" className="auth-input"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      placeholder="+213 XX XX XX XX"
                    />
                  </div>
                  <div className="auth-field">
                    <label className="auth-label">Fonction (facultatif)</label>
                    <input
                      type="text" className="auth-input"
                      value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Ex : Responsable RH"
                    />
                  </div>
                </div>
                <div className="auth-field">
                  <label className="auth-label">Domaine de formation qui vous intéresse (facultatif)</label>
                  <select
                    className="auth-input auth-select"
                    value={trainingDomain}
                    onChange={(e) => setTrainingDomain(e.target.value)}
                  >
                    <option value="">Non précisé</option>
                    {TRAINING_DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
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
