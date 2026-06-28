"use client";

import { useState, useMemo } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

interface Formation {
  id: number;
  title: string;
  duration: string;
  certifiante: boolean;
  branche: string;
}

export const formations: Formation[] = [
  // Techniques administratives et gestion
  { id: 1, title: "Gestion des Ressources Humaines", duration: "3 à 5 jours", certifiante: true, branche: "Techniques administratives et gestion" },
  { id: 2, title: "Banque Assurance & Finance", duration: "3 à 5 jours", certifiante: true, branche: "Techniques administratives et gestion" },
  { id: 3, title: "Formation professionnelle & développement des compétences", duration: "3 à 5 jours", certifiante: true, branche: "Techniques administratives et gestion" },
  { id: 4, title: "Fiscalité", duration: "2 à 3 jours", certifiante: true, branche: "Techniques administratives et gestion" },
  { id: 5, title: "Management & pilotage d\u2019équipe", duration: "3 à 5 jours", certifiante: true, branche: "Techniques administratives et gestion" },
  { id: 6, title: "Audit", duration: "2 à 4 jours", certifiante: true, branche: "Techniques administratives et gestion" },

  // Informatique – Numérique – Télécom
  { id: 7, title: "Bureautique et outils de productivité", duration: "2 à 5 jours", certifiante: true, branche: "Informatique – Numérique – Télécom" },
  { id: 8, title: "Compétences numériques de base (digital literacy)", duration: "1 à 3 jours", certifiante: true, branche: "Informatique – Numérique – Télécom" },
  { id: 9, title: "Cybersécurité – Sensibilisation et fondamentaux", duration: "1 à 3 jours", certifiante: true, branche: "Informatique – Numérique – Télécom" },
  { id: 10, title: "Cybersécurité – Niveau technique / avancé", duration: "3 à 5 jours", certifiante: true, branche: "Informatique – Numérique – Télécom" },
  { id: 11, title: "Compétences numériques transversales", duration: "2 à 4 jours", certifiante: true, branche: "Informatique – Numérique – Télécom" },
  { id: 12, title: "Télécom", duration: "3 à 5 jours", certifiante: true, branche: "Informatique – Numérique – Télécom" },

  // Chimie industrielle – Plasturgie – QHSE
  { id: 13, title: "Qualité (Q)", duration: "3 à 5 jours", certifiante: true, branche: "Chimie industrielle – Plasturgie – QHSE" },
  { id: 14, title: "Hygiène (H)", duration: "2 à 4 jours", certifiante: true, branche: "Chimie industrielle – Plasturgie – QHSE" },
  { id: 15, title: "Sécurité (S)", duration: "3 à 5 jours", certifiante: true, branche: "Chimie industrielle – Plasturgie – QHSE" },
  { id: 16, title: "Environnement (E)", duration: "3 à 5 jours", certifiante: true, branche: "Chimie industrielle – Plasturgie – QHSE" },
  { id: 17, title: "Systèmes de management intégrés (SMI)", duration: "3 à 5 jours", certifiante: true, branche: "Chimie industrielle – Plasturgie – QHSE" },

  // Électricité – Électronique – Énergétique
  { id: 18, title: "Électricité bâtiment et industrielle", duration: "3 à 5 jours", certifiante: true, branche: "Électricité – Électronique – Énergétique" },
  { id: 19, title: "Électronique et automatismes", duration: "3 à 5 jours", certifiante: true, branche: "Électricité – Électronique – Énergétique" },
  { id: 20, title: "Énergies renouvelables et efficacité énergétique", duration: "3 à 5 jours", certifiante: true, branche: "Électricité – Électronique – Énergétique" },
  { id: 21, title: "Habilitations et sécurité", duration: "2 à 3 jours", certifiante: true, branche: "Électricité – Électronique – Énergétique" },
  { id: 22, title: "Techniques transversales et outils", duration: "2 à 4 jours", certifiante: true, branche: "Électricité – Électronique – Énergétique" },

  // Hôtellerie – Restauration – Tourisme
  { id: 23, title: "Accueil et relation client", duration: "2 à 3 jours", certifiante: true, branche: "Hôtellerie – Restauration – Tourisme" },
  { id: 24, title: "Service en restauration", duration: "2 à 4 jours", certifiante: true, branche: "Hôtellerie – Restauration – Tourisme" },
  { id: 25, title: "Cuisine et hygiène alimentaire", duration: "2 à 4 jours", certifiante: true, branche: "Hôtellerie – Restauration – Tourisme" },
  { id: 26, title: "Hébergement et gestion hôtelière", duration: "2 à 4 jours", certifiante: true, branche: "Hôtellerie – Restauration – Tourisme" },
  { id: 27, title: "Tourisme et valorisation du territoire", duration: "2 à 4 jours", certifiante: true, branche: "Hôtellerie – Restauration – Tourisme" },

  // Art & Industrie les Graphiques
  { id: 28, title: "Graphisme et design créatif", duration: "3 à 5 jours", certifiante: true, branche: "Art & Industrie les Graphiques" },
  { id: 29, title: "Logiciels de création graphique (PAO)", duration: "3 à 5 jours", certifiante: true, branche: "Art & Industrie les Graphiques" },
  { id: 30, title: "Préparation à l\u2019impression et industries graphiques", duration: "2 à 4 jours", certifiante: true, branche: "Art & Industrie les Graphiques" },

  // Techniques audiovisuelles
  { id: 31, title: "Motion design et animation graphique", duration: "3 à 5 jours", certifiante: true, branche: "Art & Industrie les Graphiques" },
  { id: 32, title: "UX/UI Design (design web et mobile)", duration: "3 à 5 jours", certifiante: true, branche: "Art & Industrie les Graphiques" },
  { id: 33, title: "Image et captation vidéo", duration: "2 à 4 jours", certifiante: true, branche: "Techniques audiovisuelles" },
  { id: 34, title: "Son et prise audio", duration: "2 à 4 jours", certifiante: true, branche: "Techniques audiovisuelles" },
  { id: 35, title: "Montage vidéo & postproduction", duration: "3 à 5 jours", certifiante: true, branche: "Techniques audiovisuelles" },
  { id: 36, title: "Création de contenu pour le digital", duration: "2 à 3 jours", certifiante: true, branche: "Techniques audiovisuelles" },

  // Industries agroalimentaires
  { id: 37, title: "Hygiène et sécurité alimentaire", duration: "2 à 3 jours", certifiante: true, branche: "Industries agroalimentaires" },
  { id: 38, title: "Contrôle qualité et traçabilité", duration: "2 à 4 jours", certifiante: true, branche: "Industries agroalimentaires" },
  { id: 39, title: "Procédés de transformation alimentaire", duration: "3 à 5 jours", certifiante: true, branche: "Industries agroalimentaires" },
  { id: 40, title: "Réglementation et conformité", duration: "2 à 4 jours", certifiante: true, branche: "Industries agroalimentaires" },
  { id: 41, title: "Innovation et durabilité", duration: "2 à 4 jours", certifiante: true, branche: "Industries agroalimentaires" },

  // Technique d'expression : Anglais
  { id: 42, title: "Anglais Général", duration: "5 à 7 jours", certifiante: true, branche: "Technique d\u2019expression : Anglais" },
  { id: 43, title: "Anglais des Affaires", duration: "3 à 5 jours", certifiante: true, branche: "Technique d\u2019expression : Anglais" },
  { id: 44, title: "Anglais à des Fins Spécifiques (ESP)", duration: "3 à 5 jours", certifiante: true, branche: "Technique d\u2019expression : Anglais" },
  { id: 45, title: "TOEIC® – Centre Officiel Agréé", duration: "3 à 5 jours", certifiante: true, branche: "Technique d\u2019expression : Anglais" },
];

const allBranches = Array.from(new Set(formations.map((f) => f.branche)));

export default function FormationsPage() {
  const [search, setSearch] = useState("");
  const [selectedBranche, setSelectedBranche] = useState("");
  const [selectedNiveau, setSelectedNiveau] = useState("");

  const filtered = useMemo(() => {
    return formations.filter((f) => {
      const matchSearch =
        search === "" ||
        f.title.toLowerCase().includes(search.toLowerCase());
      const matchBranche =
        selectedBranche === "" || f.branche === selectedBranche;
      const matchNiveau = selectedNiveau === "" || true; // All are certifiante
      return matchSearch && matchBranche && matchNiveau;
    });
  }, [search, selectedBranche, selectedNiveau]);

  return (
    <>
      <Header />

      {/* Page Hero */}
      <section className="page-hero">
        <div className="container">
          <span className="page-hero__label">Catalogue</span>
          <h1 className="page-hero__title">Catalogue des formations</h1>
          <p className="page-hero__subtitle">
            Recherchez et filtrez parmi nos formations certifiantes. Cliquez pour
            voir les détails.
          </p>
        </div>
      </section>

      {/* Filter & Catalogue */}
      <section className="catalogue">
        <div className="container">
          {/* Filter Bar */}
          <div className="catalogue__filters">
            <div className="catalogue__search-wrap">
              <span className="catalogue__search-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
              <input
                type="text"
                id="search-formations"
                className="catalogue__search"
                placeholder="Rechercher une formation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              id="filter-branche"
              className="catalogue__filter-select"
              value={selectedBranche}
              onChange={(e) => setSelectedBranche(e.target.value)}
            >
              <option value="">Toutes les branches</option>
              {allBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              id="filter-niveau"
              className="catalogue__filter-select"
              value={selectedNiveau}
              onChange={(e) => setSelectedNiveau(e.target.value)}
            >
              <option value="">Tous les niveaux</option>
              <option value="certifiante">Certifiante</option>
            </select>
          </div>

          {/* Results Count */}
          <p className="catalogue__count">
            {filtered.length} formation{filtered.length !== 1 ? "s" : ""}{" "}
            trouvée{filtered.length !== 1 ? "s" : ""}
          </p>

          {/* Results Grid */}
          <div className="catalogue__grid">
            {filtered.map((f) => (
              <div className="catalogue__item" key={f.id} id={`formation-${f.id}`}>
                <h3 className="catalogue__item-title">{f.title}</h3>
                <div className="catalogue__item-meta">
                  {f.certifiante && (
                    <span className="catalogue__item-badge">
                      Certifiante
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="catalogue__empty">
              <p>Aucune formation ne correspond à votre recherche.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
