-- Migration : ajout du système de notifications
-- À exécuter une seule fois sur une base déjà créée avec l'ancien schema.sql :
--
--   psql -U postgres -d plateforme_taxi -f database/migration_notifications.sql

CREATE TABLE IF NOT EXISTS notifications (
    id BIGSERIAL PRIMARY KEY,

    reservation_id BIGINT NOT NULL,

    type VARCHAR(30) NOT NULL
        CHECK (type IN ('nouvelle_reservation', 'statut_change')),

    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notification_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
