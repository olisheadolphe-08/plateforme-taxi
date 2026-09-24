<?php

declare(strict_types=1);

require_once __DIR__ . '/../utils/Env.php';
Env::load(__DIR__ . '/../.env');

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../utils/Jwt.php';
require_once __DIR__ . '/../utils/Mailer.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

require_once __DIR__ . '/../models/Admin.php';
require_once __DIR__ . '/../models/Reservation.php';
require_once __DIR__ . '/../models/Taxi.php';
require_once __DIR__ . '/../models/Chauffeur.php';
require_once __DIR__ . '/../models/Notification.php';

require_once __DIR__ . '/../controllers/AuthController.php';
require_once __DIR__ . '/../controllers/ReservationController.php';
require_once __DIR__ . '/../controllers/TaxiController.php';
require_once __DIR__ . '/../controllers/ChauffeurController.php';
require_once __DIR__ . '/../controllers/NotificationController.php';

$database = new Database();
$db = $database->connect();

require_once __DIR__ . '/../routes/api.php';
