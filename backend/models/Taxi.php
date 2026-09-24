<?php

class Taxi
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function all(?string $statut = null): array
    {
        $sql = "
            SELECT
                t.id, t.immatriculation, t.modele, t.marque,
                t.nombre_places, t.statut, t.chauffeur_id,
                t.created_at, t.updated_at,
                c.nom AS chauffeur_nom, c.prenom AS chauffeur_prenom
            FROM taxis t
            LEFT JOIN chauffeurs c ON c.id = t.chauffeur_id
        ";

        $params = [];

        if ($statut !== null) {
            $sql .= " WHERE t.statut = :statut";
            $params[':statut'] = $statut;
        }

        $sql .= " ORDER BY t.created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM taxis WHERE id = :id");
        $stmt->execute([':id' => $id]);

        $taxi = $stmt->fetch();

        return $taxi ?: null;
    }

    public function immatriculationExists(string $immatriculation, ?int $excludeId = null): bool
    {
        $sql = "SELECT id FROM taxis WHERE immatriculation = :immatriculation";
        $params = [':immatriculation' => $immatriculation];

        if ($excludeId !== null) {
            $sql .= " AND id != :id";
            $params[':id'] = $excludeId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return (bool) $stmt->fetch();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO taxis (immatriculation, modele, marque, nombre_places, statut, chauffeur_id)
            VALUES (:immatriculation, :modele, :marque, :nombre_places, :statut, :chauffeur_id)
            RETURNING id
        ");

        $stmt->execute([
            ':immatriculation' => $data['immatriculation'],
            ':modele' => $data['modele'],
            ':marque' => $data['marque'],
            ':nombre_places' => $data['nombre_places'],
            ':statut' => $data['statut'] ?? 'disponible',
            ':chauffeur_id' => $data['chauffeur_id'] ?: null
        ]);

        return (int) $stmt->fetchColumn();
    }

    public function update(int $id, array $data): void
    {
        $stmt = $this->db->prepare("
            UPDATE taxis SET
                immatriculation = :immatriculation,
                modele = :modele,
                marque = :marque,
                nombre_places = :nombre_places,
                statut = :statut,
                chauffeur_id = :chauffeur_id
            WHERE id = :id
        ");

        $stmt->execute([
            ':immatriculation' => $data['immatriculation'],
            ':modele' => $data['modele'],
            ':marque' => $data['marque'],
            ':nombre_places' => $data['nombre_places'],
            ':statut' => $data['statut'],
            ':chauffeur_id' => $data['chauffeur_id'] ?: null,
            ':id' => $id
        ]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare("DELETE FROM taxis WHERE id = :id");
        $stmt->execute([':id' => $id]);
    }
}
