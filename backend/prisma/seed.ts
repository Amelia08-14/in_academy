import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// ─── Helpers ──────────────────────────────────────────────────────────────────

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { slug: "transport-logistique",      name: "Transport & Logistique" },
  { slug: "commerce-ventes",           name: "Commerce & Ventes" },
  { slug: "hse-securite",             name: "HSE & Sécurité" },
  { slug: "finance-comptabilite",      name: "Finance & Comptabilité" },
  { slug: "achats-international",      name: "Achats & International" },
  { slug: "it-digital",               name: "IT & Digital" },
  { slug: "rh-management",            name: "RH & Management" },
  { slug: "juridique-conformite",      name: "Juridique & Conformité" },
  { slug: "maritime-import-export",    name: "Maritime & Import/Export" },
  { slug: "qualite-production",        name: "Qualité & Production" },
  { slug: "langues",                   name: "Langues" },
  { slug: "audit",                     name: "Audit" },
];

// Formateurs uniques (dédoublonnés depuis l'Excel)
const TRAINERS: Array<{
  key: string;
  firstName: string;
  lastName: string;
  displayName: string;
  speciality?: string;
  cvUrl?: string;
}> = [
  { key: "KHADER",      firstName: "Mehrez",        lastName: "KHADER",         displayName: "M. KHADER Mehrez",         speciality: "Transport & Conduite" },
  { key: "TAIER",       firstName: "Aziz Rheda",    lastName: "TAIER",          displayName: "M. TAIER Aziz Rheda",      speciality: "Finance & Comptabilité",   cvUrl: "CV TAIER AZIZ RHEDA.pdf" },
  { key: "HALIMI",      firstName: "Arslan Slimane",lastName: "HALIMI",         displayName: "M. HALIMI Arslan Slimane", speciality: "Commerce & Management",    cvUrl: "CV Arslan Slimane HALIMI.pdf" },
  { key: "CHAOUCHE",    firstName: "Abderraouf",    lastName: "CHAOUCHE",       displayName: "M. CHAOUCHE Abderraouf",  speciality: "Commerce & Finance",        cvUrl: "CV Abderraouf CHAOUCHE.pdf" },
  { key: "BRAHIMI",     firstName: "Asdine",        lastName: "BRAHIMI",        displayName: "M. BRAHIMI Asdine",        speciality: "Juridique & Achats",        cvUrl: "CV Asdine Brahimi IN_Academy.pdf" },
  { key: "BAHLOUL",     firstName: "Abdelmadjid",   lastName: "BAHLOUL",        displayName: "M. BAHLOUL Abdelmadjid",  speciality: "HSE & Logistique",          cvUrl: "CV BAHLOUL ABDELMADJID.pdf" },
  { key: "HACHEMI",     firstName: "Ouafi",         lastName: "HACHEMI",        displayName: "M. HACHEMI Ouafi",         speciality: "Secourisme & Sécurité",     cvUrl: "CV OUAFI HACHEMI.pdf" },
  { key: "ACHACHI",     firstName: "Hamidou",       lastName: "ACHACHI",        displayName: "M. ACHACHI Hamidou",       speciality: "Habilitations & CACES",     cvUrl: "CV ACHACHI HAMIDOU.pdf" },
  { key: "ABDALLAH",    firstName: "Tarik",         lastName: "ABDALLAH MEHDI", displayName: "M. ABDALLAH MEHDI Tarik",  speciality: "Achats Internationaux",     cvUrl: "CV Tarik Abdallah MEHDI.pdf" },
  { key: "KHELIFA_N",   firstName: "Nabil",         lastName: "KHELIFA",        displayName: "M. KHELIFA Nabil",         speciality: "Douane & Commerce Extérieur",cvUrl: "CV Nabil KHELIFA.pdf" },
  { key: "SIDISAID",    firstName: "Abdenour",      lastName: "SIDI SAID",      displayName: "M. SIDI SAID Abdenour",    speciality: "Réglementation Maritime",   cvUrl: "CV sidi Said Abdenour.pdf" },
  { key: "KEBIR",       firstName: "Khelifa",       lastName: "KEBIR",          displayName: "M. KEBIR Khelifa",         speciality: "Techniques Bancaires",      cvUrl: "CV KEBIR Khelifa.pdf" },
  { key: "BENLHADJ",    firstName: "Amel",          lastName: "BENLHADJ",       displayName: "Mme BENLHADJ Amel",        speciality: "IT & Systèmes d'Information",cvUrl: "Benelhadj-Amel.pdf" },
  { key: "YAHIAOUI",    firstName: "Nawel",         lastName: "YAHIAOUI",       displayName: "Mme YAHIAOUI Nawel",       speciality: "Conformité & KYC/AML",     cvUrl: "CV Nawel_Yahyaoui.pdf" },
  { key: "ZOUBIRI",     firstName: "Fatima",        lastName: "ZOUBIRI",        displayName: "Mme ZOUBIRI Fatima",       speciality: "Finance & Logistique Internationale",cvUrl: "CV fatima zoubiri.pdf" },
  { key: "REMRAM",      firstName: "Abdelghani",    lastName: "REMRAM",         displayName: "M. REMRAM Abdelghani",     speciality: "Management & Leadership",   cvUrl: "CV REMRAM Abdelghani.pdf" },
  { key: "BENZAID",     firstName: "Imen",          lastName: "BENZAID",        displayName: "Mme BENZAID Imen",         speciality: "Ressources Humaines & GEPP",cvUrl: "CV IMEN BENZAID.pdf" },
  { key: "MEKAOUI",     firstName: "Mohamed",       lastName: "MEKAOUI",        displayName: "M. MEKAOUI Mohamed",       speciality: "Paie & RH",                 cvUrl: "CV Mohamed MEKAOUI.pdf" },
  { key: "BOUABDALLAH", firstName: "Djallal",       lastName: "BOUABDALLAH",    displayName: "M. BOUABDALLAH Djallal",   speciality: "Droit & Protection des Données",cvUrl: "CV Djallal Bouabdallah.pdf" },
  { key: "MEHDAOUI",    firstName: "Amel",          lastName: "MEHDAOUI",       displayName: "Mme MEHDAOUI Amel",        speciality: "Psychologie & Gestion du stress",cvUrl: "CV EL MEHDAOUI Amel.pdf" },
  { key: "MOUATS",      firstName: "Salah",         lastName: "MOUATS",         displayName: "M. MOUATS Salah",          speciality: "Qualité & Résolution de Problèmes",cvUrl: "CV Salah MOUATS.pdf" },
  { key: "ZEMOUR",      firstName: "Fayçal",        lastName: "ZEMOUR",         displayName: "M. ZEMOUR Fayçal",         speciality: "Amélioration Continue & Lean",cvUrl: "Faycal ZEMMOUR cv.pdf" },
  { key: "ZERHOUNI",    firstName: "Boumediene Anas",lastName: "ZERHOUNI",      displayName: "Dr. ZERHOUNI Boumediene Anas",speciality: "Qualité & ISO 9001" },
  { key: "AMALOU",      firstName: "Warda",         lastName: "AMALOU",         displayName: "Mme AMALOU Warda",         speciality: "Sécurité & IT",             cvUrl: "CV AMALOU Warda.pdf" },
  { key: "EDUCTECH",    firstName: "Education",     lastName: "TECH",           displayName: "EDUCATION TECH",           speciality: "Langues & Anglais" },
  { key: "AHMED_ANISS", firstName: "Rayane",        lastName: "AHMED ANISS",    displayName: "M. AHMED ANISS Rayane",    speciality: "Audit Interne" },
  { key: "SOFRANI",     firstName: "Mohammed",      lastName: "SOFRANI",        displayName: "M. SOFRANI Mohammed",      speciality: "Transport & Sécurité Routière",cvUrl: "CV Mohammed SOFRANI.pdf" },
  { key: "KABIR",       firstName: "Soumaya",       lastName: "KABIR",          displayName: "Mme KABIR Soumaya",        speciality: "Audit Interne & Fournisseurs" },
  { key: "KASMI",       firstName: "Youcef",        lastName: "KASMI",          displayName: "M. KASMI Youcef",          speciality: "Ingénierie Pédagogique" },
];

// Formations : [title, categorySlug, trainerKeys[], ficheTechniqueUrl?]
const FORMATIONS: Array<{
  title: string;
  cat: string;
  trainers: string[];
  fiche?: string;
  duration?: string;
  price?: number;
}> = [
  // Transport & Logistique
  { title: "Conduite sécuritaire et préventive",                cat: "transport-logistique", trainers: ["KHADER"],    fiche: "Conduite Défensive & Comportementale.pdf",          duration: "2 jours" },
  { title: "Éco-conduite (réduction consommation carburant)",   cat: "transport-logistique", trainers: ["BAHLOUL"],   fiche: "Eco-conduite.pdf",                                  duration: "1 jour" },
  { title: "Réglementation du transport (temps de conduite, documents)", cat: "transport-logistique", trainers: ["BAHLOUL"], fiche: "Reglementation_Transport.pdf",            duration: "1 jour" },
  { title: "Gestion des situations d'urgence (accidents, pannes)", cat: "transport-logistique", trainers: ["BAHLOUL"], fiche: "Gestion_Situations_Urgence.pdf",                   duration: "1 jour" },
  { title: "Sensibilisation aux risques liés à la fatigue et à la distraction au volant", cat: "transport-logistique", trainers: ["SOFRANI"], fiche: "Sensibilisation_Fatigue.pdf", duration: "1 jour" },

  // Commerce & Ventes
  { title: "Technique des ventes et négociations B2B",          cat: "commerce-ventes",      trainers: ["HALIMI"],    fiche: "Maîtriser l'entretien de vente.pdf",               duration: "3 jours",  price: 45000 },
  { title: "Formation métier chef des ventes",                  cat: "commerce-ventes",      trainers: ["CHAOUCHE"],  fiche: "Chef_des_Ventes.pdf",                               duration: "3 jours",  price: 45000 },
  { title: "Négociation contrat",                               cat: "commerce-ventes",      trainers: ["BRAHIMI"],   fiche: "Negociation Contrats Commerciaux.pdf",              duration: "2 jours",  price: 35000 },
  { title: "Gestion d'équipes",                                 cat: "commerce-ventes",      trainers: ["HALIMI"],    fiche: "Management d'équipe.pdf",                           duration: "2 jours",  price: 35000 },

  // HSE & Sécurité
  { title: "HSE en atelier",                                    cat: "hse-securite",         trainers: ["BAHLOUL"],   fiche: "HSE Risques_Professionnels.pdf",                   duration: "2 jours",  price: 30000 },
  { title: "Manutention",                                       cat: "hse-securite",         trainers: ["BAHLOUL"],   fiche: "Manutention.pdf",                                   duration: "1 jour",   price: 25000 },
  { title: "Secourisme",                                        cat: "hse-securite",         trainers: ["HACHEMI"],   fiche: "Les gestes qui sauvent.pdf",                       duration: "2 jours",  price: 30000 },
  { title: "Habilitation Conduite chariot élévateur",           cat: "hse-securite",         trainers: ["ACHACHI"],   fiche: "HABILITATION CHARIOTS ELEVATEURS.pdf",             duration: "3 jours",  price: 40000 },
  { title: "Habilitation électrique",                           cat: "hse-securite",         trainers: ["ACHACHI"],   fiche: "Habilitation Electrique BT_HTA.pdf",               duration: "3 jours",  price: 40000 },
  { title: "Habilitation chimique",                             cat: "hse-securite",         trainers: ["BAHLOUL"],   duration: "2 jours",  price: 35000 },
  { title: "CACES Cariste R489 (catégories 1A, 1B, 3 et 5)",   cat: "hse-securite",         trainers: ["ACHACHI"],   duration: "5 jours",  price: 55000 },
  { title: "Formation Sécurité",                                cat: "hse-securite",         trainers: ["AMALOU"],    fiche: "Manager Système Informations.pdf",                  duration: "2 jours",  price: 30000 },

  // Finance & Comptabilité
  { title: "Notion de comptabilité & facturation",              cat: "finance-comptabilite", trainers: ["TAIER"],     fiche: "Notions Comptabilite Facturation.pdf",              duration: "2 jours",  price: 35000 },
  { title: "Analyse financière et évaluation de la rentabilité",cat: "finance-comptabilite", trainers: ["TAIER"],     fiche: "Analyse Financiere_Rentabilite.pdf",               duration: "3 jours",  price: 45000 },
  { title: "Perfectionnement sur la liasse fiscale et le reporting financier", cat: "finance-comptabilite", trainers: ["TAIER"], fiche: "Liasse_Fiscale_Reporting.pdf",        duration: "2 jours",  price: 40000 },
  { title: "Maîtrise d'Excel avancé pour la modélisation financière", cat: "finance-comptabilite", trainers: ["TAIER"], fiche: "Excel Avance Modelisation_Financiere.pdf",     duration: "3 jours",  price: 45000 },
  { title: "Gestion de trésorerie et techniques bancaires",     cat: "finance-comptabilite", trainers: ["KEBIR"],     fiche: "Techniques bancaires.pdf",                         duration: "2 jours",  price: 40000 },
  { title: "Gestion de la relation bancaire et négociation des conditions", cat: "finance-comptabilite", trainers: ["KEBIR","CHAOUCHE"], fiche: "Relations bancaires.pdf",     duration: "2 jours",  price: 40000 },
  { title: "Conformité (KYC/AML) et réglementation des flux internationaux", cat: "finance-comptabilite", trainers: ["YAHIAOUI"], fiche: "KYC_AML_Flux_Internationaux.pdf", duration: "2 jours",  price: 40000 },
  { title: "Optimisation des moyens de paiement et sécurité bancaire", cat: "finance-comptabilite", trainers: ["ZOUBIRI"], fiche: "Optimisation Paiements Securite_Bancaire.pdf", duration: "2 jours", price: 40000 },
  { title: "Pilotage de la stratégie financière et contrôle de gestion", cat: "finance-comptabilite", trainers: ["CHAOUCHE"], fiche: "Pilotage_Strategie_Financiere.pdf",    duration: "3 jours",  price: 50000 },
  { title: "Digitalisation des processus financiers et outils de Business Intelligence", cat: "finance-comptabilite", trainers: ["BENLHADJ"], fiche: "Digitalisation des Processus Financiers.pdf", duration: "3 jours", price: 50000 },
  { title: "Gestion prévisionnelle de trésorerie et optimisation du BFR", cat: "finance-comptabilite", trainers: ["TAIER"], fiche: "Tresorerie_BFR.pdf",                    duration: "2 jours",  price: 40000 },
  { title: "Maîtrise des risques de change et de taux",         cat: "finance-comptabilite", trainers: ["ZOUBIRI"],   fiche: "Risques_Change_Taux.pdf",                          duration: "2 jours",  price: 40000 },
  { title: "Cash Management : techniques de centralisation (Cash Pooling)", cat: "finance-comptabilite", trainers: ["ZOUBIRI"], fiche: "Cash_Management_Cash_Pooling.pdf",    duration: "2 jours",  price: 40000 },
  { title: "Cost Modeling, analyse des coûts (TCO – Total Cost of Ownership)", cat: "finance-comptabilite", trainers: ["TAIER"], fiche: "Cost_Modeling_Analyse_Couts_TCO.pdf", duration: "2 jours", price: 40000 },
  { title: "Cursus Finance & Comptabilité de l'entreprise",     cat: "finance-comptabilite", trainers: ["TAIER"],     fiche: "Cursus_Finance_et_Comptabilite.pdf",               duration: "5 jours",  price: 75000 },

  // Achats & International
  { title: "Techniques de négociation d'achat",                 cat: "achats-international", trainers: ["ABDALLAH"],  fiche: "Negociation Achat.pdf",                            duration: "2 jours",  price: 40000 },
  { title: "Stratégie achats internationaux",                   cat: "achats-international", trainers: ["ABDALLAH"],  fiche: "Strategie_Achats_Internationaux.pdf",              duration: "3 jours",  price: 50000 },
  { title: "Sourcing global & gestion fournisseurs",            cat: "achats-international", trainers: ["ABDALLAH"],  fiche: "Achats_Internationaux_Sourcing.pdf",               duration: "2 jours",  price: 45000 },
  { title: "Négociation avancée (leviers et techniques)",       cat: "achats-international", trainers: ["REMRAM"],    fiche: "Negociation_Avancee_BATNA_ZOPA.pdf",              duration: "2 jours",  price: 40000 },
  { title: "Gestion des risques fournisseurs",                  cat: "achats-international", trainers: ["ABDALLAH"],  duration: "2 jours",  price: 40000 },
  { title: "Contractualisation internationale",                 cat: "achats-international", trainers: ["ABDALLAH"],  fiche: "Contractualisation Internationale.pdf",            duration: "2 jours",  price: 45000 },
  { title: "Douane et dédouanement : procédures import/export", cat: "achats-international", trainers: ["KHELIFA_N"], fiche: "Dedouanement Import Export.pdf",                  duration: "2 jours",  price: 40000 },

  // IT & Digital
  { title: "Formation Systèmes d'Information",                  cat: "it-digital",           trainers: ["BENLHADJ"],  fiche: "Systemes Information.pdf",                         duration: "3 jours",  price: 45000 },
  { title: "Formation Réseaux Informatiques",                   cat: "it-digital",           trainers: ["BENLHADJ"],  fiche: "Reseaux Informatiques.pdf",                        duration: "3 jours",  price: 45000 },
  { title: "GLPI",                                              cat: "it-digital",           trainers: ["AMALOU"],    duration: "2 jours",  price: 35000 },

  // RH & Management
  { title: "GEPP (Gestion des Emplois et des Parcours Professionnels)", cat: "rh-management", trainers: ["BENZAID"], fiche: "GEPP.pdf",                                         duration: "3 jours",  price: 45000 },
  { title: "L'essentiel de la paie pour DRH et RRH",           cat: "rh-management",        trainers: ["MEKAOUI"],   fiche: "Expert paie 360.pdf",                              duration: "2 jours",  price: 40000 },
  { title: "Management d'équipe et leadership en milieu financier", cat: "rh-management",   trainers: ["REMRAM"],    fiche: "Management_Leadership.pdf",                        duration: "2 jours",  price: 40000 },
  { title: "Gestion du stress",                                 cat: "rh-management",        trainers: ["MEHDAOUI"],  fiche: "Gestion du temps et du stress.pdf",                duration: "1 jour",   price: 25000 },
  { title: "Leadership en entreprise",                          cat: "rh-management",        trainers: ["REMRAM"],    fiche: "Leadership_Strategique_Excellence_Manageriale.pdf",duration: "2 jours",  price: 40000 },
  { title: "Gestion des conflits",                              cat: "rh-management",        trainers: ["MEHDAOUI"],  fiche: "Gestion des conflits.pdf",                         duration: "1 jour",   price: 25000 },
  { title: "Résolution de problèmes (Ishikawa, RCA)",           cat: "rh-management",        trainers: ["MOUATS"],    fiche: "Resolution_Problemes_ISHIKAWA_RCA.pdf",            duration: "2 jours",  price: 35000 },
  { title: "Formation des Formateurs",                          cat: "rh-management",        trainers: ["KASMI"],     duration: "3 jours",  price: 45000 },

  // Juridique & Conformité
  { title: "Protection des données personnelles (Loi 18-07)",   cat: "juridique-conformite", trainers: ["BOUABDALLAH"],fiche: "Protection des données Algérie.pdf",             duration: "2 jours",  price: 40000 },
  { title: "La fonction de juriste d'une entreprise publique économique", cat: "juridique-conformite", trainers: ["BRAHIMI"], duration: "2 jours", price: 40000 },

  // Maritime & Import/Export
  { title: "Réglementation portuaire et maritime",              cat: "maritime-import-export",trainers: ["SIDISAID"],  fiche: "Fondamentaux réglementation maritime.pdf",        duration: "2 jours",  price: 35000 },
  { title: "Gestion des flux import/export",                    cat: "maritime-import-export",trainers: ["ZOUBIRI"],   fiche: "Gestion Flux Import Export.pdf",                  duration: "2 jours",  price: 40000 },
  { title: "Douane & réglementation (locale et CCI)",           cat: "maritime-import-export",trainers: ["ZOUBIRI"],   fiche: "Douane Reglementation.pdf",                       duration: "2 jours",  price: 40000 },
  { title: "Planification (S&OP)",                              cat: "maritime-import-export",trainers: ["BRAHIMI","ZOUBIRI"], fiche: "Planification_SOP.pdf",                  duration: "2 jours",  price: 40000 },
  { title: "Chargement et arrimage des marchandises",           cat: "maritime-import-export",trainers: ["ZOUBIRI"],   duration: "1 jour",   price: 25000 },

  // Qualité & Production
  { title: "Formation initiation au management qualité ISO 9001",cat: "qualite-production",  trainers: ["ZERHOUNI"],  fiche: "ISO 9001.pdf",                                     duration: "3 jours",  price: 45000 },
  { title: "Kaizen / amélioration continue",                    cat: "qualite-production",   trainers: ["ZEMOUR"],    fiche: "Kaizen_Amelioration_Continue.pdf",                 duration: "2 jours",  price: 35000 },
  { title: "Gestion de stock",                                  cat: "qualite-production",   trainers: ["BAHLOUL"],   fiche: "Gestion_des_Stocks.pdf",                           duration: "2 jours",  price: 35000 },

  // Langues
  { title: "Formation langue étrangère — Anglais professionnel",cat: "langues",              trainers: ["EDUCTECH"],   duration: "À définir", price: 35000 },

  // Audit
  { title: "Théorie et pratique de l'audit interne",            cat: "audit",                trainers: ["AHMED_ANISS"],fiche: "Audit interne.pdf",                               duration: "3 jours",  price: 50000 },
  { title: "Audit Interne",                                     cat: "audit",                trainers: ["KABIR"],      duration: "3 jours",  price: 50000 },
  { title: "Formation Audit fournisseur",                       cat: "audit",                trainers: ["KABIR"],      duration: "2 jours",  price: 45000 },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Démarrage du seed...\n");

  // 1. Compte admin
  const adminEmail = "admin@in-academy.dz";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existing) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        hashedPassword: await bcrypt.hash("Admin1234!", 12),
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });
    console.log("✓ Compte admin créé : admin@in-academy.dz / Admin1234!");
  } else {
    console.log("✓ Compte admin existant");
  }

  // 2. Catégories
  const catMap: Record<string, string> = {};
  for (const cat of CATEGORIES) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name },
      create: { slug: cat.slug, name: cat.name },
    });
    catMap[cat.slug] = c.id;
  }
  console.log(`✓ ${CATEGORIES.length} catégories`);

  // 3. Formateurs
  const trainerMap: Record<string, string> = {};
  for (const t of TRAINERS) {
    const existing = await prisma.trainer.findFirst({
      where: { displayName: t.displayName },
    });
    if (existing) {
      trainerMap[t.key] = existing.id;
      continue;
    }
    const created = await prisma.trainer.create({
      data: {
        firstName:   t.firstName,
        lastName:    t.lastName,
        displayName: t.displayName,
        speciality:  t.speciality,
        cvUrl:       t.cvUrl,
        isActive:    true,
      },
    });
    trainerMap[t.key] = created.id;
  }
  console.log(`✓ ${TRAINERS.length} formateurs`);

  // 4. Formations + liaisons formateurs
  let created = 0;
  for (const f of FORMATIONS) {
    const formationSlug = slug(f.title);
    const catId = catMap[f.cat];
    if (!catId) { console.warn(`  ⚠ Catégorie inconnue : ${f.cat}`); continue; }

    const formation = await prisma.formation.upsert({
      where: { slug: formationSlug },
      update: {
        title:             f.title,
        categoryId:        catId,
        duration:          f.duration,
        price:             f.price,
        ficheTechniqueUrl: f.fiche,
        isActive:          true,
      },
      create: {
        slug:              formationSlug,
        title:             f.title,
        categoryId:        catId,
        duration:          f.duration,
        price:             f.price,
        ficheTechniqueUrl: f.fiche,
        isCertifying:      true,
        isActive:          true,
      },
    });

    // Liaisons Formation ↔ Trainer
    for (let i = 0; i < f.trainers.length; i++) {
      const tKey = f.trainers[i];
      const trainerId = trainerMap[tKey];
      if (!trainerId) { console.warn(`  ⚠ Formateur inconnu : ${tKey}`); continue; }
      await prisma.formationTrainer.upsert({
        where: { formationId_trainerId: { formationId: formation.id, trainerId } },
        update: { isPrimary: i === 0 },
        create: { formationId: formation.id, trainerId, isPrimary: i === 0 },
      });
    }
    created++;
  }
  console.log(`✓ ${created} formations avec formateurs`);

  console.log("\n✅ Seed terminé !");
  console.log("→ Connectez-vous sur http://localhost:3000/connexion");
  console.log("   Email    : admin@in-academy.dz");
  console.log("   Password : Admin1234!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
