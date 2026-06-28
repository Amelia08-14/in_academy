import Link from "next/link";
import Image, { StaticImageData } from "next/image";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

// Image Imports
import adminGestionImg from "../../images/Techniques administratives et gestio.png";
import itNumeriqueImg from "../../images/Informatique – Numérique – Télécom .png";
import chimieQhseImg from "../../images/Chimie industrielle – Plasturgie – QHSE.png";
import electriciteImg from "../../images/Électricité – Électronique – Énergétique .png";
import hotellerieImg from "../../images/Hôtellerie – Restauration – Tourisme.png";
import artGraphiquesImg from "../../images/Art & Industries graphiques.png";
import audiovisuelImg from "../../images/Techniques audiovisuelles .png";
import agroalimentaireImg from "../../images/Industries agroalimentaires.png";
import anglaisImg from "../../images/Technique-expression-Anglais.png";
interface Formation {
  title: string;
  duration: string;
  certifiante: boolean;
}

interface BrancheData {
  slug: string;
  icon: string;
  image: StaticImageData;
  title: string;
  description: string;
  publicCible: string;
  benefices: string[];
  formations: Formation[];
}

const branchesData: BrancheData[] = [
  {
    slug: "admin-gestion",
    icon: "",
    image: adminGestionImg,
    title: "Techniques administratives et gestion",
    description:
      "Formations ciblées sur les enjeux techniques, réglementaires et commerciaux du secteur.",
    publicCible:
      "DRH, responsables RH, managers, gestionnaires du capital humain.",
    benefices: [
      "Renforcement des compétences RH",
      "Maîtrise des enjeux réglementaires",
      "Développement du leadership",
    ],
    formations: [
      { title: "Gestion des Ressources Humaines", duration: "3 à 5 jours", certifiante: true },
      { title: "Banque Assurance & Finance", duration: "3 à 5 jours", certifiante: true },
      { title: "Formation professionnelle & développement des compétences", duration: "3 à 5 jours", certifiante: true },
      { title: "Fiscalité", duration: "2 à 3 jours", certifiante: true },
      { title: "Management & pilotage d’équipe", duration: "3 à 5 jours", certifiante: true },
      { title: "Audit", duration: "2 à 4 jours", certifiante: true },
    ],
  },
  {
    slug: "it-numerique",
    icon: "",
    image: itNumeriqueImg,
    title: "Informatique – Numérique – Télécom",
    description:
      "Sécuriser les systèmes d’information et monter en compétences sur les outils numériques.",
    publicCible:
      "Administrateurs, PME, banques, prestataires IT.",
    benefices: [
      "Réduction des cyber-risques",
      "Sensibilisation des collaborateurs",
      "Gain de productivité",
    ],
    formations: [
      { title: "Bureautique et outils de productivité", duration: "2 à 5 jours", certifiante: true },
      { title: "Compétences numériques de base (digital literacy)", duration: "1 à 3 jours", certifiante: true },
      { title: "Cybersécurité – Sensibilisation et fondamentaux", duration: "1 à 3 jours", certifiante: true },
      { title: "Cybersécurité – Niveau technique / avancé", duration: "3 à 5 jours", certifiante: true },
      { title: "Compétences numériques transversales", duration: "2 à 4 jours", certifiante: true },
      { title: "Télécom", duration: "3 à 5 jours", certifiante: true },
    ],
  },
  {
    slug: "chimie-qhse",
    icon: "",
    image: chimieQhseImg,
    title: "Chimie industrielle – Plasturgie – QHSE",
    description:
      "Protéger les personnes et l’environnement, réduire les accidents.",
    publicCible:
      "Entreprises industrielles, BTP, santé, agroalimentaires.",
    benefices: [
      "Certification QHSE renforcée",
      "Réduction des accidents",
      "Respect et satisfaction du personnel",
    ],
    formations: [
      { title: "Qualité (Q)", duration: "3 à 5 jours", certifiante: true },
      { title: "Hygiène (H)", duration: "2 à 4 jours", certifiante: true },
      { title: "Sécurité (S)", duration: "3 à 5 jours", certifiante: true },
      { title: "Environnement (E)", duration: "3 à 5 jours", certifiante: true },
      { title: "Systèmes de management intégrés (SMI)", duration: "3 à 5 jours", certifiante: true },
    ],
  },
  {
    slug: "electricite",
    icon: "",
    image: electriciteImg,
    title: "Électricité – Électronique – Énergétique",
    description:
      "Alimentation, automatisation et sécurité des systèmes électriques.",
    publicCible:
      "Électriciens, installateurs photovoltaïques, responsables techniques.",
    benefices: [
      "Compétences techniques renforcées",
      "Réduction des risques",
      "Nouvelles technologies énergétiques",
    ],
    formations: [
      { title: "Électricité bâtiment et industrielle", duration: "3 à 5 jours", certifiante: true },
      { title: "Électronique et automatismes", duration: "3 à 5 jours", certifiante: true },
      { title: "Énergies renouvelables et efficacité énergétique", duration: "3 à 5 jours", certifiante: true },
      { title: "Habilitations et sécurité", duration: "2 à 3 jours", certifiante: true },
      { title: "Techniques transversales et outils", duration: "2 à 4 jours", certifiante: true },
    ],
  },
  {
    slug: "hotellerie",
    icon: "",
    image: hotellerieImg,
    title: "Hôtellerie – Restauration – Tourisme",
    description:
      "Maîtriser les techniques de service et garantir la qualité d’accueil.",
    publicCible:
      "Professionnels de l’accueil, restauration et tourisme.",
    benefices: [
      "Compétences métiers",
      "Expérience client culturelle",
      "Normes qualité et hygiène",
    ],
    formations: [
      { title: "Accueil et relation client", duration: "2 à 3 jours", certifiante: true },
      { title: "Service en restauration", duration: "2 à 4 jours", certifiante: true },
      { title: "Cuisine et hygiène alimentaire", duration: "2 à 4 jours", certifiante: true },
      { title: "Hébergement et gestion hôtelière", duration: "2 à 4 jours", certifiante: true },
      { title: "Tourisme et valorisation du territoire", duration: "2 à 4 jours", certifiante: true },
    ],
  },
  {
    slug: "art-graphiques",
    icon: "",
    image: artGraphiquesImg,
    title: "Art & Industrie les Graphiques",
    description: "Maîtriser les outils de création visuels.",
    publicCible:
      "Créatifs, designers, graphistes.",
    benefices: [
      "Compétences créatives",
      "Workflows optimisés",
      "Outils Adobe, Figma",
    ],
    formations: [
      { title: "Graphisme et design créatif", duration: "3 à 5 jours", certifiante: true },
      { title: "Logiciels de création graphique (PAO)", duration: "3 à 5 jours", certifiante: true },
      { title: "Préparation à l’impression et industries graphiques", duration: "2 à 4 jours", certifiante: true },
      { title: "Motion design et animation graphique", duration: "3 à 5 jours", certifiante: true },
      { title: "UX/UI Design (design web et mobile)", duration: "3 à 5 jours", certifiante: true },
    ],
  },
  {
    slug: "audiovisuel",
    icon: "",
    image: audiovisuelImg,
    title: "Techniques audiovisuelles",
    description:
      "Captation, montage et diffusion de contenus audiovisuels.",
    publicCible:
      "Créateurs de contenu, vidéastes, monteurs.",
    benefices: [
      "Tournage et montage",
      "Contenus engageants",
      "Outils professionnels",
    ],
    formations: [
      { title: "Image et captation vidéo", duration: "2 à 4 jours", certifiante: true },
      { title: "Son et prise audio", duration: "2 à 4 jours", certifiante: true },
      { title: "Montage vidéo & postproduction", duration: "3 à 5 jours", certifiante: true },
      { title: "Création de contenu pour le digital", duration: "2 à 3 jours", certifiante: true },
    ],
  },
  {
    slug: "agroalimentaire",
    icon: "",
    image: agroalimentaireImg,
    title: "Industries agroalimentaires",
    description: "Processus de production et sécurité alimentaire.",
    publicCible:
      "Opérateurs agroalimentaire, techniciens qualité.",
    benefices: [
      "Risques sanitaires réduits",
      "Conformité normes",
      "Efficacité processus",
    ],
    formations: [
      { title: "Hygiène et sécurité alimentaire", duration: "2 à 3 jours", certifiante: true },
      { title: "Contrôle qualité et traçabilité", duration: "2 à 4 jours", certifiante: true },
      { title: "Procédés de transformation alimentaire", duration: "3 à 5 jours", certifiante: true },
      { title: "Réglementation et conformité", duration: "2 à 4 jours", certifiante: true },
      { title: "Innovation et durabilité", duration: "2 à 4 jours", certifiante: true },
    ],
  },
  {
    slug: "anglais",
    icon: "",
    image: anglaisImg,
    title: "Technique d’expression : Anglais",
    description: "Anglais professionnel et certifications TOEIC®.",
    publicCible:
      "Étudiants, professionnels, cadres.",
    benefices: [
      "Anglais professionnel",
      "Autonomie linguistique",
      "Certification TOEIC®",
    ],
    formations: [
      { title: "Anglais Général", duration: "5 à 7 jours", certifiante: true },
      { title: "Anglais des Affaires", duration: "3 à 5 jours", certifiante: true },
      { title: "Anglais à des Fins Spécifiques (ESP)", duration: "3 à 5 jours", certifiante: true },
      { title: "TOEIC® – Centre Officiel Agréé", duration: "3 à 5 jours", certifiante: true },
    ],
  },
];

export function generateStaticParams() {
  return branchesData.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const branche = branchesData.find((b) => b.slug === slug);
  if (!branche) return { title: "Branche introuvable" };
  return {
    title: `${branche.title} — IN ACADEMY`,
    description: branche.description,
  };
}

export default async function BrancheDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const branche = branchesData.find((b) => b.slug === slug);

  if (!branche) {
    notFound();
  }

  return (
    <>
      <Header />

      <section className="bd-page">
        <div className="container">
          {/* Back link */}
          <Link href="/branches" className="bd-back">
            ← Toutes les branches
          </Link>

          {/* Hero */}
          <div className="bd-hero">
            <div className="bd-hero__content">
              <span className="bd-hero__icon">{branche.icon}</span>
              <h1 className="bd-hero__title">{branche.title}</h1>
              <p className="bd-hero__description">{branche.description}</p>
            </div>
            <div className="bd-hero__image" style={{ position: 'relative', minHeight: '300px', borderRadius: '12px', overflow: 'hidden' }}>
              <Image src={branche.image} alt={branche.title} fill style={{ objectFit: 'cover' }} />
            </div>
          </div>

          {/* Content */}
          <div className="bd-content">
            {/* Sidebar */}
            <aside className="bd-sidebar">
              <div className="bd-sidebar__section">
                <h3 className="bd-sidebar__heading">Public cible</h3>
                <p className="bd-sidebar__text">{branche.publicCible}</p>
              </div>

              <div className="bd-sidebar__section">
                <h3 className="bd-sidebar__heading">Bénéfices</h3>
                <ul className="bd-sidebar__list">
                  {branche.benefices.map((b, i) => (
                    <li key={i} className="bd-sidebar__list-item">
                      <span className="bd-sidebar__check">✓</span>
                      {b}
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/inscrire" className="bd-sidebar__cta">
                Demander une formation
              </Link>
            </aside>

            {/* Formations */}
            <div className="bd-formations">
              <h2 className="bd-formations__title">Nos formations</h2>
              <p className="bd-formations__count">
                {branche.formations.length} formation
                {branche.formations.length > 1 ? "s" : ""}
              </p>

              <div className="bd-formations__grid">
                {branche.formations.map((f, i) => (
                  <div className="bd-formation-item" key={i}>
                    <h4 className="bd-formation-item__title">{f.title}</h4>
                    <div className="bd-formation-item__meta">
                      {f.certifiante && (
                        <span className="bd-formation-item__badge">
                          Certifiante
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
