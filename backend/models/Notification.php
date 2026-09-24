<?php

class Notification
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    /**
     * Crée une notification liée à une réservation. Utilisé en interne par
     * le modèle Reservation (nouvelle demande / changement de statut).
     */
    public function create(int $reservationId, string $type, string $message): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO notifications (reservation_id, type, message)
            VALUES (:reservation_id, :type, :message)
            RETURNING id
        ");

        $stmt->execute([
            ':reservation_id' => $reservationId,
            ':type' => $type,
            ':message' => $message
        ]);

        return (int) $stmt->fetchColumn();
    }

    /**
     * Dernières notifications pour le back-office, les plus récentes
     * d'abord, avec la référence de la réservation associée.
     */
    public function recent(int $limit = 20): array
    {
        $stmt = $this->db->prepare("
            SELECT n.*, r.reference AS reservation_reference
            FROM notifications n
            JOIN reservations r ON r.id = n.reservation_id
            ORDER BY n.created_at DESC
            LIMIT :limit
        ");

        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    public function unreadCount(): int
    {
        $stmt = $this->db->query("SELECT COUNT(*) FROM notifications WHERE is_read = FALSE");

        return (int) $stmt->fetchColumn();
    }

    public function markRead(int $id): bool
    {
        $stmt = $this->db->prepare("UPDATE notifications SET is_read = TRUE WHERE id = :id");
        $stmt->execute([':id' => $id]);

        return $stmt->rowCount() > 0;
    }

    public function markAllRead(): void
    {
        $this->db->exec("UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE");
    }
}
