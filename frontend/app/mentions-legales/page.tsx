import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = { title: "Mentions légales — IN ACADEMY" };

export default function MentionsLegalesPage() {
  return (
    <>
      <Header />
      <section className="legal-page">
        <div className="container" style={{ maxWidth: 780 }}>
          <h1 className="legal-page__title">Mentions légales</h1>

          <h2>Éditeur du site</h2>
          <p>
            Le présent site est édité par <strong>IN ACADEMY</strong>, membre du groupe La Maison IN Groupe.
            <br />Siège :{" "}
            <a href="https://maps.app.goo.gl/mGufMtpzVU2Rgazo9" target="_blank" rel="noopener noreferrer">
              N8 Parc Paradou, Hydra, Alger, Algérie.
            </a>
            <br />Email : formation.in.academy@gmail.com — Tél. : 0560 06 74 85.
          </p>

          <h2>Hébergement</h2>
          <p>Le site est hébergé sur un serveur dédié. Les informations d&apos;hébergement peuvent être communiquées sur demande.</p>

          <h2>Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus (textes, visuels, logos, programmes de formation) est la propriété exclusive
            d&apos;IN ACADEMY, sauf mention contraire. Toute reproduction sans autorisation préalable est interdite.
          </p>

          <h2>Responsabilité</h2>
          <p>
            IN ACADEMY s&apos;efforce d&apos;assurer l&apos;exactitude des informations diffusées mais ne saurait être tenue
            responsable d&apos;éventuelles omissions ou inexactitudes.
          </p>

          <p className="legal-page__note">
            Pour toute question relative à ces mentions, contactez-nous à formation.in.academy@gmail.com.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
