"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "./Header";
import Footer from "./Footer";
import PartnersStrip from "./PartnersStrip";
import DescriptionBlock from "./DescriptionBlock";
import { useAuth } from "../hooks/useAuth";
import { api } from "@/lib/api";
import { branchImage } from "@/lib/branchImages";
import { fileUrl } from "@/lib/fileUrl";
import { formatDurationDays, formatPrice } from "@/lib/format";
import { EDUCATION_LEVELS, type PublicSession } from "@/lib/sessions";
import type { Account } from "@/lib/events";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

type Lang = "fr" | "ar";

function RegisterCard({ session, onDone }: { session: PublicSession; onDone: () => void }) {
  const { isAuthenticated } = useAuth();
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Connecté : on reprend les coordonnées du profil (modifiables) — pas de ressaisie.
  useEffect(() => {
    if (!isAuthenticated) return;
    api.get<Account>("/auth/me").then((acc) => {
      const p = acc.learnerProfile ?? acc.companyAdmin;
      setEmail((v) => v || acc.email);
      if (p) {
        setFirstName((v) => v || (p.firstName ?? ""));
        setLastName((v) => v || (p.lastName ?? ""));
      }
      if (acc.learnerProfile?.phone) setPhone((v) => v || acc.learnerProfile!.phone!);
    }).catch(() => {});
  }, [isAuthenticated]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError("");
    try {
      const token = isAuthenticated ? localStorage.getItem("token") : null;
      const res = await fetch(`${API}/sessions/${session.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ lastName, firstName, email, phone, educationLevel }),
      });
      const data = await res.json();
      if (!res.ok) {
        const firstFieldError = data.errors ? Object.values(data.errors).flat()[0] : null;
        setError(data.error ?? (firstFieldError as string) ?? "Erreur lors de l'inscription.");
        return;
      }
      setSuccess(true);
      onDone();
    } catch {
      setError("Impossible de joindre le serveur.");
    } finally {
      setPending(false);
    }
  };

  if (success) {
    return (
      <div className="metier-form metier-form--success">
        <div className="auth-success-icon">✓</div>
        <h3>Demande envoyée</h3>
        <p>
          Merci {firstName} ! Votre demande d&apos;inscription à cette formation a bien été reçue.
          Notre équipe vous contactera très prochainement — un email de confirmation vous a été envoyé.
        </p>
      </div>
    );
  }

  if (!session.isOpen) {
    return (
      <div className="metier-form metier-form--success">
        <span className="session-state session-state--full">Complet</span>
        <h3>Inscriptions closes</h3>
        <p>Cette session n&apos;accepte plus d&apos;inscriptions. Contactez-nous pour connaître la prochaine session.</p>
        <Link href="/contact" className="btn btn--outline" style={{ width: "100%" }}>Nous contacter</Link>
      </div>
    );
  }

  return (
    <form className="metier-form" onSubmit={submit}>
      <h3 className="metier-form__title">Réservez votre place</h3>
      <p className="metier-form__sub">
        {session.spotsLeft} place{session.spotsLeft > 1 ? "s" : ""} restante{session.spotsLeft > 1 ? "s" : ""} sur {session.maxCapacity}
      </p>

      {error && <div className="auth-error">{error}</div>}

      <div className="auth-row">
        <div className="auth-field">
          <label className="auth-label" htmlFor="mf-lastname">Nom</label>
          <input id="mf-lastname" type="text" className="auth-input" required autoComplete="family-name"
            value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <div className="auth-field">
          <label className="auth-label" htmlFor="mf-firstname">Prénom</label>
          <input id="mf-firstname" type="text" className="auth-input" required autoComplete="given-name"
            value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="mf-email">Email</label>
        <input id="mf-email" type="email" className="auth-input" required autoComplete="email"
          placeholder="vous@exemple.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="mf-phone">Téléphone</label>
        <input id="mf-phone" type="tel" className="auth-input" required autoComplete="tel"
          placeholder="05 XX XX XX XX"
          value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="auth-field">
        <label className="auth-label" htmlFor="mf-level">Niveau d&apos;étude</label>
        <select id="mf-level" className="auth-input auth-select" required
          value={educationLevel} onChange={(e) => setEducationLevel(e.target.value)}>
          <option value="" disabled>Sélectionnez…</option>
          {EDUCATION_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      <button type="submit" className="btn btn--primary metier-form__submit" disabled={pending}>
        {pending ? "Envoi…" : "Je m'inscris"}
      </button>
      <p className="metier-form__note">Sans compte requis. Votre inscription est validée par notre équipe.</p>
    </form>
  );
}

export default function MetierLanding({ session: initial }: { session: PublicSession }) {
  const [session, setSession] = useState(initial);

  const descFr = session.description ?? session.formation?.description ?? null;
  const descAr = session.descriptionAr ?? session.formation?.descriptionAr ?? null;
  const [lang, setLang] = useState<Lang>(descFr ? "fr" : "ar");

  const img = session.coverImageUrl ? fileUrl(session.coverImageUrl) : branchImage(session.category.slug);
  const duration = formatDurationDays(session.duration ?? session.formation?.duration);
  const price = formatPrice(session.price ?? session.formation?.price, session.pricePeriod);
  const startDate = new Date(session.startDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  // Après une inscription, on rafraîchit le compteur de places.
  const refresh = () => {
    api.get<PublicSession>(`/sessions/${session.id}`).then(setSession).catch(() => {});
  };

  return (
    <>
      <Header />

      <section className="metier-hero">
        <div className="metier-hero__media">
          {img && <Image src={img} alt="" fill priority sizes="100vw" />}
          <div className="metier-hero__scrim" />
        </div>
        <div className="container metier-hero__inner">
          <Link href={`/branches/${session.category.slug}`} className="bd-back bd-back--light">
            {session.category.name}
          </Link>
          <span className="metier-hero__eyebrow">Formation métier · {session.category.name}</span>
          <h1 className="metier-hero__title">{session.title}</h1>
          <div className="metier-hero__actions">
            {session.isOpen ? (
              <a href="#inscription" className="btn btn--primary">Je m&apos;inscris</a>
            ) : (
              <span className="session-state session-state--full">Complet</span>
            )}
          </div>

          <dl className="metier-facts">
            {duration && (
              <div className="metier-facts__item">
                <dt>Durée</dt>
                <dd>{duration}</dd>
              </div>
            )}
            {price && (
              <div className="metier-facts__item metier-facts__item--price">
                <dt>Tarif</dt>
                <dd>{price}</dd>
              </div>
            )}
            <div className="metier-facts__item">
              <dt>Début</dt>
              <dd>{startDate}</dd>
            </div>
            <div className="metier-facts__item">
              <dt>Places</dt>
              <dd>{session.maxCapacity} maximum</dd>
            </div>
            {session.location && (
              <div className="metier-facts__item">
                <dt>Lieu</dt>
                <dd>{session.location}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="metier-body">
        <div className="container metier-body__layout">
          <article className="metier-body__content">
            {descFr && descAr && (
              <div className="metier-lang" role="tablist" aria-label="Langue de la description">
                <button type="button" role="tab" aria-selected={lang === "fr"}
                  className={`metier-lang__btn${lang === "fr" ? " metier-lang__btn--active" : ""}`}
                  onClick={() => setLang("fr")}>
                  Français
                </button>
                <button type="button" role="tab" aria-selected={lang === "ar"}
                  className={`metier-lang__btn metier-lang__btn--ar${lang === "ar" ? " metier-lang__btn--active" : ""}`}
                  onClick={() => setLang("ar")}>
                  العربية
                </button>
              </div>
            )}

            {lang === "fr" && descFr ? (
              <DescriptionBlock text={descFr} dir="ltr" />
            ) : descAr ? (
              <DescriptionBlock text={descAr} dir="rtl" />
            ) : (
              <p>Le programme détaillé de cette formation sera complété prochainement.</p>
            )}
          </article>

          <aside className="metier-body__aside" id="inscription">
            <RegisterCard session={session} onDone={refresh} />
          </aside>
        </div>
      </section>

      <PartnersStrip />
      <Footer />
    </>
  );
}
