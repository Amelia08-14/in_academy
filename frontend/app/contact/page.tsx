"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { api } from "@/lib/api";

interface Formation { id: string; title: string }
interface Category { id: string; name: string; formations: Formation[] }

const statusOptions = ["Entreprise", "Entrepreneur", "Salarié", "Étudiant", "Autre"] as const;
const STATUT_VALUE: Record<(typeof statusOptions)[number], string> = {
  Entreprise: "ENTREPRISE",
  Entrepreneur: "ENTREPRENEUR",
  Salarié: "SALARIE",
  Étudiant: "ETUDIANT",
  Autre: "AUTRE",
};

export default function ContactPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<(typeof statusOptions)[number] | "">("");
  const [selectedBranche, setSelectedBranche] = useState("");
  const [selectedFormation, setSelectedFormation] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<Category[]>("/categories").then(setCategories).catch(() => setCategories([]));
  }, []);

  const filteredFormations = useMemo(() => {
    const cat = categories.find((c) => c.id === selectedBranche);
    return cat?.formations ?? [];
  }, [categories, selectedBranche]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) { setError("Merci de sélectionner votre statut."); return; }
    setSending(true);
    setError("");
    try {
      const formation = filteredFormations.find((f) => f.id === selectedFormation);
      await api.post("/contact-requests", {
        nom, prenom, telephone, email,
        statut: STATUT_VALUE[selectedStatus],
        categoryId: selectedBranche || undefined,
        formationName: formation?.title,
        message,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Header />

      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <span className="page-hero__label">Contact</span>
          <h1 className="page-hero__title">Demander une formation</h1>
          <p className="page-hero__subtitle">
            Vous ne trouvez pas la formation qu&apos;il vous faut ? Décrivez votre
            besoin ci-dessous, notre équipe vous recontactera rapidement.
          </p>
        </div>
      </section>

      {/* Inscription Content */}
      <section className="inscription">
        <div className="container">
          <div className="inscription__layout">
            {/* Left: Contact Info */}
            <aside className="inscription__sidebar">
              <div className="contact-card" id="contact-address">
                <span className="contact-card__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </span>
                <h4 className="contact-card__title">Adresse</h4>
                <p className="contact-card__text">
                  Hydra, Alger
                  <br />
                  Entrée/Sortie autoroute
                </p>
              </div>

              <div className="contact-card" id="contact-phone">
                <span className="contact-card__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </span>
                <h4 className="contact-card__title">Téléphone</h4>
                <p className="contact-card__text">+213 (0) 20 07 17 00</p>
              </div>

              <div className="contact-card" id="contact-email">
                <span className="contact-card__icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <h4 className="contact-card__title">Email</h4>
                <p className="contact-card__text">contact@imig-dz.com</p>
              </div>
            </aside>

            {/* Right: Form */}
            <div className="inscription__form-wrapper">
              <h2 className="inscription__form-title">
                Formulaire de contact
              </h2>

              {sent ? (
                <div className="inscription__info-box">
                  <h4 className="inscription__info-title">Demande envoyée ✓</h4>
                  <p>Merci, votre demande a bien été enregistrée. Notre équipe vous recontactera rapidement.</p>
                </div>
              ) : (
                <>
                  <div className="inscription__info-box">
                    <h4 className="inscription__info-title">
                      Comment ça marche ?
                    </h4>
                    <ol className="inscription__info-list">
                      <li>1. Remplissez le formulaire avec votre besoin.</li>
                      <li>2. Après envoi, votre demande est enregistrée et transmise à notre équipe.</li>
                      <li>3. Nous vous recontactons rapidement par email ou téléphone pour la suite.</li>
                    </ol>
                  </div>

                  {error && <div className="auth-error">{error}</div>}

                  <form className="inscription__form" onSubmit={handleSubmit}>
                    {/* Nom / Prénom */}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="nom">
                          Nom <span className="form-required">*</span>
                        </label>
                        <input
                          type="text" id="nom" className="form-input"
                          placeholder="Votre nom de famille" required
                          value={nom} onChange={(e) => setNom(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="prenom">
                          Prénom <span className="form-required">*</span>
                        </label>
                        <input
                          type="text" id="prenom" className="form-input"
                          placeholder="Votre prénom" required
                          value={prenom} onChange={(e) => setPrenom(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Téléphone / Email */}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label" htmlFor="telephone">
                          Téléphone <span className="form-required">*</span>
                        </label>
                        <input
                          type="tel" id="telephone" className="form-input"
                          placeholder="+213 XX XX XX XX" required
                          value={telephone} onChange={(e) => setTelephone(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="email">
                          Adresse email <span className="form-required">*</span>
                        </label>
                        <input
                          type="email" id="email" className="form-input"
                          placeholder="exemple@email.com" required
                          value={email} onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Statut */}
                    <div className="form-group">
                      <label className="form-label">
                        Statut <span className="form-required">*</span>
                      </label>
                      <div className="status-group">
                        {statusOptions.map((status) => (
                          <button
                            key={status}
                            type="button"
                            className={`status-option${selectedStatus === status ? " status-option--active" : ""}`}
                            onClick={() => setSelectedStatus(status)}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Domaine d'intérêt */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="branche">
                        Domaine d&apos;intérêt
                      </label>
                      <select
                        id="branche" className="form-select"
                        value={selectedBranche}
                        onChange={(e) => { setSelectedBranche(e.target.value); setSelectedFormation(""); }}
                      >
                        <option value="">— Sélectionner un domaine —</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Formation (conditionally rendered) */}
                    {selectedBranche && (
                      <div className="form-group">
                        <label className="form-label" htmlFor="formation">
                          Formation d&apos;intérêt
                        </label>
                        <select
                          id="formation" className="form-select"
                          value={selectedFormation}
                          onChange={(e) => setSelectedFormation(e.target.value)}
                        >
                          <option value="">— Sélectionner une formation —</option>
                          {filteredFormations.map((f) => (
                            <option key={f.id} value={f.id}>{f.title}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Description */}
                    <div className="form-group">
                      <label className="form-label" htmlFor="message">
                        Description (Message) <span className="form-required">*</span>
                      </label>
                      <textarea
                        id="message" className="form-textarea" rows={5}
                        placeholder="Décrivez votre besoin, vos disponibilités, ou toute information utile..."
                        required
                        value={message} onChange={(e) => setMessage(e.target.value)}
                      ></textarea>
                    </div>

                    {/* Submit */}
                    <button type="submit" className="btn btn--submit" disabled={sending}>
                      <span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13"></line>
                          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                      </span>
                      {sending ? "Envoi…" : "S'inscrire"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
