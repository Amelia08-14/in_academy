# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primaire — entreprises (B2B).** Administrateurs RH/formation d'entreprises algériennes qui commandent des formations groupe/intra-entreprise pour leurs équipes : panier multi-formations → demande de devis → dépôt du reçu de paiement → acceptation du devis → inscriptions confirmées. Suivi ensuite depuis un espace entreprise dédié (devis, formations, salariés).

**Secondaire — apprenants particuliers (B2C).** S'inscrivent individuellement à des sessions de formation, gèrent leur profil et leurs documents depuis un dashboard personnel.

**Formateurs experts métier.** Candidatent pour rejoindre le catalogue de formateurs via « Devenir collaborateur » (CV obligatoire, fiches techniques optionnelles), revus par l'équipe back-office avant d'apparaître publiquement sur `/formateurs`.

**Équipe back-office IN Academy** (admin/manager). Pilote l'intégralité du catalogue : formations, branches, sessions, devis B2B, formateurs, candidatures, documents déposés, partenaires/avantages, événements, utilisateurs.

## Product Purpose

Centre de formation professionnelle certifiante basé à Hydra, Alger, membre de La Maison IN Groupe. Propose des formations par secteur métier (12 branches : Transport & Logistique, Commerce & Ventes, HSE & Sécurité, Finance & Comptabilité, Achats & Commerce International, IT & Digital, RH & Management, Juridique & Conformité, Maritime & Import/Export, Qualité & Production, Langues, Audit) à des particuliers comme à des entreprises. Le succès se mesure en inscriptions confirmées — individuelles ou groupe — qui aboutissent à des formations effectivement dispensées et certifiées.

## Positioning

Le différenciateur mis en avant est le **réseau de formateurs** : des experts métier réellement reconnus dans leur secteur (pas des formateurs génériques), présentés nommément avec leur spécialité sur `/formateurs`. L'appartenance à La Maison IN Groupe (aux côtés de IN Network, IN Com) renforce cette crédibilité par le réseau et le poids du groupe — un avantage qu'un centre de formation indépendant ne peut pas revendiquer aussi facilement.

## Operating Context

- **Parcours B2B :** inscription entreprise → panier de formations → demande de devis → l'admin envoie le devis → l'entreprise dépose un reçu de paiement *postérieur à la création du devis* → acceptation du devis → inscriptions confirmées automatiquement.
- **Parcours B2C :** inscription particulier (email/mot de passe, profil, date d'anniversaire optionnelle) → dashboard (formations en cours/historique, profil, documents, avantages partenaires).
- **Parcours formateur :** candidature publique « Devenir collaborateur » avec CV requis → revue et changement de statut en back-office (`/admin/candidatures`) → devient un profil `Trainer` géré séparément (`/admin/formateurs`).
- **Back-office complet :** formations, branches, sessions, devis B2B, formateurs, candidatures, documents (reçus de paiement / dossiers administratifs), partenaires (avantages type réduction hôtel), utilisateurs, et « Nos Events ».
- **Deux sessions strictement séparées :** le site public (apprenant/entreprise) et le back-office admin utilisent des tokens et un stockage de session totalement indépendants — aucun chevauchement voulu.
- **Emails transactionnels :** confirmation d'inscription, devis envoyé, notifications admin (nouveau document déposé, nouvelle candidature), réinitialisation de mot de passe.

## Capabilities and Constraints

- Rôles : `LEARNER`, `COMPANY_ADMIN`, `TRAINER`, `ADMIN` / `MANAGER` / `SUPER_ADMIN`.
- Un devis B2B ne peut être accepté que si un reçu de paiement a été déposé *après* la création de ce devis précis (règle anti-contournement).
- Candidature formateur : CV obligatoire ; fiches techniques additionnelles optionnelles.
- Le site est actuellement **exclusivement en français**. L'arabe/RTL est un **engagement ferme de roadmap**, pas une hypothèse — non encore implémenté.
- Le caractère « certifiant » des formations s'appuie sur la reconnaissance du **Ministère algérien de la Formation professionnelle** — ne jamais gonfler ni substituer un autre organisme dans les textes futurs sans confirmation.
- Stack technique (Next.js App Router, Express 5, Prisma 7, MySQL, monorepo `frontend/`/`backend/`) déjà en place et déductible du code — non redétaillée ici.

## Brand Commitments

- Nom : **IN ACADEMY**, membre de **La Maison IN Groupe** (aux côtés de IN Network, IN Com).
- Identité visuelle déjà établie (palette navy/or/teal/beige, typographies Bricolage Grotesque + Inter + IBM Plex Mono) — à documenter séparément via `/impeccable document` plutôt que redéfinie ici.
- Logo : `frontend/public/images/logo_in_academy.png` (+ variante blanche pour le footer sombre).
- Siège : N8 Parc Paradou, Hydra, Alger, Algérie.
- Contact uniformisé : `formation.in.academy@gmail.com` / `0560 06 74 85`.

## Evidence on Hand

- Vraies photos par secteur de formation intégrées (`frontend/public/branches/*`, une par branche, sourcées depuis la banque photo réelle du client).
- Profils formateurs réels avec CV et spécialité en back-office (`/admin/formateurs`).
- Deux vidéos témoignages réelles existent (Drive, ~580 Mo et ~442 Mo) mais **pas encore intégrées** — hébergement externe (YouTube/Vimeo non listé) à prévoir. Ne pas inventer de témoignage en attendant.
- Lien Google Maps réel du siège intégré (mentions légales + page contact).
- Pas de témoignages écrits ni de logos clients/partenaires publiés à ce jour, hormis une offre partenaire (« Hôtel Hydra »). Ne pas fabriquer de logos ou citations clients.

## Product Principles

1. Le B2B (devis groupe/entreprise) est le moteur prioritaire — toute décision de priorisation doit d'abord servir le parcours administrateur RH/entreprise (devis → paiement → inscriptions), le B2C restant un canal complémentaire à ne pas négliger.
2. La crédibilité du site repose sur un réseau réel de formateurs experts métier — ne jamais présenter de formateur ou d'expertise fictive ; chaque profil affiché doit être réel.
3. Toute formulation « certifiant »/accréditation reste fidèle à la reconnaissance par le Ministère algérien de la Formation professionnelle, sans exagération ni invention d'un autre organisme.
4. L'arabe/RTL est un engagement de roadmap réel — les futurs travaux de contenu et de structure devraient anticiper une double lecture FR/AR plutôt que la traiter comme un cas marginal.
5. La séparation stricte entre session site public et session back-office est une contrainte produit délibérée à préserver, pas un détail d'implémentation à simplifier.
