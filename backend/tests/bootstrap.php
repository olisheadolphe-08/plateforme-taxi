<?php

/**
 * Bootstrap minimal pour les tests unitaires : on charge uniquement les
 * classes dont la logique pure est testée (validation, JWT, formatage de
 * statut...), sans jamais se connecter à une base de données. Ces tests ne
 * couvrent donc pas les requêtes SQL elles-mêmes, mais toute la logique
 * métier qui peut être vérifiée indépendamment.
 */

require_once __DIR__ . '/../utils/Jwt.php';
require_once __DIR__ . '/../utils/Env.php';
require_once __DIR__ . '/../models/Reservation.php';
require_once __DIR__ . '/../controllers/ReservationController.php';
