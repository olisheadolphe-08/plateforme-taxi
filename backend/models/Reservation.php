<?php

class Reservation
{
    private PDO $db;

    private const STATUTS_VALIDES = [
        'en_attente', 'confirmee', 'annulee', 'terminee'
    ];

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function create(array $data): array
    {
        $reference = $this->generateReference();

        $sql = "
            INSERT INTO reservations (
                reference,
                nom_client,
                prenom_client,
                telephone_client,
                email_client,
                lieu_depart,
                destination,
                date_heure,
                nombre_passagers,
                remarque,
                statut
            )
            VALUES (
                :reference,
                :nom_client,
                :prenom_client,
                :telephone_client,
                :email_client,
                :lieu_depart,
                :destination,
                :date_heure,
                :nombre_passagers,
                :remarque,
                'en_attente'
            )
            RETURNING id
        ";

        $this->db->beginTransaction();

        try {
            $stmt = $this->db->prepare($sql);

            $stmt->execute([
                ':reference' => $reference,
                ':nom_client' => $data['nom_client'],
                ':prenom_client' => $data['prenom_client'],
                ':telephone_client' => $data['telephone_client'],
                ':email_client' => $data['email_client'] !== '' ? $data['email_client'] : null,
                ':lieu_depart' => $data['lieu_depart'],
                ':destination' => $data['destination'],
                ':date_heure' => $data['date_heure'],
                ':nombre_passagers' => $data['nombre_passagers'],
                ':remarque' => $data['remarque'] !== '' ? $data['remarque'] : null
            ]);

            $id = (int) $stmt->fetchColumn();

            $historyStmt = $this->db->prepare("
                INSERT INTO reservation_status_history (
                    reservation_id, ancien_statut, nouveau_statut, commentaire
                )
                VALUES (:reservation_id, NULL, 'en_attente', 'Création de la réservation')
            ");

            $historyStmt->execute([':reservation_id' => $id]);

            // Notifie le back-office : nouvelle demande à traiter.
            $notificationModel = new Notification($this->db);
            $notificationModel->create(
                $id,
                'nouvelle_reservation',
                "Nouvelle demande de {$data['prenom_client']} {$data['nom_client']} : {$data['lieu_depart']} → {$data['destination']}"
            );

            $this->db->commit();

        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        // Best-effort : envoie la référence par email pour que le client
        // puisse la retrouver s'il l'égare (hors transaction, un échec
        // d'envoi ne doit jamais faire échouer la création elle-même).
        if (!empty($data['email_client'])) {
            Mailer::send(
                $data['email_client'],
                "Votre référence de réservation TaxiGo : {$reference}",
                "Bonjour {$data['prenom_client']},\n\n" .
                "Votre demande de réservation a bien été enregistrée.\n\n" .
                "Référence : {$reference}\n" .
                "Trajet : {$data['lieu_depart']} → {$data['destination']}\n\n" .
                "Conservez cette référence : elle vous permet de suivre l'état de votre course " .
                "à tout moment sur la page \"Suivi de réservation\" du site.\n\n" .
                "— TaxiGo"
            );
        }

        return [
            'id' => $id,
            'reference' => $reference,
            'statut' => 'en_attente'
        ];
    }

    /**
     * Liste paginée des réservations pour le back-office, avec filtres
     * optionnels par statut et recherche texte (nom, téléphone, référence).
     */
    public function all(array $filters = []): array
    {
        $baseSql = "
            FROM reservations r
            LEFT JOIN taxis t ON t.id = r.taxi_id
            LEFT JOIN chauffeurs c ON c.id = r.chauffeur_id
            WHERE 1 = 1
        ";

        $params = [];

        if (!empty($filters['statut'])) {
            $baseSql .= " AND r.statut = :statut";
            $params[':statut'] = $filters['statut'];
        }

        if (!empty($filters['search'])) {
            // ILIKE (spécifique PostgreSQL) : équivalent insensible à la
            // casse du LIKE MySQL sous collation utf8mb4_unicode_ci.
            $baseSql .= " AND (
                r.nom_client ILIKE :search OR
                r.prenom_client ILIKE :search OR
                r.telephone_client ILIKE :search OR
                r.reference ILIKE :search
            )";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        // Total correspondant aux filtres, indépendamment de la pagination
        // (nécessaire pour que le frontend sache combien de pages afficher).
        $countStmt = $this->db->prepare("SELECT COUNT(*) {$baseSql}");
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $offset = ($page - 1) * $perPage;

        $sql = "
            SELECT r.*, t.immatriculation, t.marque AS taxi_marque, t.modele AS taxi_modele,
                c.nom AS chauffeur_nom, c.prenom AS chauffeur_prenom
            {$baseSql}
            ORDER BY r.created_at DESC
            LIMIT :limit OFFSET :offset
        ";

        $stmt = $this->db->prepare($sql);

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return [
            'items' => $stmt->fetchAll(),
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'total_pages' => (int) ceil($total / $perPage)
            ]
        ];
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare("
            SELECT
                r.*,
                t.immatriculation, t.marque AS taxi_marque, t.modele AS taxi_modele,
                c.nom AS chauffeur_nom, c.prenom AS chauffeur_prenom, c.telephone AS chauffeur_telephone
            FROM reservations r
            LEFT JOIN taxis t ON t.id = r.taxi_id
            LEFT JOIN chauffeurs c ON c.id = r.chauffeur_id
            WHERE r.id = :id
        ");

        $stmt->execute([':id' => $id]);

        $reservation = $stmt->fetch();

        if (!$reservation) {
            return null;
        }

        $reservation['historique'] = $this->history($id);

        return $reservation;
    }

    public function findByReference(string $reference): ?array
    {
        $stmt = $this->db->prepare("
            SELECT
                r.*,
                t.immatriculation, t.marque AS taxi_marque, t.modele AS taxi_modele,
                c.nom AS chauffeur_nom, c.prenom AS chauffeur_prenom, c.telephone AS chauffeur_telephone
            FROM reservations r
            LEFT JOIN taxis t ON t.id = r.taxi_id
            LEFT JOIN chauffeurs c ON c.id = r.chauffeur_id
            WHERE r.reference = :reference
        ");

        $stmt->execute([':reference' => $reference]);

        $reservation = $stmt->fetch();

        if (!$reservation) {
            return null;
        }

        $reservation['historique'] = $this->history((int) $reservation['id']);

        return $reservation;
    }

    /**
     * Recherche "de secours" quand le client a perdu sa référence : renvoie
     * ses réservations récentes à partir du numéro de téléphone utilisé.
     * Volontairement limité à quelques champs non sensibles (pas de coordonnées
     * complètes d'un tiers) : de quoi identifier la bonne réservation, rien de plus.
     */
    public function findByTelephone(string $telephone): array
    {
        $stmt = $this->db->prepare("
            SELECT reference, lieu_depart, destination, date_heure, statut, created_at
            FROM reservations
            WHERE telephone_client = :telephone
            ORDER BY created_at DESC
            LIMIT 10
        ");

        $stmt->execute([':telephone' => $telephone]);

        return $stmt->fetchAll();
    }

    public function history(int $reservationId): array
    {
        $stmt = $this->db->prepare("
            SELECT h.*, a.nom AS admin_nom, a.prenom AS admin_prenom
            FROM reservation_status_history h
            LEFT JOIN admins a ON a.id = h.admin_id
            WHERE h.reservation_id = :id
            ORDER BY h.created_at ASC
        ");

        $stmt->execute([':id' => $reservationId]);

        return $stmt->fetchAll();
    }

    /**
     * Cherche une réservation active qui occupe déjà ce taxi à la même date
     * et à la même heure mais pour un AUTRE trajet (un taxi ne peut pas être
     * à deux endroits différents au même moment).
     *
     * Un même trajet à la même heure n'est pas un conflit : le taxi peut
     * prendre plusieurs clients qui font la même course.
     *
     * Les réservations annulées ou terminées sont ignorées.
     */
    public function findTaxiConflict(
        int $taxiId,
        string $dateHeure,
        string $lieuDepart,
        string $destination,
        int $excludeReservationId
    ): ?array {
        $stmt = $this->db->prepare("
            SELECT id, reference, lieu_depart, destination, date_heure
            FROM reservations
            WHERE taxi_id = :taxi_id
              AND id <> :id
              AND date_heure = :date_heure
              AND statut IN ('en_attente', 'confirmee')
        ");

        $stmt->execute([
            ':taxi_id' => $taxiId,
            ':id' => $excludeReservationId,
            ':date_heure' => $dateHeure
        ]);

        foreach ($stmt->fetchAll() as $other) {
            if (!self::memeTrajet($lieuDepart, $destination, $other['lieu_depart'], $other['destination'])) {
                return $other;
            }
        }

        return null;
    }

    /**
     * Deux trajets sont identiques si départ ET destination sont les mêmes
     * (comparaison insensible à la casse et aux espaces de début/fin).
     */
    public static function memeTrajet(string $departA, string $destA, string $departB, string $destB): bool
    {
        $normalize = static fn (string $v): string => mb_strtolower(trim($v));

        return $normalize($departA) === $normalize($departB)
            && $normalize($destA) === $normalize($destB);
    }

    public static function statutsValides(): array
    {
        return self::STATUTS_VALIDES;
    }

    /**
     * Met à jour le statut d'une réservation, journalise le changement et,
     * lorsqu'un taxi/chauffeur est fourni, les assigne à la réservation.
     */
    public function updateStatut(
        int $id,
        string $nouveauStatut,
        ?string $commentaire,
        ?int $adminId,
        ?int $taxiId = null,
        ?int $chauffeurId = null
    ): ?array {
        $current = $this->find($id);

        if ($current === null) {
            return null;
        }

        $this->db->beginTransaction();

        try {
            $sql = "UPDATE reservations SET statut = :statut";
            $params = [':statut' => $nouveauStatut, ':id' => $id];

            if ($taxiId !== null) {
                $sql .= ", taxi_id = :taxi_id";
                $params[':taxi_id'] = $taxiId;
            }

            if ($chauffeurId !== null) {
                $sql .= ", chauffeur_id = :chauffeur_id";
                $params[':chauffeur_id'] = $chauffeurId;
            }

            $sql .= " WHERE id = :id";

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            $historyStmt = $this->db->prepare("
                INSERT INTO reservation_status_history (
                    reservation_id, ancien_statut, nouveau_statut, commentaire, admin_id
                )
                VALUES (:reservation_id, :ancien_statut, :nouveau_statut, :commentaire, :admin_id)
            ");

            $historyStmt->execute([
                ':reservation_id' => $id,
                ':ancien_statut' => $current['statut'],
                ':nouveau_statut' => $nouveauStatut,
                ':commentaire' => $commentaire,
                ':admin_id' => $adminId
            ]);

            $notificationModel = new Notification($this->db);
            $notificationModel->create(
                $id,
                'statut_change',
                "Réservation {$current['reference']} : statut changé en « " . self::libelleStatut($nouveauStatut) . " »"
            );

            $this->db->commit();

        } catch (Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }

        $updated = $this->find($id);

        // Notification "best-effort" par email au client, hors transaction :
        // un échec d'envoi ne doit jamais faire échouer la mise à jour du
        // statut elle-même.
        if (!empty($updated['email_client'])) {
            Mailer::send(
                $updated['email_client'],
                "Votre réservation {$updated['reference']} — " . self::libelleStatut($nouveauStatut),
                "Bonjour {$updated['prenom_client']},\n\n" .
                "Le statut de votre réservation {$updated['reference']} " .
                "({$updated['lieu_depart']} → {$updated['destination']}) " .
                "est maintenant : " . self::libelleStatut($nouveauStatut) . ".\n\n" .
                ($commentaire ? "Commentaire : {$commentaire}\n\n" : '') .
                "Vous pouvez suivre votre réservation à tout moment avec la référence {$updated['reference']}.\n\n" .
                "— TaxiGo"
            );
        }

        return $updated;
    }

    public static function libelleStatut(string $statut): string
    {
        return match ($statut) {
            'en_attente' => 'En attente',
            'confirmee' => 'Confirmée',
            'annulee' => 'Annulée',
            'terminee' => 'Terminée',
            default => $statut
        };
    }

    /**
     * Statistiques simples pour le tableau de bord admin.
     */
    public function stats(): array
    {
        $stmt = $this->db->query("
            SELECT statut, COUNT(*) AS total
            FROM reservations
            GROUP BY statut
        ");

        $counts = array_fill_keys(self::STATUTS_VALIDES, 0);

        foreach ($stmt->fetchAll() as $row) {
            $counts[$row['statut']] = (int) $row['total'];
        }

        $totalStmt = $this->db->query("SELECT COUNT(*) AS total FROM reservations");
        $total = (int) $totalStmt->fetch()['total'];

        $todayStmt = $this->db->query("
            SELECT COUNT(*) AS total FROM reservations
            WHERE created_at::date = CURRENT_DATE
        ");
        $today = (int) $todayStmt->fetch()['total'];

        return [
            'total' => $total,
            'aujourdhui' => $today,
            'par_statut' => $counts
        ];
    }

    private function generateReference(): string
    {
        do {
            $reference = 'RES-' .
                date('Ymd') .
                '-' .
                strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));

            $stmt = $this->db->prepare(
                "SELECT id FROM reservations WHERE reference = :reference"
            );

            $stmt->execute([':reference' => $reference]);

        } while ($stmt->fetch());

        return $reference;
    }
}
