<?php

class Admin
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT id, nom, prenom, email, password FROM admins WHERE email = :email"
        );

        $stmt->execute([':email' => $email]);

        $admin = $stmt->fetch();

        return $admin ?: null;
    }

    public function create(string $nom, string $prenom, string $email, string $hashedPassword): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO admins (nom, prenom, email, password)
            VALUES (:nom, :prenom, :email, :password)
            RETURNING id
        ");

        $stmt->execute([
            ':nom' => $nom,
            ':prenom' => $prenom,
            ':email' => $email,
            ':password' => $hashedPassword
        ]);

        return (int) $stmt->fetchColumn();
    }
}
