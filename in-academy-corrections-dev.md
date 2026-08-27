# IN ACADEMY — Brief de développement (in-academy.dz)

> Compilé à partir de la « Synthèse globale — Audit du site IN ACADEMY » (compilation des retours IN COM, IN Network et IN Academy). Aucun contenu inventé — les données manquantes sont signalées explicitement.
> Usage : coller ce fichier tel quel dans Claude Code, sur le repo `in-academy.dz`.

## Contexte technique

Stack de référence LMIG (tous projets) : Next.js 16 (App Router) / React 19 / TypeScript strict / Tailwind CSS v4 / shadcn/ui / Express 5 / Prisma 7 / MySQL / VPS (Nginx + PM2 + Certbot).

État connu : IN ACADEMY est live sur in-academy.dz, ~90% d'avancement, aucun écart de stack signalé à ce jour contrairement à IN NETWORK. Vérifier rapidement `package.json` vs la cible avant de commencer (§0) — sans bloquer les tâches fonctionnelles si l'écart s'avère mineur.

---

## §0 — P0 : Vérification stack (rapide, non bloquante)

1. Inventorier `package.json` (frontend + backend) : versions Next.js, React, TypeScript, Tailwind, Prisma.
2. Comparer à la stack de référence ci-dessus. Si écart significatif détecté, le signaler à Amelia avant migration (même traitement que IN NETWORK §0) plutôt que de migrer silencieusement.

---

## §1 — P0 : Bug bloquant — le site se fige après usage prolongé

- Symptôme : blocage du site après une utilisation prolongée, obligeant l'utilisateur à se reconnecter fréquemment.
- Action : investiguer la gestion de session/token (expiration, refresh token manquant ou mal géré) et chercher des fuites mémoire côté client (intervalles non nettoyés, cache SWR/React Query non borné, listeners non détachés).
- Root-cause avant patch — ne pas se contenter d'allonger la durée de session sans comprendre la cause du blocage.
- **Critère de fin** : session stable sur une utilisation continue de 30+ minutes, sans blocage ni déconnexion imprévue.

---

## §2 — P0 : Fonctionnalité manquante — mot de passe oublié

- Aucun lien « Mot de passe oublié » sur la page de connexion.
- Ajouter le lien + flux de réinitialisation sécurisé par email (lien à usage unique, expiration raisonnable).

---

## §3 — P1 : Corrections de texte (remplacements exacts)

| Existant | À remplacer par |
|---|---|
| « Notre missions » | « Nos missions » |
| « Notre Formations » | « Nos formations » |
| « Achats et International » | « Achats et Commerce International » |
| « Barber » | « Métiers du Barbering » |
| Email en « @Lmig-dz. » (mal formaté) | formation.in.academy@gmail.com |
| Téléphone +213 (0) 20 07 17 00 | (0560 06 74 85) |
| Texte capture « Vous êtes formateur ? Rejoignez notre équipe. » | « Vous êtes formateur ? Rejoignez notre équipe. IN Academy recrute des experts métier souhaitant contribuer à des formations certifiantes et transmettre leur expertise au sein d'un établissement de référence » |
| « Adresse : Hydra, alger » | « N8 Parc Paradou, Hydra, Alger. » — intégrer le lien Maps partout où l'adresse apparaît : https://maps.app.goo.gl/mGufMtpzVU2Rgazo9 |

Uniformiser email + téléphone sur toutes les pages où ils apparaissent (footer, contact, mentions légales le cas échéant).

---

## §4 — P1 : Contenu manquant

### 4.1 Horaires d'ouverture
- Absents de la page contact. Afficher : « Dimanche au jeudi, 09h–17h ».

### 4.2 Section événements
- Créer une rubrique « Nos Events » centralisant dates, photos et retours d'expérience des événements organisés par IN Academy.

### 4.3 Photos par section formation
- Constituer/intégrer une banque d'images par secteur de formation.
- **Déjà disponible** : banque d'images par secteur envoyée à Mme Benlhadj. Lien Drive : https://drive.google.com/drive/folders/1uZgqe9dRA28wDhcE9S-kLJ8uogH6zaSQ?usp=drive_link — récupérer les fichiers depuis ce lien plutôt que d'en générer/inventer.

### 4.4 Témoignages
- Aucun témoignage actuellement affiché. Intégrer les vidéos suivantes :
  - Témoignage formation Claude 1 : https://drive.google.com/file/d/12tiaRy-AAE_YLM2rcifEAvDALAQD6ihp/view?usp=drive_link
  - Témoignage formation Claude 2 : https://drive.google.com/file/d/1H8yOIaf-_yAdERp-r_XEnS3IC5Q1l2zI/view?usp=drive_link

### 4.5 Moyens de contact
- Actuellement limités à 1 téléphone + 1 email. Ajouter réseaux sociaux (LinkedIn), et aligner sur les coordonnées uniformisées du §3.

---

## §5 — P2 : Internationalisation (arabe)

- Ajouter une version arabe en complément du français, via un sélecteur de langue FR/AR visible sur toutes les pages.
- Implique : traduction des contenus clés (menus, pages formations, présentation IN Academy) + support technique du RTL (mise en page droite-à-gauche).
- Priorisation par étapes recommandée : d'abord pages essentielles (accueil, formations, contact), puis extension progressive au reste du contenu.

---

## Definition of Done

- [ ] Bug de session résolu et vérifié sur une session longue (30+ min)
- [ ] Flux « mot de passe oublié » fonctionnel de bout en bout
- [ ] Toutes les corrections de texte du §3 appliquées (grep pour vérifier qu'aucune occurrence de l'ancien texte ne subsiste)
- [ ] Coordonnées de contact identiques sur toutes les pages
- [ ] Horaires affichés sur la page contact
- [ ] Section « Nos Events » en place (même vide de contenu au lancement, la structure doit exister)
- [ ] Photos et témoignages intégrés depuis les liens Drive fournis — pas de placeholder restant
- [ ] Build de production sans erreur (`npm run build`)

---
*Source : « Synthèse globale — Audit du site IN ACADEMY » (compilation retours IN COM, IN Network, IN Academy). Compilé le 26/08/2026.*
