<?php

class Chauffeur
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function all(?string $statut = null): array
    {
        $sql = "SELECT * FROM chauffeurs";
        $params = [];

        if ($statut !== null) {
            $sql .= " WHERE statut = :statut";
            $params[':statut'] = $statut;
        }

        $sql .= " ORDER BY created_at DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT * FROM chauffeurs WHERE id = :id");
        $stmt->execute([':id' => $id]);

        $chauffeur = $stmt->fetch();

        return $chauffeur ?: null;
    }

    public function permisExists(string $numeroPermis, ?int $excludeId = null): bool
    {
        $sql = "SELECT id FROM chauffeurs WHERE numero_permis = :numero_permis";
        $params = [':numero_permis' => $numeroPermis];

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
            INSERT INTO chauffeurs (nom, prenom, telephone, numero_permis, statut)
            VALUES (:nom, :prenom, :telephone, :numero_permis, :statut)
            RETURNING id
        ");

        $stmt->execute([
            ':nom' => $data['nom'],
            ':prenom' => $data['prenom'],
            ':telephone' => $data['telephone'],
            ':numero_permis' => $data['numero_permis'],
            ':statut' => $data['statut'] ?? 'disponible'
        ]);

        return (int) $stmt->fetchColumn();
    }

    public function update(int $id, array $data): void
    {
        $stmt = $this->db->prepare("
            UPDATE chauffeurs SET
                nom = :nom,
                prenom = :prenom,
                telephone = :telephone,
                numero_permis = :numero_permis,
                statut = :statut
            WHERE id = :id
        ");

        $stmt->execute([
            ':nom' => $data['nom'],
            ':prenom' => $data['prenom'],
            ':telephone' => $data['telephone'],
            ':numero_permis' => $data['numero_permis'],
            ':statut' => $data['statut'],
            ':id' => $id
        ]);
    }

    public function delete(int $id): void
    {
        // Détache le chauffeur de tout taxi avant suppression
        $this->db->prepare("UPDATE taxis SET chauffeur_id = NULL WHERE chauffeur_id = :id")
            ->execute([':id' => $id]);

        $stmt = $this->db->prepare("DELETE FROM chauffeurs WHERE id = :id");
        $stmt->execute([':id' => $id]);
    }
}
