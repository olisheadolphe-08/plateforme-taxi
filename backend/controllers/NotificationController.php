<?php

class NotificationController
{
    private Notification $notificationModel;

    public function __construct(Notification $notificationModel)
    {
        $this->notificationModel = $notificationModel;
    }

    /**
     * GET /api/admin/notifications (protégé)
     */
    public function index(): never
    {
        Response::success('Dernières notifications.', $this->notificationModel->recent());
    }

    /**
     * GET /api/admin/notifications/non-lues (protégé)
     */
    public function unreadCount(): never
    {
        Response::success('Nombre de notifications non lues.', [
            'count' => $this->notificationModel->unreadCount()
        ]);
    }

    /**
     * PATCH /api/admin/notifications/{id}/lue (protégé)
     */
    public function markRead(int $id): never
    {
        $ok = $this->notificationModel->markRead($id);

        if (!$ok) {
            Response::error('Notification introuvable.', null, 404);
        }

        Response::success('Notification marquée comme lue.', null);
    }

    /**
     * PATCH /api/admin/notifications/lues (protégé)
     */
    public function markAllRead(): never
    {
        $this->notificationModel->markAllRead();

        Response::success('Toutes les notifications ont été marquées comme lues.', null);
    }
}
