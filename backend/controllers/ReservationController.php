<?php

class ReservationController
{
    private Reservation $reservationModel;

    public function __construct(Reservation $reservationModel)
    {
        $this->reservationModel = $reservationModel;
    }

    /**
     * POST /api/reservations (public)
     */
    public function store(): never
    {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!is_array($input)) {
            Response::error('Le corps de la requête doit être un JSON valide.', null, 400);
        }

        $data = [
            'nom_client' => trim($input['nom_client'] ?? ''),
            'prenom_client' => trim($input['prenom_client'] ?? ''),
            'telephone_client' => trim($input['telephone_client'] ?? ''),
            'email_client' => trim($input['email_client'] ?? ''),
            'lieu_depart' => trim($input['lieu_depart'] ?? ''),
            'destination' => trim($input['destination'] ?? ''),
            'date_heure' => trim($input['date_heure'] ?? ''),
            'nombre_passagers' => $input['nombre_passagers'] ?? null,
            'remarque' => trim($input['remarque'] ?? '')
        ];

        $errors = $this->validate($data);

        if (!empty($errors)) {
            Response::error('Les données fournies sont invalides.', $errors, 422);
        }

        try {
            $reservation = $this->reservationModel->create($data);

            Response::success('Réservation créée avec succès.', $reservation, 201);

        } catch (PDOException $e) {
            error_log($e->getMessage());

            Response::error(
                'Une erreur est survenue lors de la création de la réservation.',
                null,
                500
            );
        }
    }

    /**
     * GET /api/reservations/lookup?reference=RES-... (public)
     * Utilisé par le client pour consulter le récapitulatif / statut.
     */
    public function lookup(): never
    {
        $reference = trim($_GET['reference'] ?? '');

        if ($reference === '') {
            Response::error(
                'La référence de réservation est obligatoire.',
                ['reference' => 'Champ requis.'],
                422
            );
        }

        $reservation = $this->reservationModel->findByReference($reference);

        if ($reservation === null) {
            Response::error('Aucune réservation trouvée pour cette référence.', null, 404);
        }

        Response::success('Réservation trouvée.', $reservation);
    }

    /**
     * GET /api/reservations/lookup-par-telephone?telephone=... (public)
     * Recherche de secours quand le client a perdu sa référence.
     */
    public function lookupByTelephone(): never
    {
        $telephone = trim($_GET['telephone'] ?? '');

        if ($telephone === '') {
            Response::error(
                'Le numéro de téléphone est obligatoire.',
                ['telephone' => 'Champ requis.'],
                422
            );
        }

        $reservations = $this->reservationModel->findByTelephone($telephone);

        Response::success('Réservations trouvées.', $reservations);
    }

    /**
     * GET /api/admin/reservations (protégé)
     */
    public function index(): never
    {
        $statut = $_GET['statut'] ?? null;

        if ($statut !== null && !in_array($statut, Reservation::statutsValides(), true)) {
            Response::error('Statut de filtre invalide.', null, 422);
        }

        $filters = [
            'statut' => $statut,
            'search' => $_GET['search'] ?? null,
            'page' => $_GET['page'] ?? 1,
            'per_page' => $_GET['per_page'] ?? 20
        ];

        Response::success('Liste des réservations.', $this->reservationModel->all($filters));
    }

    /**
     * GET /api/admin/reservations/{id} (protégé)
     */
    public function show(int $id): never
    {
        $reservation = $this->reservationModel->find($id);

        if ($reservation === null) {
            Response::error('Réservation introuvable.', null, 404);
        }

        Response::success('Détail de la réservation.', $reservation);
    }

    /**
     * PATCH /api/admin/reservations/{id}/statut (protégé)
     */
    public function updateStatut(int $id, array $authPayload): never
    {
        $existing = $this->reservationModel->find($id);

        if ($existing === null) {
            Response::error('Réservation introuvable.', null, 404);
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? [];

        $nouveauStatut = $input['statut'] ?? '';
        $commentaire = isset($input['commentaire']) ? trim((string) $input['commentaire']) : null;
        $taxiId = isset($input['taxi_id']) && $input['taxi_id'] !== '' ? (int) $input['taxi_id'] : null;
        $chauffeurId = isset($input['chauffeur_id']) && $input['chauffeur_id'] !== '' ? (int) $input['chauffeur_id'] : null;

        if (!in_array($nouveauStatut, Reservation::statutsValides(), true)) {
            Response::error(
                'Statut invalide.',
                ['statut' => 'Valeurs autorisées : ' . implode(', ', Reservation::statutsValides())],
                422
            );
        }

        // Une réservation confirmée doit se voir assigner un taxi.
        if ($nouveauStatut === 'confirmee' && $taxiId === null && empty($existing['taxi_id'])) {
            Response::error(
                'Un taxi doit être assigné pour confirmer la réservation.',
                ['taxi_id' => 'Champ requis pour confirmer.'],
                422
            );
        }

        // Un taxi ne peut pas être assigné à deux trajets différents au même
        // moment. On vérifie le taxi qui sera effectivement porté par la
        // réservation (nouveau taxi choisi, sinon celui déjà assigné).
        $taxiEffectif = $taxiId ?? (isset($existing['taxi_id']) ? (int) $existing['taxi_id'] : null);

        if ($taxiEffectif !== null && in_array($nouveauStatut, ['en_attente', 'confirmee'], true)) {
            $conflit = $this->reservationModel->findTaxiConflict(
                $taxiEffectif,
                $existing['date_heure'],
                $existing['lieu_depart'],
                $existing['destination'],
                $id
            );

            if ($conflit !== null) {
                $dt = new DateTime($conflit['date_heure']);
                $quand = $dt->format('d/m/Y') . ' à ' . $dt->format('H:i');

                Response::error(
                    "Ce taxi est déjà réservé le {$quand} pour un autre trajet " .
                    "({$conflit['lieu_depart']} → {$conflit['destination']}, réservation {$conflit['reference']}). " .
                    'Choisissez un autre taxi.',
                    ['taxi_id' => 'Taxi indisponible : trajet différent à la même date et heure.'],
                    409
                );
            }
        }

        $reservation = $this->reservationModel->updateStatut(
            $id,
            $nouveauStatut,
            $commentaire !== '' ? $commentaire : null,
            (int) ($authPayload['sub'] ?? 0) ?: null,
            $taxiId,
            $chauffeurId
        );

        Response::success('Statut mis à jour avec succès.', $reservation);
    }

    /**
     * GET /api/admin/dashboard (protégé)
     */
    public function dashboard(): never
    {
        Response::success('Statistiques du tableau de bord.', $this->reservationModel->stats());
    }

    private function validate(array $data): array
    {
        $errors = [];

        if ($data['nom_client'] === '') {
            $errors['nom_client'] = 'Le nom est obligatoire.';
        } elseif (mb_strlen($data['nom_client']) < 2) {
            $errors['nom_client'] = 'Le nom doit contenir au moins 2 caractères.';
        }

        if ($data['prenom_client'] === '') {
            $errors['prenom_client'] = 'Le prénom est obligatoire.';
        } elseif (mb_strlen($data['prenom_client']) < 2) {
            $errors['prenom_client'] = 'Le prénom doit contenir au moins 2 caractères.';
        }

        if ($data['telephone_client'] === '') {
            $errors['telephone_client'] = 'Le numéro de téléphone est obligatoire.';
        } elseif (!preg_match('/^[0-9+\s()-]{8,20}$/', $data['telephone_client'])) {
            $errors['telephone_client'] = 'Le numéro de téléphone est invalide.';
        }

        if ($data['email_client'] !== '' && !filter_var($data['email_client'], FILTER_VALIDATE_EMAIL)) {
            $errors['email_client'] = 'L\'adresse email est invalide.';
        }

        if ($data['lieu_depart'] === '') {
            $errors['lieu_depart'] = 'Le lieu de départ est obligatoire.';
        }

        if ($data['destination'] === '') {
            $errors['destination'] = 'La destination est obligatoire.';
        }

        if (
            $data['lieu_depart'] !== '' &&
            $data['destination'] !== '' &&
            mb_strtolower($data['lieu_depart']) === mb_strtolower($data['destination'])
        ) {
            $errors['destination'] = 'Le lieu de départ et la destination doivent être différents.';
        }

        if ($data['date_heure'] === '') {
            $errors['date_heure'] = 'La date et l\'heure sont obligatoires.';
        } else {
            $date = DateTime::createFromFormat('Y-m-d H:i', $data['date_heure']);
            $dateErrors = DateTime::getLastErrors();

            if (
                $date === false ||
                ($dateErrors !== false && ($dateErrors['warning_count'] > 0 || $dateErrors['error_count'] > 0))
            ) {
                $errors['date_heure'] = 'Le format doit être YYYY-MM-DD HH:MM.';
            } elseif ($date <= new DateTime()) {
                $errors['date_heure'] = 'La date de réservation doit être dans le futur.';
            }
        }

        if ($data['nombre_passagers'] === null || $data['nombre_passagers'] === '') {
            $errors['nombre_passagers'] = 'Le nombre de passagers est obligatoire.';
        } elseif (filter_var($data['nombre_passagers'], FILTER_VALIDATE_INT) === false) {
            $errors['nombre_passagers'] = 'Le nombre de passagers doit être un entier.';
        } elseif ((int) $data['nombre_passagers'] < 1 || (int) $data['nombre_passagers'] > 8) {
            $errors['nombre_passagers'] = 'Le nombre de passagers doit être compris entre 1 et 8.';
        }

        return $errors;
    }
}
