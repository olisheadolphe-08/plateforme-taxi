# 🚕 TaxiGo — Plateforme de réservation de taxi

Application web permettant à une société de taxi de recevoir des demandes de
réservation en ligne, et de les gérer depuis un back-office (statuts, taxis,
chauffeurs). Réalisée dans le cadre d'un test technique.

**Démo** : formulaire client public + espace administrateur protégé par
connexion.

---

## Sommaire

- [Choix techniques](#choix-techniques)
- [Architecture](#architecture)
- [Modèle de données](#modèle-de-données)
- [Installation](#installation)
- [Lancement du projet](#lancement-du-projet)
- [Compte administrateur de démonstration](#compte-administrateur-de-démonstration)
- [API — endpoints principaux](#api--endpoints-principaux)
- [Gestion des statuts et de la disponibilité](#gestion-des-statuts-et-de-la-disponibilité)
- [Pistes d'évolution](#pistes-dévolution)

---

## Choix techniques

| Couche          | Choix                                   | Pourquoi |
|-----------------|------------------------------------------|----------|
| Frontend        | **React 18 + Vite + Tailwind CSS**       | Démarrage rapide, HMR instantané, Tailwind permet un design cohérent et responsive sans surcharge CSS. React Router gère la navigation publique / admin. |
| Backend         | **PHP 8 "vanilla" (PDO), sans framework** | Le sujet impose peu de contraintes ; une architecture MVC simple (routes → contrôleurs → modèles) reste lisible, sans la lourdeur d'installer Laravel/Symfony pour un périmètre de ce type. Prépare le terrain pour migrer vers un framework si le projet grossit. |
| Base de données | **PostgreSQL**                       | Adapté aux données relationnelles du projet (réservations ↔ taxis ↔ chauffeurs), contraintes `CHECK` et transactions solides, disponible partout, facile à héberger chez un client. |
| Auth admin      | **Jeton signé HMAC ("JWT-lite"), sans dépendance** | Stateless (pas de table de sessions à gérer), simple à auditer/expliquer, suffisant pour le périmètre du test. Le jeton est vérifié par signature + expiration dans `AuthMiddleware`. |

Aucune bibliothèque tierce n'est requise côté backend (pas de Composer) : le
projet reste lisible de bout en bout pour l'évaluation. Côté frontend, seules
`react-router-dom` (navigation) et Tailwind (styles) sont ajoutées.

## Architecture

```
plateforme-taxi/
├── frontend/                  # React + Vite + Tailwind (SPA)
│   └── src/
│       ├── components/        # UI réutilisable (common / reservation / admin)
│       ├── layouts/           # Layout public (Navbar/Footer) et layout admin (sidebar)
│       ├── pages/              # Une page = une route
│       ├── pages/admin/        # Pages protégées du back-office
│       ├── services/api.js     # Client HTTP unique (fetch + gestion d'erreurs)
│       ├── hooks/useAuth.jsx   # Contexte d'authentification admin
│       └── utils/              # Validation de formulaire + formatage
│
├── backend/                   # API REST PHP (architecture MVC légère)
│   ├── public/index.php        # Point d'entrée unique (front controller)
│   ├── routes/api.php          # Table de routage (méthode + URI → contrôleur)
│   ├── controllers/            # Logique de requête/réponse + validation
│   ├── models/                  # Accès aux données (PDO, requêtes préparées)
│   ├── middleware/              # AuthMiddleware (vérifie le jeton admin)
│   ├── utils/                   # Response (JSON uniforme), Env, Jwt
│   └── config/                  # Connexion DB, CORS
│
└── database/
    └── schema.sql              # Schéma complet + données de démonstration
```

**Principe** : le frontend ne communique jamais directement avec la base ; il
appelle uniquement l'API REST (`services/api.js`). Toutes les routes sous
`/api/admin/*` exigent un jeton valide (vérifié par `AuthMiddleware`) ; les
routes de réservation client (`POST /api/reservations`,
`GET /api/reservations/lookup`) sont publiques.

Chaque réponse API suit un format unique (`utils/Response.php`) :
```json
{ "success": true, "message": "...", "data": { ... } }
{ "success": false, "message": "...", "errors": { "champ": "message" } }
```
ce qui simplifie la gestion des erreurs côté frontend (`ApiError` dans
`services/api.js`).

## Modèle de données

- **admins** — comptes du back-office (email + mot de passe hashé bcrypt).
- **chauffeurs** — identité, permis, statut (`disponible` / `indisponible` / `en_course`).
- **taxis** — véhicule, capacité, statut, éventuellement lié à un chauffeur (`chauffeur_id`).
- **reservations** — demande client (coordonnées, trajet, date/heure, passagers,
  remarque), `statut` (`en_attente` / `confirmee` / `annulee` / `terminee`),
  éventuellement liée à un `taxi_id` / `chauffeur_id` une fois confirmée.
- **reservation_status_history** — journal de chaque changement de statut
  (ancien → nouveau, commentaire, administrateur, date) : traçabilité complète
  et affichée dans le détail d'une réservation côté admin.

Voir `database/schema.sql` pour le détail des colonnes, contraintes et index
(recherche par statut, par date, par référence).

## Installation

### Prérequis
- PHP ≥ 8.1 avec l'extension `pdo_pgsql`
- PostgreSQL ≥ 13
- Node.js ≥ 18 et npm

### 1. Base de données

```bash
createdb plateforme_taxi
psql -d plateforme_taxi -f database/schema.sql
```

Cela crée les tables dans la base `plateforme_taxi` (à créer au préalable,
PostgreSQL ne le fait pas dans le même script), et insère des données de
démonstration (chauffeurs, taxis, un compte admin — voir plus bas).

### 2. Backend

```bash
cd backend
cp .env.example .env
# éditer .env si vos identifiants PostgreSQL diffèrent (DB_USER, DB_PASSWORD, DB_PORT...)
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
```

## Lancement du projet

**Backend** (serveur de développement intégré à PHP) :
```bash
cd backend
php -S localhost:8000 -t public
```
L'API est alors disponible sur `http://localhost:8000/api/...`.

**Frontend** :
```bash
cd frontend
npm run dev
```
L'application est disponible sur `http://localhost:5173`.

> En production, pointez un vhost Apache/Nginx vers `backend/public` (le
> `.htaccess` fourni gère déjà la réécriture d'URL pour Apache) et servez le
> build du frontend (`npm run build` → dossier `dist/`) via un serveur
> statique ou le même vhost.

## Créer un compte administrateur

Il n'y a **aucun compte de démonstration** codé en dur : la base démarre
vide et le mot de passe admin n'existe jamais en clair dans le code source.

```bash
cd backend
php scripts/create-admin.php
```

Le script demande nom, prénom, email et mot de passe, puis crée le compte
avec un mot de passe correctement haché (bcrypt). Connexion ensuite sur
`http://localhost:5173/admin/connexion`.

## API — endpoints principaux

| Méthode | Route                                   | Accès  | Description |
|---------|------------------------------------------|--------|--------------|
| POST    | `/api/reservations`                       | Public | Créer une demande de réservation |
| GET     | `/api/reservations/lookup?reference=...`  | Public | Récapitulatif + statut d'une réservation |
| POST    | `/api/auth/login`                         | Public | Connexion admin (retourne un jeton) |
| GET     | `/api/auth/me`                            | Admin  | Vérifier la session courante |
| GET     | `/api/admin/dashboard`                    | Admin  | Statistiques (total, par statut, du jour) |
| GET     | `/api/admin/reservations?statut=&search=` | Admin  | Liste filtrable des réservations |
| GET     | `/api/admin/reservations/{id}`            | Admin  | Détail + historique d'une réservation |
| PATCH   | `/api/admin/reservations/{id}/statut`     | Admin  | Changer le statut (+ assigner un taxi) |
| GET/POST/PATCH/DELETE | `/api/admin/taxis[/{id}]`        | Admin  | CRUD des taxis |
| GET/POST/PATCH/DELETE | `/api/admin/chauffeurs[/{id}]`   | Admin  | CRUD des chauffeurs |
| GET     | `/api/reservations/lookup-par-telephone?telephone=...` | Public | Retrouver ses réservations (référence perdue) |
| GET     | `/api/admin/notifications`                | Admin  | Dernières notifications |
| GET     | `/api/admin/notifications/non-lues`       | Admin  | Nombre de notifications non lues |
| PATCH   | `/api/admin/notifications/{id}/lue`       | Admin  | Marquer une notification comme lue |
| PATCH   | `/api/admin/notifications/lues`           | Admin  | Tout marquer comme lu |

Les routes admin attendent un en-tête `Authorization: Bearer <token>` obtenu
via `/api/auth/login`.

## Gestion des statuts et de la disponibilité

- Une réservation naît toujours au statut `en_attente`.
- Pour passer au statut `confirmee`, un taxi disponible doit être assigné
  (imposé côté backend dans `ReservationController::updateStatut`, et reflété
  côté UI dans `ReservationDetails.jsx`) — le chauffeur associé au taxi est
  déduit automatiquement.
- **Conflit de taxi** : un taxi ne peut pas être assigné à deux trajets
  différents à la même date et à la même heure. Le backend
  (`ReservationController::updateStatut` + `Reservation::findTaxiConflict`)
  répond alors par une erreur HTTP 409 avec un message explicite affiché dans
  le formulaire admin. Un même trajet à la même heure reste autorisé, et les
  réservations annulées ou terminées sont ignorées.
- Chaque changement de statut est journalisé dans
  `reservation_status_history` avec l'administrateur responsable et un
  commentaire optionnel, visible dans le détail de la réservation.
- Les pages **Taxis** et **Chauffeurs** du back-office permettent de créer,
  modifier, filtrer par disponibilité (`disponible` / `en_course` /
  `indisponible`) et supprimer les ressources — indépendamment du cycle de
  vie des réservations.

## Validation et gestion des erreurs

- **Client** : validation en temps réel dans `utils/validators.js` (mêmes
  règles que le serveur : téléphone, email, dates futures, passagers 1–8,
  départ ≠ destination) pour un retour immédiat, sans appel réseau inutile.
- **Serveur** : chaque contrôleur revalide entièrement les données reçues
  (ne jamais faire confiance au client) et retourne un tableau d'erreurs par
  champ avec le code HTTP 422.
- **Réseau** : `services/api.js` capture les erreurs de connexion (API non
  démarrée, etc.) et les affiche via des composants `Alert` dédiés plutôt que
  de laisser l'interface planter.

## Notifications

Fonctionnalité complémentaire (non demandée explicitement, mais dans l'esprit
du sujet qui invite à proposer des ajouts pertinents) :

- **Côté admin** : une notification est créée automatiquement à chaque
  nouvelle demande de réservation (table `notifications`). Une cloche 🔔
  dans le back-office affiche le nombre non lu, sondée toutes les 15s, avec
  un menu déroulant permettant de marquer comme lu et d'ouvrir la
  réservation concernée.
- **Côté client** : à chaque changement de statut fait par l'admin
  (confirmée / annulée / terminée), une notification est également créée,
  et un email est envoyé au client si une adresse a été renseignée
  (best-effort via `Mailer.php` — voir limitation ci-dessous). La page de
  suivi (`/suivi`) et la page de confirmation se mettent à jour toutes les
  15s tant que le statut n'est pas final, avec une bannière et une
  notification navigateur (sur autorisation) dès qu'un changement est
  détecté.
- **Référence oubliée** : recherche de secours par numéro de téléphone sur
  `/suivi`, et la référence est envoyée par email dès la création si un
  email a été fourni.

> ⚠️ **Limitation connue** : l'envoi d'email utilise `mail()` natif de PHP,
> qui nécessite un serveur SMTP/sendmail configuré sur la machine. Sous
> XAMPP/Windows en local, ça ne fonctionne pas sans configuration
> supplémentaire. Un échec d'envoi est silencieux et n'interrompt jamais le
> flux principal (la notification "en base" reste la source de vérité). En
> production, remplacer par une vraie intégration SMTP (PHPMailer +
> fournisseur comme SendGrid/Mailtrap).

Si tu ajoutes cette table à une base déjà créée avec une version antérieure
du schéma :
```bash
psql -U postgres -d plateforme_taxi -f database/migration_notifications.sql
```

## Pistes d'évolution

- Pagination côté serveur pour la liste des réservations (au-delà d'un
  volume de démonstration).
- Vraie intégration SMTP pour un envoi d'email fiable (voir limitation
  ci-dessus), et notification SMS.
- Calcul automatique d'un tarif indicatif à partir de la distance.
- Rôles multiples côté admin (opérateur / superviseur) avec permissions
  différenciées.
- Lier automatiquement le statut d'un chauffeur/taxi (`en_course`) au
  cycle de vie de la réservation qui lui est assignée, plutôt que de le
  gérer manuellement dans la page Chauffeurs/Taxis.
- Étendre la couverture de tests aux endpoints API (tests d'intégration
  avec base de test dédiée) et aux composants React (React Testing Library).

## Tests automatisés

### Backend (PHPUnit)

Les tests couvrent la logique métier pure (validation du formulaire, JWT,
libellés de statut) sans nécessiter de base de données connectée.

```bash
cd backend
composer install
vendor/bin/phpunit
```

### Frontend (Vitest)

Les tests couvrent les fonctions de validation et de formatage
(`utils/validators.js`, `utils/format.js`), utilisées à la fois en temps
réel dans le formulaire et en miroir de la validation serveur.

```bash
cd frontend
npm install
npm test
```

> Ces tests se concentrent volontairement sur la logique pure (validation,
> formatage, JWT), rapide à exécuter et sans dépendance externe. Une suite
> plus complète ajouterait des tests d'intégration sur les endpoints API
> (nécessitant une base de test dédiée) et des tests de composants React
> (React Testing Library) pour les interactions de formulaire.

## Déploiement / démo en ligne

Le projet est conçu pour tourner en local, mais peut être déployé
rapidement grâce au `Dockerfile` fourni dans `backend/` :

1. **Base de données** : créer une instance PostgreSQL managée (Render,
   Railway, Supabase, Neon... ont toutes une offre gratuite), puis exécuter
   `database/schema.sql` dessus (`psql <url-de-connexion> -f database/schema.sql`).
2. **Backend** : déployer `backend/` comme *Web Service* Docker sur
   Render/Railway (ils détectent le `Dockerfile` automatiquement). Configurer
   les variables d'environnement du service avec les valeurs de `.env.example`
   (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` fournis par la
   base managée, `JWT_SECRET` généré aléatoirement, `CORS_ORIGIN` = l'URL du
   frontend une fois déployé).
3. **Compte admin** : une fois le backend en ligne, exécuter
   `php scripts/create-admin.php` en local en pointant temporairement `.env`
   vers la base de production (ou lancer la même commande via un shell
   distant si la plateforme le permet).
4. **Frontend** : déployer `frontend/` sur Vercel/Netlify (build command
   `npm run build`, dossier de sortie `dist/`). Définir `VITE_API_URL` (voir
   `frontend/.env.example`) vers l'URL du backend déployé.

Aucune de ces plateformes n'est imposée : l'important est que le backend
PHP+PostgreSQL et le frontend statique soient hébergés indépendamment, avec
`CORS_ORIGIN` et `VITE_API_URL` alignés sur les URLs réelles.
