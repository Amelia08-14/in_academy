import Header from "../components/Header";
import Footer from "../components/Footer";

export const metadata = { title: "Politique de confidentialité — IN ACADEMY" };

export default function ConfidentialitePage() {
  return (
    <>
      <Header />
      <section className="legal-page">
        <div className="container" style={{ maxWidth: 780 }}>
          <h1 className="legal-page__title">Politique de confidentialité</h1>

          <h2>Données collectées</h2>
          <p>
            Dans le cadre de votre inscription et de l&apos;utilisation de nos services, IN ACADEMY collecte les données
            que vous fournissez : identité, coordonnées, informations de profil, et documents que vous déposez (reçus,
            dossiers, CV).
          </p>

          <h2>Utilisation des données</h2>
          <p>
            Vos données servent uniquement à la gestion de vos inscriptions, de vos devis, et au suivi de votre parcours
            de formation. Elles ne sont ni vendues ni cédées à des tiers.
          </p>

          <h2>Conservation</h2>
          <p>Les données sont conservées le temps nécessaire à la gestion de votre relation avec IN ACADEMY.</p>

          <h2>Vos droits</h2>
          <p>
            Vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données. Pour l&apos;exercer,
            contactez-nous à formation.in.academy@gmail.com.
          </p>

          <p className="legal-page__note">
            Cette politique peut être mise à jour ; la version en vigueur est celle publiée sur cette page.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
