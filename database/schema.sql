-- =====================================================================
-- Plateforme de réservation de taxi — schéma de base de données
-- Moteur : PostgreSQL 13+
-- =====================================================================
--
-- Ce script suppose que la base existe déjà et est vide. Créez-la
-- séparément avant d'exécuter ce fichier, par exemple :
--
--   createdb plateforme_taxi
--   psql -d plateforme_taxi -f schema.sql
--
-- (PostgreSQL ne permet pas de faire CREATE DATABASE + s'y connecter
-- dans le même script, contrairement à MySQL.)

-- ---------------------------------------------------------------------
-- Fonction utilitaire : met à jour "updated_at" à chaque UPDATE.
-- Remplace le ON UPDATE CURRENT_TIMESTAMP de MySQL, qui n'existe pas
-- en PostgreSQL.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============
-- TABLE : admins
-- ==============
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_admins_updated_at
    BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==================
-- TABLE : chauffeurs
-- ==================
CREATE TABLE chauffeurs (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(30) NOT NULL,
    numero_permis VARCHAR(100) NOT NULL UNIQUE,

    -- PostgreSQL n'a pas de type ENUM inline : VARCHAR + CHECK, plus
    -- simple à faire évoluer qu'un vrai type ENUM (pas d'ALTER TYPE).
    statut VARCHAR(20) NOT NULL DEFAULT 'disponible'
        CHECK (statut IN ('disponible', 'indisponible', 'en_course')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER trg_chauffeurs_updated_at
    BEFORE UPDATE ON chauffeurs
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =============
-- TABLE : taxis
-- =============
CREATE TABLE taxis (
    id SERIAL PRIMARY KEY,
    immatriculation VARCHAR(30) NOT NULL UNIQUE,
    modele VARCHAR(100) NOT NULL,
    marque VARCHAR(100) NOT NULL,
    nombre_places SMALLINT NOT NULL DEFAULT 4,

    statut VARCHAR(20) NOT NULL DEFAULT 'disponible'
        CHECK (statut IN ('disponible', 'indisponible', 'en_course')),

    chauffeur_id INT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_taxi_chauffeur
        FOREIGN KEY (chauffeur_id)
        REFERENCES chauffeurs(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TRIGGER trg_taxis_updated_at
    BEFORE UPDATE ON taxis
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ====================
-- TABLE : reservations
-- ====================
CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    reference VARCHAR(30) NOT NULL UNIQUE,

    nom_client VARCHAR(100) NOT NULL,
    prenom_client VARCHAR(100) NOT NULL,
    telephone_client VARCHAR(30) NOT NULL,
    email_client VARCHAR(150) NULL,

    lieu_depart VARCHAR(255) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    date_heure TIMESTAMP NOT NULL,
    nombre_passagers SMALLINT NOT NULL,
    remarque TEXT NULL,

    statut VARCHAR(20) NOT NULL DEFAULT 'en_attente'
        CHECK (statut IN ('en_attente', 'confirmee', 'annulee', 'terminee')),

    taxi_id INT NULL,
    chauffeur_id INT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reservation_taxi
        FOREIGN KEY (taxi_id)
        REFERENCES taxis(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_reservation_chauffeur
        FOREIGN KEY (chauffeur_id)
        REFERENCES chauffeurs(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE TRIGGER trg_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Index (PostgreSQL ne permet pas INDEX(...) inline dans CREATE TABLE).
-- Pas besoin d'indexer "reference" : la contrainte UNIQUE crée déjà un
-- index dessus automatiquement.
CREATE INDEX idx_reservation_statut ON reservations(statut);
CREATE INDEX idx_reservation_date ON reservations(date_heure);
CREATE INDEX idx_reservation_taxi ON reservations(taxi_id);

-- =====================
-- historique des statuts
-- =====================
CREATE TABLE reservation_status_history (
    id BIGSERIAL PRIMARY KEY,

    reservation_id BIGINT NOT NULL,

    ancien_statut VARCHAR(20) NULL
        CHECK (ancien_statut IN ('en_attente', 'confirmee', 'annulee', 'terminee')),

    nouveau_statut VARCHAR(20) NOT NULL
        CHECK (nouveau_statut IN ('en_attente', 'confirmee', 'annulee', 'terminee')),

    commentaire TEXT NULL,

    admin_id INT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_history_reservation
        FOREIGN KEY (reservation_id)
        REFERENCES reservations(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_history_admin
        FOREIGN KEY (admin_id)
        REFERENCES admins(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX idx_history_reservation ON reservation_status_history(reservation_id);
CREATE INDEX idx_history_date ON reservation_status_history(created_at);

-- Crée ton premier compte administrateur avec :
--   php backend/scripts/create-admin.php

