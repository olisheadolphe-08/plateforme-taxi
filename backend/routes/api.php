<?php

$requestMethod = $_SERVER['REQUEST_METHOD'];

$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normalise un éventuel slash final ("/api/taxis/" -> "/api/taxis")
if (strlen($requestUri) > 1) {
    $requestUri = rtrim($requestUri, '/');
}

/*
|--------------------------------------------------------------------------
| Routes publiques — réservations client
|--------------------------------------------------------------------------
*/

if ($requestMethod === 'POST' && str_ends_with($requestUri, '/api/reservations')) {
    (new ReservationController(new Reservation($db)))->store();
}

if ($requestMethod === 'GET' && str_ends_with($requestUri, '/api/reservations/lookup')) {
    (new ReservationController(new Reservation($db)))->lookup();
}

if ($requestMethod === 'GET' && str_ends_with($requestUri, '/api/reservations/lookup-par-telephone')) {
    (new ReservationController(new Reservation($db)))->lookupByTelephone();
}

/*
|--------------------------------------------------------------------------
| Authentification admin
|--------------------------------------------------------------------------
*/

if ($requestMethod === 'POST' && str_ends_with($requestUri, '/api/auth/login')) {
    (new AuthController(new Admin($db)))->login();
}

if ($requestMethod === 'GET' && str_ends_with($requestUri, '/api/auth/me')) {
    $payload = AuthMiddleware::handle();
    (new AuthController(new Admin($db)))->me($payload);
}

/*
|--------------------------------------------------------------------------
| Routes protégées — back-office
|--------------------------------------------------------------------------
*/

if (str_contains($requestUri, '/api/admin/')) {
    $authPayload = AuthMiddleware::handle();

    // GET /api/admin/dashboard
    if ($requestMethod === 'GET' && str_ends_with($requestUri, '/api/admin/dashboard')) {
        (new ReservationController(new Reservation($db)))->dashboard();
    }

    // GET /api/admin/reservations
    if ($requestMethod === 'GET' && str_ends_with($requestUri, '/api/admin/reservations')) {
        (new ReservationController(new Reservation($db)))->index();
    }

    // PATCH /api/admin/reservations/{id}/statut
    if (
        $requestMethod === 'PATCH' &&
        preg_match('#/api/admin/reservations/(\d+)/statut$#', $requestUri, $m)
    ) {
        (new ReservationController(new Reservation($db)))->updateStatut((int) $m[1], $authPayload);
    }

    // GET /api/admin/reservations/{id}
    if (
        $requestMethod === 'GET' &&
        preg_match('#/api/admin/reservations/(\d+)$#', $requestUri, $m)
    ) {
        (new ReservationController(new Reservation($db)))->show((int) $m[1]);
    }

    // GET /api/admin/taxis
    if ($requestMethod === 'GET' && str_ends_with($requestUri, '/api/admin/taxis')) {
        (new TaxiController(new Taxi($db)))->index();
    }

    // POST /api/admin/taxis
    if ($requestMethod === 'POST' && str_ends_with($requestUri, '/api/admin/taxis')) {
        (new TaxiController(new Taxi($db)))->store();
    }

    // PATCH /api/admin/taxis/{id}
    if (
        $requestMethod === 'PATCH' &&
        preg_match('#/api/admin/taxis/(\d+)$#', $requestUri, $m)
    ) {
        (new TaxiController(new Taxi($db)))->update((int) $m[1]);
    }

    // DELETE /api/admin/taxis/{id}
    if (
        $requestMethod === 'DELETE' &&
        preg_match('#/api/admin/taxis/(\d+)$#', $requestUri, $m)
    ) {
        (new TaxiController(new Taxi($db)))->destroy((int) $m[1]);
    }

    // GET /api/admin/chauffeurs
    if ($requestMethod === 'GET' && str_ends_with($requestUri, '/api/admin/chauffeurs')) {
        (new ChauffeurController(new Chauffeur($db)))->index();
    }

    // POST /api/admin/chauffeurs
    if ($requestMethod === 'POST' && str_ends_with($requestUri, '/api/admin/chauffeurs')) {
        (new ChauffeurController(new Chauffeur($db)))->store();
    }

    // PATCH /api/admin/chauffeurs/{id}
    if (
        $requestMethod === 'PATCH' &&
        preg_match('#/api/admin/chauffeurs/(\d+)$#', $requestUri, $m)
    ) {
        (new ChauffeurController(new Chauffeur($db)))->update((int) $m[1]);
    }

    // DELETE /api/admin/chauffeurs/{id}
    if (
        $requestMethod === 'DELETE' &&
        preg_match('#/api/admin/chauffeurs/(\d+)$#', $requestUri, $m)
    ) {
        (new ChauffeurController(new Chauffeur($db)))->destroy((int) $m[1]);
    }

    // GET /api/admin/notifications
    if ($requestMethod === 'GET' && str_ends_with($requestUri, '/api/admin/notifications')) {
        (new NotificationController(new Notification($db)))->index();
    }

    // GET /api/admin/notifications/non-lues
    if ($requestMethod === 'GET' && str_ends_with($requestUri, '/api/admin/notifications/non-lues')) {
        (new NotificationController(new Notification($db)))->unreadCount();
    }

    // PATCH /api/admin/notifications/lues (toutes)
    if ($requestMethod === 'PATCH' && str_ends_with($requestUri, '/api/admin/notifications/lues')) {
        (new NotificationController(new Notification($db)))->markAllRead();
    }

    // PATCH /api/admin/notifications/{id}/lue
    if (
        $requestMethod === 'PATCH' &&
        preg_match('#/api/admin/notifications/(\d+)/lue$#', $requestUri, $m)
    ) {
        (new NotificationController(new Notification($db)))->markRead((int) $m[1]);
    }
}

/*
|--------------------------------------------------------------------------
| Route inconnue
|--------------------------------------------------------------------------
*/

Response::error('Route introuvable.', null, 404);
